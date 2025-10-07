from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password

from django.utils import timezone
from django.conf import settings
from .models import Appointment
from django.contrib.auth import get_user_model
from django.db import transaction
from datetime import timedelta


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2', 'role', 'specialty', 'license_number')
        extra_kwargs = {'email': {'required': True}}

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            role=validated_data.get('role', 'paciente'),
            specialty=validated_data.get('specialty', ''),
            license_number=validated_data.get('license_number', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'specialty', 'license_number')



#AQUI EMPIEZAN LAS CITAS (APPOINTMENTS)

User = get_user_model()

ROLE_DURATION_LIMITS = getattr(settings, 'ROLE_DURATION_LIMITS', {
    'psicologo': (30, 120),
    'terapeuta': (30, 90),
    'psiquiatra': (15, 60),
    'default': (15, 120),
})


class AppointmentSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(read_only=True)
    professional = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(), required=True)
    end_datetime = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'patient', 'professional','professional_role',
            'start_datetime', 'duration_minutes',
            'end_datetime', 'status', 'notes', 'created_at'
        )
        read_only_fields = ('status', 'created_at', 'end_datetime', 'professional_role')

    def get_end_datetime(self, obj):
        return obj.end_datetime

    # --- Validaciones individuales ---
    def validate_professional(self, value):
        if getattr(value, 'role', None) != 'profesional':
            raise serializers.ValidationError("El usuario seleccionado no es un profesional.")
        return value

    def validate_start_datetime(self, value):
        now = timezone.now()
        if value < now:
            raise serializers.ValidationError("No se puede agendar en el pasado.")
        return value

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duración inválida.")
        return value

    # --- Validación integral ---
    def validate(self, data):
        start = data.get('start_datetime') or getattr(self.instance, 'start_datetime', None)
        duration = data.get('duration_minutes') or getattr(self.instance, 'duration_minutes', None)
        professional = data.get('professional') or getattr(self.instance, 'professional', None)

        if not start or not professional or not duration:
            # Se validan individualmente más arriba
            return data

        # Duración coherente por rol
        specialty = getattr(professional, 'specialty', None)

        if getattr(professional, 'role', 'paciente') != 'profesional' or not specialty:
            role_key = 'default'
        else:
            # Usamos la especialidad en minúsculas como clave
            role_key = specialty.lower()

        min_dur, max_dur = ROLE_DURATION_LIMITS.get(role_key, ROLE_DURATION_LIMITS['default'])
        if not (min_dur <= duration <= max_dur):
            raise serializers.ValidationError({
                'duration_minutes': f"La duración debe estar entre {min_dur} y {max_dur} minutos para el profesional con especialidad '{specialty}'."
            })
        
        #VALIDACIÓN: Solapamiento con Citas del PACIENTE
        request = self.context.get('request')
        patient = request.user if request and request.user.is_authenticated else None
        patient = data.get('patient') or patient # Si el campo patient se puede modificar

        # Verificar solapamientos
        end = start + timedelta(minutes=duration)

        if patient:
            #Filtrar citas activas del mismo paciente, excluyendo la actual si es una actualización
            patient_qs = Appointment.objects.filter(
                patient=patient, 
                status='scheduled'
            )
            if self.instance:
                patient_qs = patient_qs.exclude(pk=self.instance.pk)

            #Verificar solapamiento
            patient_overlapping = [
                a for a in patient_qs.all() 
                if (a.start_datetime < end) and (a.end_datetime > start)
            ]
            
            if patient_overlapping:
                # Se encontró una cita del paciente que se solapa
                raise serializers.ValidationError(
                    "Ya tienes una cita agendada que se solapa con este horario. Por favor revisa tus citas programadas."
                )

        #VALIDACIÓN: Solapamiento con Citas del Profesional
        # Filtramos citas activas del mismo profesional
        qs_professional = Appointment.objects.filter(professional=professional, status='scheduled')
        if self.instance:
            qs_professional = qs_professional.exclude(pk=self.instance.pk)
            
        # NOTA: Esto requiere que el profesional (la cita 'a') tenga el método end_datetime
        #       calculado correctamente, lo cual ya hace tu modelo Appointment.
        overlapping_professional = [
            a for a in qs_professional.all() 
            if (a.start_datetime < end) and (a.end_datetime > start)
        ]

        if overlapping_professional: 
            raise serializers.ValidationError(
                "El profesional ya tiene una cita en ese horario. Por favor selecciona otro horario disponible."
            )

        return data
    

    # --- Creación / actualización atómicas ---
    def create(self, validated_data):
        request = self.context.get('request')
        with transaction.atomic():
            if request and request.user and request.user.is_authenticated:
                validated_data['patient'] = request.user

            # Capturamos automáticamente el rol del profesional
            professional = validated_data.get('professional')
            if professional:
                validated_data['professional_role'] = getattr(professional, 'specialty', 'desconocido')
            return super().create(validated_data)

    def update(self, instance, validated_data):
        with transaction.atomic():
            return super().update(instance, validated_data)
    
# busca profesionales disponibles en un horario dado
