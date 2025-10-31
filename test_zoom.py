# zoom_auth_test.py
from urllib.parse import urlencode

CLIENT_ID = "0gPv_XsHTTOqedgAU4IBNQ"  # tu client_id de Zoom
REDIRECT_URI = "http://localhost:8000/api/zoom/oauth/callback/"
SCOPE = "meeting:read:admin meeting:write:admin"

params = {
    "response_type": "code",
    "client_id": CLIENT_ID,
    "redirect_uri": REDIRECT_URI,
    "scope": SCOPE,
    "state": "psicolink"
}

url = f"https://zoom.us/oauth/authorize?{urlencode(params)}"
print("URL de autorización de Zoom:")
print(url)


