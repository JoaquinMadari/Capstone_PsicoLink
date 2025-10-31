from django.shortcuts import render
from rest_framework import generics, viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser, Appointment, PsicologoProfile
from .serializers import (CustomTokenObtainPairSerializer, PsicologoProfileDetailSerializer, RegisterSerializer, UserSerializer, AppointmentSerializer,
    PsicologoProfileSerializer, PacienteProfileSerializer, OrganizacionProfileSerializer,
    ProfessionalSearchSerializer)


from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import datetime, date, time as dtime, timedelta


from api.zoom_service import create_meeting
from django.utils import timezone
from api.zoom_service import refresh_zoom_token

from django.db import transaction
from integrations.supabase_sync import ensure_supabase_user 

import logging
from rest_framework_simplejwt.views import TokenObtainPairView

# -----------------------
# Register y Specialty
# -----------------------
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)

        raw_password = ser.validated_data.get("password")
        role = ser.validated_data.get("role")

        with transaction.atomic():
            user: CustomUser = ser.save()  # crea en Django

            try:
                uid = ensure_supabase_user(email=user.email, password=raw_password, role=role)
            except Exception as e:
                transaction.set_rollback(True)
                return Response(
                    {"detail": f"Registro en Supabase falló: {str(e)}"},
                    status=status.HTTP_502_BAD_GATEWAY
                )

            user.supabase_uid = uid  # uid debe ser un UUID string válido
            user.save(update_fields=["supabase_uid"])

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        #Emite los tokens de Django (valida user/pass)
        resp = super().post(request, *args, **kwargs)

        #Repara / provisiona Supabase en el mismo request
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            if email and password:
                user = CustomUser.objects.get(email=email)

                uid = user.supabase_uid
                # Crea si falta, o re-sincroniza password si ya existe
                new_uid = ensure_supabase_user(email=user.email, password=password, role=user.role)

                if uid != new_uid:
                    user.supabase_uid = new_uid
                    user.save(update_fields=["supabase_uid"])
        except Exception as e:
            logging.exception("Supabase sync on login failed: %s", e)

        return resp


class SpecialtyListView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from .models import Specialty
        data = []
        for val, label in Specialty.choices:
            data.append({
                "value": val,
                "label": label,
                "requires_detail": (val == Specialty.OTRO)
            })
        return Response(data)

# -----------------------
# Profile Setup
# -----------------------
class ProfileSetupView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        user = request.user
        data = request.data
        serializer = None
        
        if user.role == 'profesional':
            serializer = PsicologoProfileSerializer(data=data, context={'user': user})
        elif user.role == 'paciente':
            serializer = PacienteProfileSerializer(data=data, context={'user': user})
        elif user.role == 'organizacion':
            serializer = OrganizacionProfileSerializer(data=data, context={'user': user})
        else:
            return Response({"error": "Rol no válido para configuración de perfil."}, status=400)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Perfil completado exitosamente"}, status=200)
        return Response(serializer.errors, status=400)

# -----------------------
# Permission custom
# -----------------------
class IsOwnerOrProfessionalOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.patient == request.user or obj.professional == request.user

# -----------------------
# AppointmentViewSet
# -----------------------
class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().select_related('patient', 'professional')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Appointment.objects.all().select_related('patient', 'professional')
        if getattr(user, 'role', None) == 'profesional':
            return Appointment.objects.filter(professional=user).select_related('patient', 'professional')
        return Appointment.objects.filter(patient=user).select_related('patient', 'professional')

    def perform_create(self, serializer):        
       # Crea cita y genera reunión Zoom automáticamente.
        appointment = serializer.save()

    # Guardamos rol profesional
        if appointment.professional:
            appointment.professional_role = getattr(appointment.professional, 'role', 'desconocido')

        # 🔹 Crear reunión Zoom
        try:
            # Convertir fecha a ISO 8601 UTC
            start_time = appointment.start_datetime.astimezone(timezone.utc).isoformat()

            # 🔹 Obtener perfil del profesional
            profile = appointment.professional.psicologoprofile

            # 🔹 Verificar si el token existe y no expiró
         # Debes crear esta función

            if not profile.zoom_access_token or not profile.zoom_token_expires_at or profile.zoom_token_expires_at < timezone.now():
            # Refrescar token usando refresh_token
                new_tokens = refresh_zoom_token(profile.zoom_refresh_token)
                profile.zoom_access_token = new_tokens['access_token']
                profile.zoom_refresh_token = new_tokens.get('refresh_token', profile.zoom_refresh_token)
                profile.zoom_token_expires_at = timezone.now() + timedelta(seconds=new_tokens['expires_in'])
                profile.save(update_fields=['zoom_access_token', 'zoom_refresh_token', 'zoom_token_expires_at'])

            ACCESS_TOKEN = profile.zoom_access_token

            # 🔹 Llamada a create_meeting
            zoom_data = create_meeting(
            access_token=ACCESS_TOKEN,
            user_id="me",  # token del psicólogo
            topic=f"Cita con {appointment.professional.get_full_name()}",
            start_time=start_time,
            duration=appointment.duration_minutes
        )

            # 🔹 Guardar en el modelo
            appointment.zoom_meeting_id = zoom_data.get("id")
            appointment.zoom_join_url = zoom_data.get("join_url")
            appointment.zoom_start_url = zoom_data.get("start_url")

            print("Zoom meeting creada:", zoom_data)
            print("Zoom join URL guardada:", appointment.zoom_join_url)

        except Exception as e:
            print(f"⚠️ Error al crear reunión Zoom: {e}")

        # Guardar campos en la base de datos
        appointment.save(update_fields=['professional_role', 'zoom_meeting_id', 'zoom_join_url', 'zoom_start_url'])

        try:
         spec = appointment.professional.psicologoprofile.specialty
         if appointment.professional_role != spec:
             appointment.professional_role = spec
             appointment.save(update_fields=['professional_role'])
        except PsicologoProfile.DoesNotExist:
            pass




    def create(self, request, *args, **kwargs):
        #Redefinimos create() para devolver información más útil tras crear la cita.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        appointment = serializer.instance

        # Serializamos la cita
        response_data = AppointmentSerializer(appointment, context={'request': request}).data

        # ✅ Agregamos los URLs de Zoom explícitamente
        response_data['zoom_join_url'] = appointment.zoom_join_url
        response_data['zoom_start_url'] = appointment.zoom_start_url

        return Response(response_data, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=['get'], url_path='busy', permission_classes=[permissions.IsAuthenticated])
    def busy(self, request):
        professional_id = request.query_params.get('professional')
        date_str = request.query_params.get('date')

        if not professional_id or not date_str:
            return Response({"detail": "Parámetros 'professional' y 'date' son requeridos."}, status=400)

        try:
            day = date.fromisoformat(date_str)
        except ValueError:
            return Response({"detail": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=400)

        tz = timezone.get_current_timezone()
        day_start = timezone.make_aware(datetime.combine(day, dtime.min), tz)
        day_end   = timezone.make_aware(datetime.combine(day, dtime.max), tz)

        qs_prof = Appointment.objects.filter(
            professional_id=professional_id,
            status='scheduled',
            time_range__overlap=(day_start, day_end),
        ).only('id', 'start_datetime', 'duration_minutes')

        qs_patient = Appointment.objects.filter(
            patient=request.user,
            status='scheduled',
            time_range__overlap=(day_start, day_end),
        ).only('id', 'start_datetime', 'duration_minutes')

        def serialize(qs):
            return [{
                "id": a.id,
                "start": a.start_datetime.isoformat(),
                "end": (a.start_datetime + timedelta(minutes=a.duration_minutes)).isoformat()
            } for a in qs]

        return Response({
            "professional": serialize(qs_prof),
            "patient": serialize(qs_patient)
        })

# -----------------------
# ProfesionalSearchView
# -----------------------
class ProfesionalSearchView(generics.ListAPIView):
    serializer_class = ProfessionalSearchSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['psicologoprofile__specialty']
    search_fields = ['username', 'first_name', 'last_name', 'psicologoprofile__specialty']
    ordering_fields = ['username', 'psicologoprofile__specialty']

    def get_queryset(self):
        queryset = CustomUser.objects.filter(role='profesional')
        available_only = self.request.query_params.get('available', None)
        if available_only == 'true':
            now = timezone.now()
            queryset = queryset.exclude(
                appointments_as_professional__start_datetime__lte=now,
                appointments_as_professional__end_datetime__gte=now,
                appointments_as_professional__status='scheduled'
            )
        return queryset.distinct()

# -----------------------
# ProfessionalDetailView
# -----------------------
class ProfessionalDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PsicologoProfileDetailSerializer
    lookup_url_kwarg = 'user_id'

    def get_object(self):
        user_id = self.kwargs.get(self.lookup_url_kwarg)
        return PsicologoProfile.objects.select_related('user').get(user__id=user_id)
