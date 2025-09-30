from django.shortcuts import render

from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer


from rest_framework import viewsets, permissions, status
from .models import Appointment
from .serializers import AppointmentSerializer
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "token": str(refresh.access_token)
        })




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
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrProfessionalOrReadOnly]

    def get_queryset(self):
        """
        If user es patient -> return / regresa sus citas.
        If user es professional -> return / regresa sus citas como professional.
        Admin -> all.
        """
        user = self.request.user
        if user.is_staff:
            return Appointment.objects.all()
        if getattr(user, 'role', None) == 'profesional':
            return Appointment.objects.filter(professional=user)
        # default: patient
        return Appointment.objects.filter(patient=user)

    def perform_create(self, serializer):
        # patient will be assigned in serializer.create using request context,
        # but ensure professional exists and is valid
        serializer.save()

    @action(detail=False, methods=['get'], url_path='professional/(?P<professional_id>[^/.]+)')
    def by_professional(self, request, professional_id=None):
        """List appointments for a given professional (if permitted)."""
        qs = Appointment.objects.filter(professional__id=professional_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)