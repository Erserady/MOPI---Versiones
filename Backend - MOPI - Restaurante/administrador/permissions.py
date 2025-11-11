from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """
    Permiso personalizado para verificar que el usuario tenga role='admin'.
    
    A diferencia de IsAdminUser (que verifica is_staff), esta clase verifica
    el campo 'role' del modelo User personalizado.
    """
    
    def has_permission(self, request, view):
        # El usuario debe estar autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verificar si el usuario tiene role='admin'
        return request.user.role == 'admin'


class IsAdminOrStaff(permissions.BasePermission):
    """
    Permiso que permite acceso a usuarios con role='admin' O is_staff=True.
    Útil para mantener compatibilidad con el admin de Django.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Permitir si es admin por role o por is_staff
        return request.user.role == 'admin' or request.user.is_staff
