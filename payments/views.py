import mercadopago
import json
from django.conf import settings
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from api.models import CustomUser
from api.serializers import AppointmentSerializer

sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

# -------------------- ZOOM IMPORTS --------------------
from api.zoom_service import create_meeting_for_professional
from django.utils import timezone
import logging
logger = logging.getLogger(__name__)
from datetime import timezone as dt_timezone


# ===========================================================
#  FUNCION: CREAR REUNIÓN ZOOM
# ===========================================================
def create_zoom_meeting_for_appointment(appointment):
    try:
        if (not appointment.modality or appointment.modality.lower() != "online"):
            logger.info(f"Cita {appointment.id} no es online, no se crea Zoom")
            return False
        
        if appointment.zoom_meeting_id:
            logger.info(f"Cita {appointment.id} ya tiene Zoom meeting")
            return True
        
        profile = getattr(appointment.professional, "psicologoprofile", None)
        if not profile or not profile.zoom_access_token:
            logger.warning(f"Profesional {appointment.professional.id} no tiene Zoom conectado")
            return False
        
        start_time = appointment.start_datetime.astimezone(dt_timezone.utc).isoformat()
        
        zoom_data = create_meeting_for_professional(
            profile,
            topic=f"Cita con {appointment.patient.get_full_name()}",
            start_time=start_time,
            duration=appointment.duration_minutes
        )
        
        if zoom_data:
            appointment.zoom_meeting_id = zoom_data.get("id")
            appointment.zoom_join_url = zoom_data.get("join_url")
            appointment.zoom_start_url = zoom_data.get("start_url")
            appointment.save(update_fields=[
                'zoom_meeting_id', 'zoom_join_url', 'zoom_start_url'
            ])
            logger.info(f" Zoom creado para cita {appointment.id}")
            return True
            
    except Exception as e:
        logger.error(f" Error creando Zoom para cita {appointment.id}: {e}")
    
    return False


# ===========================================================
#  CREATE PREFERENCE — AHORA CON session_price
# ===========================================================
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_preference(request):
    try:
        appointment_data = request.data
        prof_id = appointment_data.get("professional")

        # Paciente = usuario logueado
        patient_user = request.user
        appointment_data["patient"] = patient_user.id

        # --------------------------------------------------------------
        #  OBTENER PROFESIONAL + SU PRECIO DE SESIÓN
        # --------------------------------------------------------------
        try:
            professional = CustomUser.objects.get(id=prof_id, role="profesional")
            professional_profile = getattr(professional, "psicologoprofile", None)

            if professional_profile and professional_profile.session_price:
                session_price = float(professional_profile.session_price)
            else:
                session_price = 20000  # fallback si no tiene precio

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Profesional no encontrado"}, status=404)

        prof_name = professional.get_full_name() or professional.email

        # --------------------------------------------------------------
        #  URLs desde settings (ambiente seguro)
        # --------------------------------------------------------------
        if not settings.WEBHOOK_URL_BASE:
            raise Exception("WEBHOOK_URL_BASE no configurado en entorno")

        URL_WEBHOOK = f"{settings.WEBHOOK_URL_BASE}/payments/webhook/"
        URL_FRONTEND_PUBLICO = settings.FRONTEND_URL

        # --------------------------------------------------------------
        # CREAR PREFERENCIA MP
        # --------------------------------------------------------------
        
        # Obtener header y user-agent
        platform= request.headers.get("X-Platform", "").lower()
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()

        # Lógica de detección mejorada
        is_mobile = False

        # 1. Si envían el header explícito, confiamos en él
        if platform in ["android", "ios", "mobile"]:
            is_mobile = True
        # 2. Si no, revisamos el User-Agent (Plan B)
        # 'wv' indica WebView (común en Ionic/Capacitor), 'android' o 'iphone' detectan el SO
        elif "wv" in user_agent or "android" in user_agent or "iphone" in user_agent:
            is_mobile = True

        # Deep links SOLO para app
        if is_mobile:
            back_urls = {
                "success": "psicolink://exitoso",
                "failure": "psicolink://fallido",
                "pending": "psicolink://pendiente",
            }
        else:
            # URLs normales SOLO para web
            back_urls = {
                "success": f"{URL_FRONTEND_PUBLICO}/exitoso",
                "failure": f"{URL_FRONTEND_PUBLICO}/fallido",
                "pending": f"{URL_FRONTEND_PUBLICO}/pendiente",
            }

        # 👉 NO RETURNS AQUÍ  
        # Solo se prepara la variable back_urls

        preference_data = {
            "notification_url": URL_WEBHOOK,

            "items": [
                {
                    "title": f"Sesión con {prof_name}",
                    "quantity": 1,
                    "currency_id": "CLP",
                    "unit_price": session_price
                }
            ],

            "back_urls": back_urls,
            "auto_return": "approved",

            "metadata": {
                **appointment_data,
                "session_price": session_price,
                "professional_name": prof_name,
                "platform": platform
            },
        }

        preference_result = sdk.preference().create(preference_data)

        if preference_result.get("status") != 201:
            return JsonResponse(
                preference_result.get("response", {"error": "Error desconocido de MP"}),
                status=preference_result.get("status", 400)
            )

        return Response(preference_result["response"])

    except Exception as e:
        print(f"ERROR FATAL create_preference → {e}")
        return JsonResponse({"error": str(e)}, status=500)



# ===========================================================
#  WEBHOOK MERCADO PAGO — SE MANTIENE IGUAL + ZOOM
# ===========================================================
from django.views.decorators.csrf import csrf_exempt
from rest_framework.request import Request

@csrf_exempt
@api_view(['POST'])
@permission_classes([])
@authentication_classes([])
def mercadopago_webhook(request: Request):
    print("----  WEBHOOK RECIBIDO ----")
    data = request.data
    print(data)

    notification_type = data.get("type")
    if notification_type != "payment":
        return JsonResponse({"status": "ignored", "type": notification_type})

    payment_id = data.get("data", {}).get("id")
    if not payment_id:
        return JsonResponse({"status": "error", "message": "No data.id"}, status=400)

    try:
        payment_info = sdk.payment().get(str(payment_id))

        if payment_info.get("status") != 200:
            return JsonResponse({"error": "Pago no encontrado"}, status=404)

        payment = payment_info["response"]
        payment_status = payment.get("status")
        metadata = payment.get("metadata")

        if payment_status == "approved":
            serializer = AppointmentSerializer(data=metadata)

            if serializer.is_valid():
                appointment = serializer.save()
                print(" Cita creada correctamente.")

                if appointment.modality.lower() == "online":
                    create_zoom_meeting_for_appointment(appointment)

            else:
                return JsonResponse({"errors": serializer.errors}, status=400)

        return JsonResponse({"status": "received"}, status=200)

    except Exception as e:
        print("ERROR WEBHOOK:", e)
        return JsonResponse({"error": str(e)}, status=500)
