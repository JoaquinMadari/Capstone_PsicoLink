from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password

from django.utils import timezone
from .models import Appointment
from django.conf import settings
from .models import Appointment
from django.contrib.auth import get_user_model

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

class AppointmentSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(read_only=True)
    professional = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(), required=True)
    end_datetime = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Appointment
        fields = ('id','patient','professional','start_datetime','duration_minutes','end_datetime','status','notes','created_at')
        read_only_fields = ('status','created_at','end_datetime')

    def get_end_datetime(self, obj):
        return obj.end_datetime

    def validate_professional(self, value):
        # Ensure professional has role 'profesional' (assumes CustomUser has 'role')
        if getattr(value, 'role', None) != 'profesional':
            raise serializers.ValidationError("Selected user is not a professional.")
        return value

    def validate_start_datetime(self, value):
        # disallow booking in the past
        if value < timezone.now():
            raise serializers.ValidationError("Cannot schedule an appointment in the past.")
        return value

    def validate(self, data):
        """Check for overlapping appointments for the professional."""
        start = data.get('start_datetime')
        duration = data.get('duration_minutes', 50)
        end = start + timezone.timedelta(minutes=duration)

        professional = data.get('professional')
        # For update operations, instance exists
        instance = getattr(self, 'instance', None)

        qs = Appointment.objects.filter(
            professional=professional,
            status='scheduled'
        )

        # Exclude current instance when updating
        if instance:
            qs = qs.exclude(pk=instance.pk)

        # Overlap check/verificar que las fechas no se sobrelapen: existing.start < new_end and existing.end > new_start
        overlapping = []
        for a in qs:
            a_start = a.start_datetime
            a_end = a.end_datetime
            if (a_start < end) and (a_end > start):
                overlapping.append(a)

        if overlapping:
            raise serializers.ValidationError("The professional is not available at the selected time (conflicts with another appointment).")

        return data

    def create(self, validated_data):
        # patient set from view (request.user)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['patient'] = request.user
        return super().create(validated_data)
