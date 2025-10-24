# api/zoom_service.py
import os
import requests
from urllib.parse import urlencode

ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize"
ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"
ZOOM_CREATE_MEETING_URL = "https://api.zoom.us/v2/users/{user_id}/meetings"

CLIENT_ID = os.environ.get("ZOOM_CLIENT_ID")
CLIENT_SECRET = os.environ.get("ZOOM_CLIENT_SECRET")
REDIRECT_URI = os.environ.get("ZOOM_REDIRECT_URI")

def build_authorize_url(state="psicolink_state", response_type="code", scope="meeting:read:admin meeting:write:admin"):
    params = {
        "response_type": response_type,
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "state": state,
        "scope": scope
    }
    return f"{ZOOM_AUTH_URL}?{urlencode(params)}"

def exchange_code_for_token(code):
    """
    Intercambia el code por access_token. Zoom pide Authorization: Basic base64(client_id:client_secret)
    """
    from base64 import b64encode
    basic = b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {
        "Authorization": f"Basic {basic}"
    }
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }
    resp = requests.post(ZOOM_TOKEN_URL, headers=headers, data=data)
    resp.raise_for_status()
    return resp.json()  # contiene access_token, refresh_token, expires_in, etc.

def create_meeting(access_token, user_id="me", topic="Reunión prueba", start_time=None, duration=30):
    """
    Crea reunión para user_id (puede ser "me" si el token es de usuario).
    start_time en formato ISO 8601 (opcional).
    """
    url = ZOOM_CREATE_MEETING_URL.format(user_id=user_id)
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    body = {
        "topic": topic,
        "type": 2,             # 2 = scheduled meeting
        "duration": duration,
        # "start_time": start_time,
        "settings": {
            "join_before_host": False,
            "approval_type": 0
        }
    }
    resp = requests.post(url, headers=headers, json=body)
    resp.raise_for_status()
    return resp.json()




