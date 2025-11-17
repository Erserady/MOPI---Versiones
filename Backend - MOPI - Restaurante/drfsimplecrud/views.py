from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def health_check(request):
    """
    Endpoint simple para mantener el servicio activo.
    Responde con un JSON indicando que el servicio está online.
    """
    return JsonResponse({
        'status': 'ok',
        'message': 'MOPI Backend is running'
    })

@csrf_exempt
def debug_request(request):
    """
    Endpoint de debug para ver exactamente qué está recibiendo el backend.
    """
    try:
        # Intentar parsear el body como JSON
        body_data = None
        if request.body:
            try:
                body_data = json.loads(request.body.decode('utf-8'))
            except:
                body_data = request.body.decode('utf-8')
        
        debug_info = {
            'method': request.method,
            'content_type': request.content_type,
            'headers': dict(request.headers),
            'GET': dict(request.GET),
            'POST': dict(request.POST),
            'body': body_data,
            'body_raw': request.body.decode('utf-8') if request.body else None,
        }
        
        return JsonResponse({
            'status': 'ok',
            'message': 'Debug info',
            'data': debug_info
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
def check_database(request):
    """
    Endpoint para verificar el estado de la base de datos.
    """
    try:
        from django.contrib.auth import get_user_model
        from mesero.models import Table
        from administrador.models import Plato, CategoriaMenu
        
        User = get_user_model()
        
        # Contar registros
        users_count = User.objects.count()
        tables_count = Table.objects.count()
        platos_count = Plato.objects.count()
        categorias_count = CategoriaMenu.objects.count()
        
        # Contar usuarios por rol
        users_by_role = {}
        for role_key, role_name in User.ROLE_CHOICES:
            count = User.objects.filter(role=role_key, is_active=True).count()
            users_by_role[role_key] = {
                'count': count,
                'users': list(User.objects.filter(role=role_key, is_active=True).values('id', 'username', 'first_name', 'last_name'))
            }
        
        # Listar todos los usuarios
        all_users = list(User.objects.all().values('id', 'username', 'role', 'is_active', 'is_superuser'))
        
        return JsonResponse({
            'status': 'ok',
            'message': 'Database check',
            'data': {
                'total_users': users_count,
                'total_tables': tables_count,
                'total_platos': platos_count,
                'total_categorias': categorias_count,
                'users_by_role': users_by_role,
                'all_users': all_users,
            }
        })
    except Exception as e:
        import traceback
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }, status=500)
