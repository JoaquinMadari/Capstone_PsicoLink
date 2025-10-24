# api/views_zoom.py
from django.shortcuts import redirect
from django.conf import settings
import urllib.parse
from django.http import HttpResponse  # agrégalo si no está ya arriba

def zoom_connect(request):
    base_url = "https://zoom.us/oauth/authorize"
    params = {
        "response_type": "code",
        "client_id": settings.ZOOM_CLIENT_ID,
        "redirect_uri": settings.ZOOM_REDIRECT_URI,
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    print("REDIRIGIENDO A:", url)  # <- para debug
    return redirect(url)

# api/views_zoom.py
import requests
from django.http import JsonResponse

def zoom_callback(request):
    code = request.GET.get("code")
    if not code:
        return JsonResponse({"error": "No se recibió el code"}, status=400)

    print("✅ Zoom devolvió el code correctamente:", code)

    token_url = "https://zoom.us/oauth/token"
    params = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.ZOOM_REDIRECT_URI,
    }

    auth = (settings.ZOOM_CLIENT_ID, settings.ZOOM_CLIENT_SECRET)

    response = requests.post(token_url, params=params, auth=auth)

    data = response.json()
    print("🔐 Respuesta completa de Zoom:", data)

    return JsonResponse(data, safe=False)
