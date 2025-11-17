from rest_framework import serializers
from .models import CustomUser, PacienteProfile, PsicologoProfile, OrganizacionProfile, Specialty
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator

from integrations.supabase_sync import ensure_supabase_user
from integrations.supabase_sync import get_supabase_session_tokens
from django.utils import timezone
from django.conf import settings
from .models import Appointment, AppointmentNote
from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError
from datetime import timedelta



class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(
            queryset=CustomUser.objects.all(),
            message="Este email ya está registrado."
        )]
    )
    supabase_uid = serializers.UUIDField(read_only=True, allow_null=True)
    
    class Meta:
        model = CustomUser
        fields = ('email', 'password', 'role', 'first_name', 'last_name', 'supabase_uid') 
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

        # 🔹 Crear usuario en Supabase y guardar su UID
        try:
            supabase_uid = ensure_supabase_user(
                email=user.email,
                password=validated_data['password'],  # La contraseña original
                role=user.role,
                first_name=user.first_name,
                last_name=user.last_name
            )
            user.supabase_uid = supabase_uid
            user.save()
        except Exception as e:
            print("⚠️ Error al sincronizar con Supabase:", e)

        return user

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)
    supabase_uid = serializers.UUIDField(read_only=True, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'full_name','supabase_uid')

    def get_full_name(self, obj):
        name = (obj.get_full_name() or '').strip()
        return name or None


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

# ----------------------------------------
# ----- JWT + Supabase Login -------------
# ----------------------------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['supabase_uid'] = str(user.supabase_uid) if user.supabase_uid else None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Datos del usuario
        data['user'] = {
            'role': self.user.role,
            'supabase_uid': str(self.user.supabase_uid) if self.user.supabase_uid else None
        }

        # Login en Supabase
        supabase_sync = 'failed'
        supabase_access_token = None
        supabase_refresh_token = None

        try:
            tokens = get_supabase_session_tokens(
                email=self.user.email,
                password=attrs.get("password")
            )
            if tokens:
                supabase_sync = 'ok'
                supabase_access_token = tokens["access_token"]
                supabase_refresh_token = tokens["refresh_token"]
        except Exception as e:
            print("⚠️ Error Supabase:", e)

        data['supabase_sync'] = supabase_sync
        data['supabase_access_token'] = supabase_access_token
        data['supabase_refresh_token'] = supabase_refresh_token

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

class AppointmentNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentNote
        fields = ("id", "text", "fecha")



# -----------------------------
# APPOINTMENT SERIALIZER
# -----------------------------
class AppointmentNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentNote
        fields = ("id", "text", "fecha")


class AppointmentSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=['paciente', 'organizacion']),
        required=False
    )
    professional = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='profesional'),
        required=True
    )

    patient_detail = serializers.SerializerMethodField(read_only=True)
    professional_detail = serializers.SerializerMethodField(read_only=True)
    historial = AppointmentNoteSerializer(many=True, read_only=True)
    end_datetime = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'patient', 'patient_detail', 'professional', 'professional_detail',
            'professional_role', 'start_datetime', 'duration_minutes', 'end_datetime',
            'status', 'modality', 'reason', 'notes', 'created_at',
            'zoom_join_url', 'zoom_start_url', 'zoom_meeting_id', 'historial',
        )
        read_only_fields = ('created_at', 'end_datetime', 'professional_role',
                            'patient_detail', 'professional_detail')

    def get_end_datetime(self, obj):
        return obj.end_datetime

    def get_patient_detail(self, obj):
        from .serializers import UserSerializer
        return UserSerializer(obj.patient).data if obj.patient else None

    def get_professional_detail(self, obj):
        from .serializers import UserSerializer
        return UserSerializer(obj.professional).data if obj.professional else None

    # -----------------------------
    # VALIDACIONES
    # -----------------------------
    def validate_professional(self, value):
        if getattr(value, 'role', None) != 'profesional':
            raise serializers.ValidationError("El usuario seleccionado no es un profesional.")
        return value

    def validate_start_datetime(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("No se puede agendar en el pasado.")
        return value

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duración inválida.")
        return value

    def validate(self, data):
        start = data.get('start_datetime') or getattr(self.instance, 'start_datetime', None)
        duration = data.get('duration_minutes') or getattr(self.instance, 'duration_minutes', None)
        professional = data.get('professional') or getattr(self.instance, 'professional', None)
        modality = data.get('modality') or getattr(self.instance, 'modality', None)

        if not start or not professional or not duration:
            return data

        # Duración según especialidad
        try:
            specialty = professional.psicologoprofile.specialty
        except AttributeError:
            specialty = None

        role_key = specialty.lower() if specialty else 'default'
        min_dur, max_dur = ROLE_DURATION_LIMITS.get(role_key, ROLE_DURATION_LIMITS['default'])
        if not (min_dur <= duration <= max_dur):
            raise serializers.ValidationError({
                'duration_minutes': f"La duración debe estar entre {min_dur} y {max_dur} minutos para '{specialty}'."
            })

        # Modalidad
        try:
            allowed = professional.psicologoprofile.work_modality
        except AttributeError:
            allowed = None

        if allowed in ('Presencial', 'Online'):
            if modality and modality != allowed:
                raise serializers.ValidationError({'modality': f"Este profesional solo atiende en modalidad {allowed}."})
            data['modality'] = allowed
        elif allowed == 'Mixta':
            if not modality or modality not in ('Presencial', 'Online'):
                raise serializers.ValidationError({'modality': "Debes elegir 'Presencial' u 'Online'."})

        # Fecha final
        end = start + timedelta(minutes=duration)

        # Solapamiento paciente
        request = self.context.get('request')
        patient = data.get('patient') or (request.user if request and request.user.is_authenticated else None)
        if not patient and not self.instance:
            raise serializers.ValidationError("No se pudo determinar el paciente.")

        if patient:
            qs = Appointment.objects.filter(patient=patient, status='scheduled')
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if any((a.start_datetime < end) and (a.end_datetime > start) for a in qs):
                raise serializers.ValidationError("Ya tienes una cita que se solapa con este horario.")

        # Solapamiento profesional
        qs_prof = Appointment.objects.filter(professional=professional, status='scheduled')
        if self.instance:
            qs_prof = qs_prof.exclude(pk=self.instance.pk)
        if any((a.start_datetime < end) and (a.end_datetime > start) for a in qs_prof):
            raise serializers.ValidationError("El profesional ya tiene una cita en ese horario.")

        return data

    # -----------------------------
    # CREATE / UPDATE
    # -----------------------------
    def create(self, validated_data):
        request = self.context.get('request')
        if 'patient' not in validated_data and request and request.user.is_authenticated:
            validated_data['patient'] = request.user
        elif 'patient' not in validated_data:
            raise serializers.ValidationError({"patient": "No se proveyó un paciente."})

        professional = validated_data.get('professional')
        if professional:
            try:
                validated_data['professional_role'] = professional.psicologoprofile.specialty
            except AttributeError:
                validated_data['professional_role'] = 'desconocido'

        with transaction.atomic():
            return super().create(validated_data)

    def update(self, instance, validated_data):
        notes = validated_data.get("notes", None)
        if notes is not None:
            instance.notes = notes
            instance.save()
            return instance
        return super().update(instance, validated_data)

        


class ProfessionalSearchSerializer(UserSerializer):
    specialty = serializers.SerializerMethodField()
    specialty_label = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    work_modality = serializers.SerializerMethodField() 

    
    class Meta(UserSerializer.Meta):
        model = CustomUser
        fields = UserSerializer.Meta.fields + ('specialty', 'specialty_label', 'full_name', 'work_modality')  
        
    def get_specialty(self, obj):
        try: return obj.psicologoprofile.specialty
        except AttributeError: return None

    def get_specialty_label(self, obj):
        try:
            p = obj.psicologoprofile
            return p.specialty_other if p.specialty == Specialty.OTRO and p.specialty_other else p.get_specialty_display()
        except AttributeError:
            return None
    
    def get_work_modality(self, obj):
        try:
            return obj.psicologoprofile.work_modality  # 'Presencial' | 'Online' | 'Mixta'
        except AttributeError:
            return None




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
    
    
