from django.contrib import admin
from .models import CustomUser, Appointment
from django.contrib.auth.admin import UserAdmin
from datetime import timedelta


# Register your models here.

class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ('role', 'specialty')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Información Personalizada', {'fields': ('role', 'specialty', 'license_number')}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'specialty', 'license_number')}),
    )

try:
    admin.site.unregister(CustomUser)
except admin.sites.NotRegistered:
    pass

admin.site.register(CustomUser, CustomUserAdmin)




class AppointmentAdmin(admin.ModelAdmin):
    # Campos a mostrar en la lista del panel de administración
    list_display = (
        'patient', 
        'professional', 
        'start_datetime', 
        'end_datetime', # Usamos la property
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