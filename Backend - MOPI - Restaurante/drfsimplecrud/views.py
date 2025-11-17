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
