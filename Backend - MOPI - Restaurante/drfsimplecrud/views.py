from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

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
