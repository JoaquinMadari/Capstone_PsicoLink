from rest_framework import serializers
from .models import CustomUser, PacienteProfile, PsicologoProfile, OrganizacionProfile, Specialty, SupportTicket
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator

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
        try:
            user = CustomUser.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                password=validated_data['password'],
                role=validated_data['role'],
                first_name=validated_data.get('first_name', ''), 
                last_name=validated_data.get('last_name', '')
            )
            return user
        except IntegrityError:
            raise serializers.ValidationError({"email": "Este email ya está registrado."})

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
            'therapeutic_techniques', 'style_of_attention', 'work_modality', 'certificates',
            'address', 'payment_method',
            'session_price',
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
        validated_data.setdefault("is_available", True)

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
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['is_staff'] = user.is_staff
        token['supabase_uid'] = str(user.supabase_uid) if user.supabase_uid else None
        token['full_name'] = user.get_full_name() or None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,                 # 🔹 agregar el id
            'role': self.user.role,
            'email': self.user.email,
            'full_name': self.user.get_full_name() or None,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'is_staff': self.user.is_staff,
            'supabase_uid': str(self.user.supabase_uid) if self.user.supabase_uid else None
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
        modality = data.get('modality') or getattr(self.instance, 'modality', None)

        if not start or not professional or not duration:
            return data

        try:
            # Intentamos acceder al perfil del psicólogo para obtener la disponibilidad
            profile = professional.psicologoprofile
 
            if not profile.is_available:
                raise serializers.ValidationError({
                    'professional': "El profesional ha pausado temporalmente su disponibilidad para nuevas citas."
                })
        except AttributeError:
            # Si no tiene un perfil asociado, asumimos que no es agendable si su rol es profesional
            if professional.role == 'profesional':
                raise serializers.ValidationError({"professional": "Perfil de profesional incompleto o no encontrado."})
        
        # límites por especialidad
        try:
            specialty = professional.psicologoprofile.specialty
        except AttributeError:
            specialty = None

        role_key = 'default' if getattr(professional, 'role', 'paciente') != 'profesional' or not specialty else specialty.lower()
        min_dur, max_dur = ROLE_DURATION_LIMITS.get(role_key, ROLE_DURATION_LIMITS['default'])
        if not (min_dur <= duration <= max_dur):
            raise serializers.ValidationError({
                'duration_minutes': f"La duración debe estar entre {min_dur} y {max_dur} minutos para el profesional con especialidad '{specialty}'."
            })

        # Validacion de modalidad según el perfil del profesional
        try:
            allowed = professional.psicologoprofile.work_modality
        except AttributeError:
            allowed = None

        if allowed in ('Presencial', 'Online'):
            if modality and modality != allowed:
                raise serializers.ValidationError({'modality': f"Este profesional solo atiende en modalidad {allowed}."})
            data['modality'] = allowed
        elif allowed == 'Mixta':
            if not modality:
                raise serializers.ValidationError({'modality': "Debes elegir 'Presencial' u 'Online'."})
            if modality not in ('Presencial', 'Online'):
                raise serializers.ValidationError({'modality': "Valor inválido. Usa 'Presencial' u 'Online'."})
        else:
            pass
        
        end = start + timedelta(minutes=duration)

        # Solapamientos
        
        # --- LÓGICA DE PACIENTE MODIFICADA ---
        # 3. Hacemos que la validación de solapamiento del paciente
        #    funcione tanto para el webhook como para la vista normal.
        request = self.context.get('request')
        
        # Primero intenta obtener 'patient' de los datos (Webhook)
        patient = data.get('patient') 
        
        if not patient and request and request.user.is_authenticated:
            # Si no, lo obtiene del request (Vista normal)
            patient = request.user
        
        if not patient:
            # Si no hay paciente ni en el data ni en el request, es un error
            # (a menos que estés actualizando y no cambiando el paciente)
            if not self.instance:
                raise serializers.ValidationError("No se pudo determinar el paciente.")
        # --- FIN LÓGICA DE PACIENTE ---

        if patient:
            qs = Appointment.objects.filter(patient=patient, status='scheduled')
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if any((a.start_datetime < end) and (a.end_datetime > start) for a in qs):
                raise serializers.ValidationError("Ya tienes una cita agendada que se solapa con este horario. Por favor revisa tus citas programadas.")

        qs_prof = Appointment.objects.filter(professional=professional, status='scheduled')
        if self.instance:
            qs_prof = qs_prof.exclude(pk=self.instance.pk)
        if any((a.start_datetime < end) and (a.end_datetime > start) for a in qs_prof):

            raise serializers.ValidationError("El profesional ya tiene una cita en ese horario.")

        return data

    # -----------------------------
# CREATE / UPDATE UNIFICADO
# -----------------------------
    def create(self, validated_data):
        request = self.context.get('request')

        # --- Asignar patient si no viene en validated_data ---
        if 'patient' not in validated_data:
            if request and request.user and request.user.is_authenticated:
                validated_data['patient'] = request.user
            else:
                raise serializers.ValidationError({"patient": "No se proveyó un paciente."})

        # --- Asignar professional_role si existe professional ---
        professional = validated_data.get('professional')
        if professional:
            try:
                validated_data['professional_role'] = professional.psicologoprofile.specialty
            except AttributeError:
                validated_data['professional_role'] = 'desconocido'

        # --- Crear la instancia en transacción ---
        with transaction.atomic():
            return super().create(validated_data)


    def update(self, instance, validated_data):
        # --- Actualizar notes si vienen ---
        notes = validated_data.get("notes", None)
        if notes is not None:
            instance.notes = notes
            instance.save()
            return instance

        # --- Lógica adicional: transacción para otros updates ---
        with transaction.atomic():
            return super().update(instance, validated_data)





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



User = get_user_model()

def _get_profile_for_user(user):
    if user.role == 'profesional':
        return getattr(user, 'psicologoprofile', None)

    if user.role == 'paciente':
        # nombre correcto: pacienteprofile
        return getattr(user, 'pacienteprofile', None)

    if user.role == 'organizacion':
        return getattr(user, 'organizacionprofile', None)

    return None
def get_session_price(self, obj):
    profile = _get_profile_for_user(obj)
    if profile and hasattr(profile, 'session_price'):
        return profile.session_price
    return None

class MyProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    specialty = serializers.SerializerMethodField()
    session_price = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "full_name",
            "email", "role", "phone", "specialty",
            "session_price",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_phone(self, obj):
        profile = _get_profile_for_user(obj)
        if not profile:
            return None
        return getattr(profile, "phone", getattr(profile, "contact_phone", None))

    def get_specialty(self, obj):
        profile = _get_profile_for_user(obj)
        return getattr(profile, 'specialty', None) if profile else None

    def get_session_price(self, obj):
        profile = _get_profile_for_user(obj)
        if profile and hasattr(profile, 'session_price'):
            return profile.session_price
        return None

class MyProfileUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    session_price = serializers.IntegerField(required=False, allow_null=True)
    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está en uso.")
        return value

    def update(self, instance, validated_data):
        with transaction.atomic():
            email = validated_data.get("email", None)
            phone = validated_data.get("phone", None)
            price = validated_data.get('session_price', None)

            if price is not None:
                profile = _get_profile_for_user(instance)
                if profile and hasattr(profile, 'session_price'):
                    profile.session_price = price
                    profile.save(update_fields=['session_price'])

            if email is not None:
                instance.email = email
                instance.save(update_fields=["email"])

            if phone is not None:
                profile = _get_profile_for_user(instance)

                if profile:
                    if hasattr(profile, "phone"):
                        profile.phone = phone
                        profile.save(update_fields=["phone"])
                    elif hasattr(profile, "contact_phone"):
                        profile.contact_phone = phone
                        profile.save(update_fields=["contact_phone"])

        return instance


# --------------------------------------------
# ----------- DASHBOARD ADMIN ----------------
# --------------------------------------------
class SupportTicketCreateSerializer(serializers.ModelSerializer):
    #Serializador para la creación de tickets
    status = serializers.CharField(read_only=True)
    class Meta:
        model = SupportTicket
        # Solo necesitamos estos campos para crear el ticket
        fields = ('id', 'name', 'email', 'subject', 'message', 'created_at', 'status', 'respuesta', 'respondido_por', 'fecha_respuesta')
        read_only_fields = ('id', 'created_at', 'status', 'respuesta', 'respondido_por', 'fecha_respuesta')

    def create(self, validated_data):
        user = self.context['request'].user
        if user.is_authenticated:
            validated_data['user'] = user
        
        return super().create(validated_data)


class SupportTicketReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['respuesta', 'status']
        extra_kwargs = {
            'status': {'required': False}
        }

    def validate_respuesta(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("La respuesta debe ser más detallada.")
        return value
    

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Campos que el admin necesita ver y gestionar
        fields = (
            'id', 
            'email', 
            'role', 
            'is_active', 
            'date_joined', 
            'last_login'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')




# Serializer para manejar solo el toggle de disponibilidad
class ProfessionalAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PsicologoProfile
        fields = ['is_available']
