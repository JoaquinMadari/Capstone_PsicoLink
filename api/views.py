from django.shortcuts import render

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser, Appointment, PsicologoProfile
from .serializers import (PsicologoProfileDetailSerializer, RegisterSerializer, UserSerializer, AppointmentSerializer,
    PsicologoProfileSerializer, PacienteProfileSerializer, OrganizacionProfileSerializer,
    ProfessionalSearchSerializer)


from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from django.utils import timezone
from datetime import datetime, date, time as dtime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter




class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,) # Permitir el acceso sin autenticación
    serializer_class = RegisterSerializer


class ProfileSetupView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        user = request.user
        data = request.data
        serializer = None # Inicializar el serializer
        
        # Lógica de asignación de serializador
        if user.role == 'profesional':
            serializer = PsicologoProfileSerializer(data=data, context={'user': user})
            
        elif user.role == 'paciente':
            serializer = PacienteProfileSerializer(data=data, context={'user': user})
            
        elif user.role == 'organizacion': # <-- AGREGAR LÓGICA DE ORGANIZACIÓN
            serializer = OrganizacionProfileSerializer(data=data, context={'user': user})
            
        else:
            return Response({"error": "Rol no válido para configuración de perfil."}, status=400)

        # Validación y Guardado
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Perfil completado exitosamente"}, status=200)
        
        return Response(serializer.errors, status=400)



class IsOwnerOrProfessionalOrReadOnly(permissions.BasePermission):
    """Permite acceso si user es paciente propietario (patient) o professional involved, o admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.patient == request.user or obj.professional == request.user




class AppointmentViewSet(viewsets.ModelViewSet):
    #ViewSet que gestiona las citas entre pacientes y profesionales.

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
        """
        Al crear una cita, el paciente se asigna automáticamente.
        Además, garantizamos que el rol del profesional se guarde correctamente.
        """
        appointment = serializer.save()
        if appointment.professional:
            appointment.professional_role = getattr(appointment.professional, 'role', 'desconocido')
            appointment.save(update_fields=['professional_role'])

    def create(self, request, *args, **kwargs):
        """
        Redefinimos create() para devolver información más útil tras crear la cita.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Reconsultamos el objeto recién creado para incluir datos del profesional/paciente
        appointment = serializer.instance
        response_data = AppointmentSerializer(appointment, context={'request': request}).data

        return Response(response_data, status=status.HTTP_201_CREATED)
    
    
    @action(detail=False, methods=['get'], url_path='busy', permission_classes=[permissions.IsAuthenticated])
    def busy(self, request):
        """
        Devuelve bloques ocupados para un día dado:
        GET /api/appointments/busy/?professional=##&date=YYYY-MM-DD
        Respuesta:
        {
          "professional": [{"id":..,"start":"..","end":".."}, ...],
          "patient": [{"id":..,"start":"..","end":".."}, ...]
        }
        """
        professional_id = request.query_params.get('professional')
        date_str = request.query_params.get('date')

        if not professional_id or not date_str:
            return Response({"detail": "Parámetros 'professional' y 'date' son requeridos."}, status=400)

        try:
            day = date.fromisoformat(date_str)  # YYYY-MM-DD
        except ValueError:
            return Response({"detail": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=400)

        tz = timezone.get_current_timezone()
        day_start = timezone.make_aware(datetime.combine(day, dtime.min), tz)
        day_end   = timezone.make_aware(datetime.combine(day, dtime.max), tz)

        # Profesionales ocupados ese día (citas activas/‘scheduled’) que solapan el rango del día
        qs_prof = Appointment.objects.filter(
            professional_id=professional_id,
            status='scheduled',
            time_range__overlap=(day_start, day_end),
        ).only('id', 'start_datetime', 'duration_minutes')

        # Paciente autenticado ocupado ese día
        qs_patient = Appointment.objects.filter(
            patient=request.user,
            status='scheduled',
            time_range__overlap=(day_start, day_end),
        ).only('id', 'start_datetime', 'duration_minutes')

        def serialize(qs):
            out = []
            for a in qs:
                out.append({
                    "id": a.id,
                    "start": a.start_datetime.isoformat(),
                    "end":   (a.start_datetime + timedelta(minutes=a.duration_minutes)).isoformat()
                })
            return out

        return Response({
            "professional": serialize(qs_prof),
            "patient": serialize(qs_patient)
        })




class ProfesionalSearchView(generics.ListAPIView):
    serializer_class = ProfessionalSearchSerializer 
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # El campo está en el modelo Profile, relacionado al User (CustomUser)
    filterset_fields = ['psicologoprofile__specialty']

    # Buscamos en los campos del Usuario Y el campo del Perfil
    search_fields = ['username', 'first_name', 'last_name', 'psicologoprofile__specialty']

    # Ajuste de orden
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
    

class ProfessionalDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]  # o IsAuthenticated si corresponde
    serializer_class = PsicologoProfileDetailSerializer
    lookup_url_kwarg = 'user_id'

    def get_object(self):
        user_id = self.kwargs.get(self.lookup_url_kwarg)
        return PsicologoProfile.objects.select_related('user').get(user__id=user_id)