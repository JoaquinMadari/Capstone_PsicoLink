from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Appointment

# ==== Custom User Admin ====
@admin.register(CustomUser)
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


# ==== Appointment Admin ====
@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'patient',
        'professional',
        'start_datetime',
        'end_datetime',
        'status',
        'duration_minutes'
    )
    list_filter = ('status', 'professional', 'created_at')
    search_fields = ('patient__username', 'professional__username', 'notes')
    readonly_fields = ('created_at',)

    def end_datetime(self, obj):
        return obj.end_datetime
    end_datetime.short_description = 'Hora Fin'
