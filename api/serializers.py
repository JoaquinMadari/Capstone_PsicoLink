from rest_framework import serializers
from .models import CustomUser, PacienteProfile, PsicologoProfile, OrganizacionProfile, Specialty
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


from django.utils import timezone
from django.conf import settings
from .models import Appointment
from django.contrib.auth import get_user_model
from django.db import transaction
from datetime import timedelta


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('email', 'password', 'role', 'first_name', 'last_name') 
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            first_name=validated_data.get('first_name', ''), 
            last_name=validated_data.get('last_name', '')
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role')


#--------------------------------------------------
# ----- AQUI ESTAN LOS SERIALIZERS POR ROL --------
#--------------------------------------------------

class PsicologoProfileSerializer(serializers.ModelSerializer):
    #Serializador para que el profesional complete su perfil después del registro.
    address = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.CharField(required=False, allow_blank=True)

    #certificates = serializers.FileField(required=False) 
    #curriculum_vitae = serializers.FileField(required=False)

    #TEMPORAL QUITAR ESTO DESPUES Y AGREGAR LO QUE ESTA ARRIBA
    certificates = serializers.CharField(required=False, allow_blank=True) 
    curriculum_vitae = serializers.CharField(required=False, allow_blank=True)
    
    #TEMPORAL
    experience_years = serializers.IntegerField(required=False, allow_null=True)

    specialty_label = serializers.SerializerMethodField(read_only=True)
    specialty = serializers.ChoiceField(choices=Specialty.choices)
    specialty_other = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = PsicologoProfile
        fields = [
            'rut', 'age', 'gender', 'nationality', 'phone', 
            'specialty','specialty_label','specialty_other', 
            'license_number', 'main_focus', 
            'therapeutic_techniques', 'style_of_attention', 
            'attention_schedule', 'work_modality', 'certificates',
            'address', 'payment_method',
            
            # Opcionales si quieres que se rellenen aquí también
            'inclusive_orientation', 'languages', 'experience_years', 'curriculum_vitae'
        ]

    def validate(self, data):
        spec = data.get('specialty', getattr(self.instance, 'specialty', None))
        other = data.get('specialty_other', getattr(self.instance, 'specialty_other', None))

        if spec == Specialty.OTRO:
            if not other or not str(other).strip():
                raise serializers.ValidationError({'specialty_other': 'Indica tu especialidad.'})
            if len(str(other).strip()) > 100:
                raise serializers.ValidationError({'specialty_other': 'Máximo 100 caracteres.'})
        else:
            data['specialty_other'] = None

        return data

    def get_specialty_label(self, obj):
        if obj.specialty == Specialty.OTRO and obj.specialty_other:
            return obj.specialty_other
        return obj.get_specialty_display()
    
        
    def create(self, validated_data):
        # La vista ProfileSetupView le pasa el usuario autenticado
        user = self.context['user'] 
        
        validated_data.pop('certificates', None)
        validated_data.pop('curriculum_vitae', None)
        validated_data.pop('address', None)
        validated_data.pop('payment_method', None)
        
        # Manejar experience_years si llega como cadena vacía
        exp_years = validated_data.get('experience_years')
        if exp_years == '' or exp_years is None:
             # Si es opcional en el modelo (null=True), lo eliminamos para que guarde NULL
             validated_data.pop('experience_years', None)

        # Crear la instancia del perfil vinculada al usuario
        profile = PsicologoProfile.objects.create(user=user, **validated_data)
        return profile
    

class PacienteProfileSerializer(serializers.ModelSerializer):
    #Serializador para que el paciente complete su perfil después del registro.
    address = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PacienteProfile
        fields = [
            'rut', 'age', 'gender', 'nationality', 'phone', 
            'inclusive_orientation', 'base_disease', 'disability',
            'address', 'payment_method',
            
            # Opcionales
            'description', 'consultation_reason', 
            'preference_modality', 'preferred_focus'
        ]
        
    def create(self, validated_data):
        user = self.context['user']

        validated_data.pop('address', None)
        validated_data.pop('payment_method', None)

        # Crear la instancia del perfil vinculada al usuario
        profile = PacienteProfile.objects.create(user=user, **validated_data)
        return profile
    

class OrganizacionProfileSerializer(serializers.ModelSerializer):
    """ Serializador para que la organización complete su perfil después del registro. """
    
    class Meta:
        model = OrganizacionProfile
        # Incluye todos los campos de la Organización.
        fields = [
            'organization_name', 'organization_rut', 'contact_email',
            'contact_phone', 'num_employees', 'company_sector', 
            'location', 'service_type_required', 'preference_modality', 
            'type_of_attention', 'service_frequency'
        ]
        
    def create(self, validated_data):
        user = self.context['user']
        # Crear la instancia del perfil vinculada al usuario
        profile = OrganizacionProfile.objects.create(user=user, **validated_data)
        return profile
    
#--------------------------------------------
# ----- FIN DE LOS SERIALIZERS POR ROL ------
#--------------------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    #Extiende el serializer de JWT para incluir el rol del usuario en la respuesta.
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Añade el campo 'role' al payload del token
        token['role'] = user.role 

        return token

    def validate(self, attrs):
        # Llama a la validación base (que obtiene los tokens)
        data = super().validate(attrs)

        # Añade el campo 'role' a la respuesta JSON del login
        data['user'] = {
            'role': self.user.role
        }
        
        return data



#AQUI EMPIEZAN LAS CITAS (APPOINTMENTS)

User = get_user_model()

ROLE_DURATION_LIMITS = getattr(settings, 'ROLE_DURATION_LIMITS', {
    'psiquiatria': (15, 60),
    'psicologia_clinica': (30, 120),
    'infanto_juvenil': (45, 90),
    'pareja_familia': (50, 90),
    'neuropsicologia': (45, 120),
    'sexologia_clinica': (45, 90),
    'adicciones': (45, 90),
    'gerontopsicologia': (45, 90),
    'psicologia_salud': (45, 90),
    'evaluacion_psicologica': (30, 120),
    'psicologia_educativa': (45, 90),
    'default': (15, 120),
})


class AppointmentSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    professional_detail = UserSerializer(source='professional', read_only=True)
    professional = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(), required=True, write_only=True)
    end_datetime = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'patient', 'professional', 'professional_detail',
            'professional_role','start_datetime', 'duration_minutes',
            'end_datetime', 'status', 'notes', 'created_at'
        )
        read_only_fields = ('created_at', 'end_datetime', 'professional_role')

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
            return data

        try:
            specialty = professional.psicologoprofile.specialty
        except AttributeError:
            specialty = None 


        if getattr(professional, 'role', 'paciente') != 'profesional' or not specialty:
            role_key = 'default'
        else:
            role_key = specialty.lower()

        min_dur, max_dur = ROLE_DURATION_LIMITS.get(role_key, ROLE_DURATION_LIMITS['default'])
        if not (min_dur <= duration <= max_dur):
            raise serializers.ValidationError({
                'duration_minutes': f"La duración debe estar entre {min_dur} y {max_dur} minutos para el profesional con especialidad '{specialty}'."
            })
        
        #VALIDACIÓN: Solapamiento con Citas del PACIENTE
        request = self.context.get('request')
        patient = request.user if request and request.user.is_authenticated else None
        patient = data.get('patient') or patient

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
        qs_professional = Appointment.objects.filter(professional=professional, status='scheduled')
        if self.instance:
            qs_professional = qs_professional.exclude(pk=self.instance.pk)
            
        overlapping_professional = [
            a for a in qs_professional.all() 
            if (a.start_datetime < end) and (a.end_datetime > start)
        ]

        if overlapping_professional: 
            raise serializers.ValidationError(
                "El profesional ya tiene una cita en ese horario. Por favor selecciona otro horario disponible."
            )

        return data
    

    # --- Creación ---
    def create(self, validated_data):
        request = self.context.get('request')
        with transaction.atomic():
            if request and request.user and request.user.is_authenticated:
                validated_data['patient'] = request.user

            # rol del profesional
            professional = validated_data.get('professional')
            if professional:
                try:
                    # especialidad si existe, si no, usar 'desconocido'
                    specialty = professional.psicologoprofile.specialty
                    validated_data['professional_role'] = specialty
                except AttributeError:
                    validated_data['professional_role'] = 'desconocido'
            return super().create(validated_data)

    def update(self, instance, validated_data):
        with transaction.atomic():
            return super().update(instance, validated_data)
    
# busca profesionales disponibles en un horario dado
class ProfessionalSearchSerializer(UserSerializer): # O hereda de ModelSerializer si UserSerializer no existe
    specialty = serializers.SerializerMethodField()
    specialty_label = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField() 

    
    class Meta(UserSerializer.Meta): # Heredamos la Meta si es posible
        model = CustomUser
        fields = UserSerializer.Meta.fields + ('specialty', 'specialty_label', 'full_name')  
        
    def get_specialty(self, obj):
        try: return obj.psicologoprofile.specialty
        except AttributeError: return None

    def get_specialty_label(self, obj):
        try:
            p = obj.psicologoprofile
            return p.specialty_other if p.specialty == Specialty.OTRO and p.specialty_other else p.get_specialty_display()
        except AttributeError:
            return None
    
    def get_full_name(self, obj):
        # 💡 Devuelve el nombre completo para la lista de resultados
        return obj.get_full_name() 




class PsicologoProfileDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    specialty_label = serializers.SerializerMethodField()

    class Meta:
        model = PsicologoProfile
        fields = [
            'user', 'rut', 'age', 'gender', 'nationality', 'phone',
            'specialty', 'specialty_label', 'specialty_other',
            'license_number', 'main_focus',
            'therapeutic_techniques', 'style_of_attention',
            'attention_schedule', 'work_modality', 'certificates',
            'inclusive_orientation', 'languages', 'experience_years',
            'curriculum_vitae', 'cases_attended', 'rating'
        ]

    def get_specialty_label(self, obj):
        if obj.specialty == Specialty.OTRO and obj.specialty_other:
            return obj.specialty_other
        return obj.get_specialty_display()