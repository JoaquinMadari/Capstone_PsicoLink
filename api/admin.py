from django.contrib import admin
from .models import CustomUser, CustomUser,PsicologoProfile, PacienteProfile, OrganizacionProfile, Appointment
from django.contrib.auth.admin import UserAdmin
from datetime import timedelta


# Register your models here.

class PsicologoProfileInline(admin.StackedInline):
    model = PsicologoProfile
    can_delete = False
    verbose_name_plural = 'Perfil de Psicólogo'
    fields = (
        ('rut', 'age', 'gender', 'nationality', 'phone'),
        ('specialty', 'license_number', 'main_focus'),
        ('therapeutic_techniques', 'style_of_attention'),
        ('work_modality', 'attention_schedule', 'inclusive_orientation'),
        ('languages', 'experience_years'),
        ('certificates', 'curriculum_vitae'),
        ('cases_attended', 'rating'), # Estos serán de solo lectura
    )
    readonly_fields = ('cases_attended', 'rating')


class PacienteProfileInline(admin.StackedInline):
    model = PacienteProfile
    can_delete = False
    verbose_name_plural = 'Perfil de Paciente'
    fields = (
        ('rut', 'age', 'gender', 'nationality', 'phone'),
        ('base_disease', 'disability', 'inclusive_orientation'),
        ('description', 'consultation_reason'),
        ('preference_modality', 'preferred_focus')
    )


class OrganizacionProfileInline(admin.StackedInline):
    model = OrganizacionProfile
    can_delete = False
    verbose_name_plural = 'Perfil de Organización'
    fields = (
        ('organization_name', 'organization_rut', 'contact_email'),
        ('contact_phone', 'num_employees', 'company_sector'),
        ('location', 'service_type_required'),
        ('preference_modality', 'type_of_attention', 'service_frequency')
    )


class CustomUserAdmin(UserAdmin):
    list_display = (
        'username', 'email', 'role', 'first_name', 'last_name', 'is_staff'
    )
    
    list_filter = UserAdmin.list_filter + ('role',)
    search_fields = ('username', 'email', 'role')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'email', 'role')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )


admin.site.register(CustomUser, CustomUserAdmin) 
admin.site.register(PsicologoProfile)
admin.site.register(PacienteProfile)
admin.site.register(OrganizacionProfile) 




class AppointmentAdmin(admin.ModelAdmin):
    # Campos a mostrar en la lista del panel de administración
    list_display = (
        'patient', 
        'professional', 
        'start_datetime', 
        'end_datetime',
        'status', 
        'duration_minutes'
    )
    
    # Campos que se pueden usar para filtrar la lista
    list_filter = ('status', 'professional', 'created_at')
    
    # Campos por los que se puede buscar
    search_fields = ('patient__username', 'professional__username', 'notes')
    
    # Campos que aparecen en la vista de detalle/edición
    fields = (
        'patient', 
        'professional', 
        'start_datetime', 
        'duration_minutes', 
        'status', 
        'notes'
    )
    
    readonly_fields = ('created_at',)

    def end_datetime(self, obj):
        return obj.end_datetime
    end_datetime.short_description = 'Hora Fin'

admin.site.register(Appointment, AppointmentAdmin)