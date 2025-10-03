from django.contrib import admin
from .models import CustomUser, Appointment
from django.contrib.auth.admin import UserAdmin
from datetime import timedelta


# Register your models here.

# 1. Heredar la clase UserAdmin
class CustomUserAdmin(UserAdmin):
    # Campos a mostrar en la lista (tabla) del panel de administración
    list_display = UserAdmin.list_display + ('role', 'specialty')
    
    # Heredamos los fieldsets por defecto y añadimos uno nuevo al final
    fieldsets = UserAdmin.fieldsets + (
        ('Información Personalizada', {'fields': ('role', 'specialty', 'license_number')}),
    )

    # 3. También es buena práctica añadir tus campos al formulario de "añadir" usuario
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'specialty', 'license_number')}),
    )

# y luego REGISTRA tu modelo con tu clase CustomUserAdmin
try:
    admin.site.unregister(CustomUser)
except admin.sites.NotRegistered:
    pass # Ya está desregistrado o nunca lo estuvo.

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
    
    # Campos de solo lectura (no se pueden editar en el admin)
    readonly_fields = ('created_at',)

    # Método para que end_datetime aparezca en list_display
    def end_datetime(self, obj):
        return obj.end_datetime
    end_datetime.short_description = 'Hora Fin'

# --- 2. Registrar el Modelo ---
# Aquí le decimos a Django que use nuestra clase personalizada para este modelo
admin.site.register(Appointment, AppointmentAdmin)