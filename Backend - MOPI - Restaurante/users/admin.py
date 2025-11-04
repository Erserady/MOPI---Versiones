from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Configuración del panel de administración para el modelo User."""
    
    # Campos que se muestran en la lista de usuarios
    list_display = ('get_nombre_completo', 'username', 'role', 'pin', 'color', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('role', 'first_name', 'last_name')
    
    def get_nombre_completo(self, obj):
        """Mostrar nombre completo en la lista"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username
    get_nombre_completo.short_description = 'Nombre Completo'
    
    # Campos editables desde la vista de detalle
    fieldsets = (
        ('Información de Acceso', {
            'fields': ('username', 'password')
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'email', 'usuario')
        }),
        ('Rol y Autenticación', {
            'fields': ('role', 'pin', 'color'),
            'description': 'Configura el rol del usuario y su PIN para acceso rápido'
        }),
        ('Permisos', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)  # Este panel estará colapsado por defecto
        }),
        ('Fechas Importantes', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    # Campos para crear un nuevo usuario
    add_fieldsets = (
        ('Información Básica', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'usuario')
        }),
        ('Rol y PIN', {
            'fields': ('role', 'pin', 'color'),
            'description': 'Define el rol y PIN del nuevo usuario'
        }),
    )
    
    # Campos que se pueden editar directamente desde la lista
    list_editable = ('pin', 'role')
    
    # Filtros por fecha
    date_hierarchy = 'date_joined'
    
    # Acciones personalizadas
    actions = ['reset_pin', 'activate_users', 'deactivate_users']
    
    def reset_pin(self, request, queryset):
        """Acción para resetear el PIN a '0000'"""
        count = queryset.update(pin='0000')
        self.message_user(request, f'{count} usuario(s) tuvieron su PIN reseteado a 0000')
    reset_pin.short_description = "Resetear PIN a 0000"
    
    def activate_users(self, request, queryset):
        """Activar usuarios seleccionados"""
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} usuario(s) activado(s)')
    activate_users.short_description = "Activar usuarios seleccionados"
    
    def deactivate_users(self, request, queryset):
        """Desactivar usuarios seleccionados"""
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} usuario(s) desactivado(s)')
    deactivate_users.short_description = "Desactivar usuarios seleccionados"
