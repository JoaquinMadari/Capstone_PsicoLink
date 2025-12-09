import requests
from datetime import datetime, timedelta
from datetime import timezone as dt_timezone  # IMPORT CORRECTO
from decouple import config

ZOOM_API_BASE_URL = "https://api.zoom.us/v2"
ZOOM_CLIENT_ID = config("ZOOM_CLIENT_ID")
ZOOM_CLIENT_SECRET = config("ZOOM_CLIENT_SECRET")
ZOOM_REDIRECT_URI = config("ZOOM_REDIRECT_URI")


def refresh_zoom_token(professional_profile):
    """
    Refresca el token de acceso de Zoom usando el refresh_token guardado.
    """
    print(f"Intentando refrescar token de Zoom para {professional_profile.user.email}...")

    token_url = "https://zoom.us/oauth/token"
    auth = (ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)

    data = {
        "grant_type": "refresh_token",
        "refresh_token": professional_profile.zoom_refresh_token
    }

    # HEADERS EXPLÍCITOS para form data
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    response = requests.post(token_url, auth=auth, data=data, headers=headers)

    if response.status_code == 200:
        token_data = response.json()

        professional_profile.zoom_access_token = token_data.get("access_token")
        professional_profile.zoom_refresh_token = token_data.get("refresh_token")
        # TIMEZONE CORRECTO
        professional_profile.zoom_token_expires_at = (
        datetime.now(dt_timezone.utc)
        + timedelta(seconds=token_data["expires_in"] - 120)
)

        professional_profile.save(update_fields=["zoom_access_token", "zoom_refresh_token", "zoom_token_expires_at"])

        print("Token de Zoom actualizado correctamente.")
        return professional_profile.zoom_access_token

    else:
        print(f"Error al refrescar token de Zoom: {response.status_code} - {response.text}")
        raise Exception("No se pudo refrescar el token de Zoom.")


def create_zoom_meeting(access_token, topic, start_time, duration=60):
    #Crea una reunión en Zoom usando el token de acceso.
    url = f"{ZOOM_API_BASE_URL}/users/me/meetings"
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {
        "topic": topic,
        "type": 2,
        "start_time": start_time,
        "duration": duration,
        "timezone": "America/Santiago",
        "settings": {
            "join_before_host": False,
            "waiting_room": True,
            "mute_upon_entry": True,
            "approval_type": 0
        }
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 201:
        print(" Reunión Zoom creada con éxito.")
        return response.json()
    elif response.status_code == 401:
        print(f" Error 401 - Token inválido o expirado.")
        raise Exception("Token expirado o inválido.")
    else:
        print(f" Error al crear reunión Zoom: {response.status_code} - {response.text}")
        raise Exception("Error al crear reunión Zoom.")


def create_meeting_for_professional(professional_profile, topic, start_time, duration=60):
    try:
        if not professional_profile.zoom_access_token:
            raise Exception("El profesional no tiene token de Zoom configurado.")

        now = datetime.now(dt_timezone.utc)

        # ✅ REFRESH SOLO AQUÍ
        if (
            professional_profile.zoom_token_expires_at
            and professional_profile.zoom_token_expires_at <= now
        ):
            print(" Token expirado. Refrescando...")
            refresh_zoom_token(professional_profile)

        # ✅ una única llamada
        return create_zoom_meeting(
            professional_profile.zoom_access_token,
            topic,
            start_time,
            duration
        )

    except Exception as e:
        print(f" No se pudo crear reunión para {professional_profile.user.email}: {e}")
        raise

