# test_zoom.py
import os
from datetime import datetime, timedelta
from api.zoom_service import create_meeting
from decouple import config

def main():
    # Obtiene el token OAuth del .env
    zoom_token = config("ZOOM_OAUTH_TOKEN", default=None)
    if not zoom_token:
        print("❌ No se encontró el token de Zoom. Revisa tu archivo .env")
        return

    # Programar la reunión para dentro de 5 minutos (UTC)
    start_time = (datetime.utcnow() + timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Crear reunión de prueba
    meeting = create_meeting(
        access_token=zoom_token,
        topic="Prueba de conexión Zoom API",
        start_time=start_time,
        duration=30
    )

    # Verificación del resultado
    if meeting:
        print("✅ Reunión creada correctamente:")
        print("ID de reunión:", meeting.get("id"))
        print("Link para unirse:", meeting.get("join_url"))
    else:
        print("❌ No se pudo crear la reunión.")

if __name__ == "__main__":
    main()

