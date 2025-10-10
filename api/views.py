from django.shortcuts import render

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser, Appointment
from .serializers import (RegisterSerializer, UserSerializer, AppointmentSerializer,
    PsicologoProfileSerializer, PacienteProfileSerializer, OrganizacionProfileSerializer,
    ProfessionalSearchSerializer)


from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from django.utils import timezone
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
        # allow owner patient to modify their appointment (for cancellation) and professional to mark completed
        return obj.patient == request.user or obj.professional == request.user




class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet que gestiona las citas entre pacientes y profesionales.
    Incluye validación de permisos y representación mejorada de datos.
    """
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




class ProfesionalSearchView(generics.ListAPIView):
    serializer_class = ProfessionalSearchSerializer 
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # 1. Ajuste de Filtrado
    # El campo está en el modelo Profile, relacionado al User (CustomUser)
    filterset_fields = ['psicologoprofile__specialty'] # <--- CORRECCIÓN

    # 2. Ajuste de Búsqueda
    # Buscamos en los campos del Usuario Y el campo del Perfil
    search_fields = ['username', 'psicologoprofile__specialty'] # <--- CORRECCIÓN

    # 3. Ajuste de Ordenación (si quieres ordenar por especialidad)
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