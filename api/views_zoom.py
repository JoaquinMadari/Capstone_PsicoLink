# api/views_zoom.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from api.models import PsicologoProfile, CustomUser
import requests
from datetime import datetime, timedelta
import urllib.parse
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.shortcuts import redirect

# -----------------------
# Zoom OAuth (User-managed)
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def zoom_connect(request):
    #Genera la URL de autorización de Zoom para que el psicólogo autorice la app.
    #Scopes definidos para User-managed: meeting:read:meeting, meeting:write:meeting, user:read:user
    
    user = request.user
    base_url = "https://zoom.us/oauth/authorize"
    params = {
        "response_type": "code",
        "client_id": settings.ZOOM_CLIENT_ID,
        "redirect_uri": settings.ZOOM_REDIRECT_URI,
        "scope": "meeting:read:meeting meeting:write:meeting user:read:user",
        "state": str(user.id)  # identificamos al psicólogo
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    return Response({"zoom_auth_url": url})


@api_view(['GET'])
@permission_classes([AllowAny])
def zoom_callback(request):
    # Callback de Zoom: recibe code y state, intercambia por access/refresh tokens 
    # y los guarda en el perfil del psicólogo.
    code = request.GET.get("code")
    state = request.GET.get("state") or "46"
    if not code:
        return Response({"error": "Faltan parámetros: code"}, status=400)


    try:
        user = CustomUser.objects.get(id=state)
        profile = PsicologoProfile.objects.get(user=user)
    except (CustomUser.DoesNotExist, PsicologoProfile.DoesNotExist):
        return Response({"error": "Usuario o perfil no encontrado"}, status=400)

    token_url = "https://zoom.us/oauth/token"
    params = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.ZOOM_REDIRECT_URI,
    }
    auth = (settings.ZOOM_CLIENT_ID, settings.ZOOM_CLIENT_SECRET)
    response = requests.post(token_url, params=params, auth=auth)
    data = response.json()

    if "access_token" not in data:
        return Response({"error": "No se pudo obtener access token", "data": data}, status=400)

    profile.zoom_access_token = data.get("access_token")
    profile.zoom_refresh_token = data.get("refresh_token")
    expires_in = data.get("expires_in")
    if expires_in:
        #profile.zoom_token_expires_at = dt_timezone.utcnow() + timedelta(seconds=expires_in)
        profile.zoom_token_expires_at = timezone.now() + timedelta(seconds=expires_in)

    profile.save(update_fields=["zoom_access_token", "zoom_refresh_token", "zoom_token_expires_at"])

    platform = request.headers.get("X-Platform", "").lower()
    user_agent = request.META.get("HTTP_USER_AGENT", "").lower()

    # Lógica de detección para saber si viene desde app
    is_mobile = False

    # 1. Header explícito → prioridad
    if platform in ["android", "ios", "mobile"]:
        is_mobile = True

    # 2. Sin header → detectar WebView o Android/iOS
    elif "wv" in user_agent or "android" in user_agent or "iphone" in user_agent:
        is_mobile = True

    # Ahora aplicamos el redirect adecuado
    if is_mobile:
        return redirect("psicolink://zoom/success")
    else:
        # Redirección normal a la web
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:8100")
        return redirect(f"{frontend_url}/zoom/success")




