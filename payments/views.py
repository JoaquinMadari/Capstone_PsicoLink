import mercadopago
import json
from django.conf import settings # Importamos settings
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

# Importa tus modelos y serializers desde la app 'api'
from api.models import CustomUser
from api.serializers import AppointmentSerializer

# Configura el SDK de Mercado Pago (esto solo se hace una vez)
# ¡Asegúrate de que MP_ACCESS_TOKEN también esté en tus variables de entorno!
sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

@api_view(['POST'])
@authentication_classes([JWTAuthentication]) # Asegura que usamos JWT
@permission_classes([IsAuthenticated])      # Asegura que el usuario esté logueado
def create_preference(request):
    """
    Crea una preferencia de pago en Mercado Pago.
    Recibe los datos de la cita y el ID del profesional.
    Guarda los datos de la cita en 'metadata' para el webhook.
    """
    try:
        # 1. Obtener datos de la cita desde Ionic
        appointment_data = request.data
        prof_id = appointment_data.get('professional')
        
        # 2. Obtener el paciente (¡el usuario logueado!)
        patient_user = request.user
        appointment_data['patient'] = patient_user.id # ¡Añadimos el paciente al metadata!

        # 3. Obtener el precio y nombre del profesional (desde la BD)
        try:
            prof = CustomUser.objects.get(id=prof_id, role='profesional')
            prof_name = prof.get_full_name() or prof.email
            # --- PRECIO ---
            # (Usamos 20000 fijos como definimos, ¡puedes cambiar esto!)
            precio_de_la_cita = 20000 
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Profesional no encontrado"}, status=404)

        # 4. Preparar la preferencia para Mercado Pago
        
        # --- ¡CONFIGURACIÓN DESDE VARIABLES DE ENTORNO! ---
        
        # 1. URL del Webhook (Leída desde settings, que la lee del entorno)
        # EJ: https://tu-api.onrender.com/payments/webhook/
        if not settings.WEBHOOK_URL_BASE:
            raise Exception("WEBHOOK_URL_BASE no está configurada en las variables de entorno.")
            
        URL_WEBHOOK = f"{settings.WEBHOOK_URL_BASE}/payments/webhook/"
        
        # 2. URL del Frontend (Leída desde settings)
        # EJ: https://tu-app.onrender.com
        URL_FRONTEND_PUBLICO = settings.FRONTEND_URL
        
        
        preference_data = {
            "notification_url": URL_WEBHOOK,

            "items": [
                {
                    "title": f"Sesión con {prof_name}",
                    "quantity": 1,
                    "currency_id": "CLP",
                    "unit_price": float(precio_de_la_cita) # Asegurarse de que sea float
                }
            ],
            
            "back_urls": {
                # Usa la URL pública de tu frontend
                "success": f"{URL_FRONTEND_PUBLICO}/exitoso",
                "failure": f"{URL_FRONTEND_PUBLICO}/fallido",
                "pending": f"{URL_FRONTEND_PUBLICO}/pendiente"
            },
            
            # --- ¡AUTO_RETURN ACTIVADO! ---
            # Asumimos que en producción (Render) SÍ quieres auto_return.
            # Si en local (con ngrok) falla, MP es estricto con las URLs públicas.
            "auto_return": "approved", 
            
            # Guardamos TODOS los datos de la cita para el Webhook
            "metadata": appointment_data,
        }

        # 5. Crear la preferencia
        preference_result = sdk.preference().create(preference_data)
        
        # --- DEBUG (Imprimir la respuesta de MP) ---
        print("--- (1) RESPUESTA COMPLETA DE MP ---")
        print(preference_result)
        # --- FIN DEBUG ---

        if preference_result.get("status") != 201:
             # Si MP da un error (ej: 400), lo enviamos a Ionic
             print("--- ERROR DE MERCADO PAGO ---")
             print(preference_result.get("response"))
             return JsonResponse(preference_result.get("response", {"error": "Error desconocido de MP"}), status=preference_result.get("status", 400))

        # 6. Enviar la preferencia (init_point) de vuelta a Ionic
        response_data = preference_result.get("response")
        
        # --- DEBUG (Imprimir solo lo que va a Ionic) ---
        print("--- (2) OBJETO QUE SE ENVÍA A IONIC ---")
        print(response_data)
        # --- FIN DEBUG ---

        return Response(response_data)

    except Exception as e:
        print(f"Error catastrófico en create_preference: {e}")
        return JsonResponse({"error": str(e)}, status=500)


# -------------------------------------------------------------------
# VISTA DEL WEBHOOK (FASE 3)
# -------------------------------------------------------------------
from django.views.decorators.csrf import csrf_exempt
from rest_framework.request import Request

@csrf_exempt # ¡Importante! MP no usa CSRF
@api_view(['POST'])
@permission_classes([]) # Esta vista debe ser 100% pública
@authentication_classes([])
def mercadopago_webhook(request: Request):
    """
    Recibe notificaciones de Mercado Pago (Webhooks).
    Valida el pago y, si es "aprobado", crea la cita en la BD.
    """
    print("--- 🔔 WEBHOOK RECIBIDO ---")
    data = request.data
    print(data) # Imprime lo que envía MP

    notification_type = data.get('type')
    
    # 1. Validar que sea una notificación de 'payment'
    # (MP envía de 'merchant_order' y otras cosas que no nos sirven)
    if notification_type != 'payment':
        print(f"Notificación ignorada (no es 'payment'): {notification_type}")
        return JsonResponse({"status": "ignored", "type": notification_type})

    payment_id = data.get('data', {}).get('id')
    if not payment_id:
        print("Error: El webhook no contenía un 'data.id'")
        return JsonResponse({"status": "error", "message": "No data.id"}, status=400)

    try:
        # 2. Consultar el estado del pago a Mercado Pago (¡La fuente de verdad!)
        print(f"Consultando Payment ID: {payment_id}...")
        payment_info = sdk.payment().get(str(payment_id))

        if payment_info.get("status") != 200:
            print(f"Error: MP no encontró el pago {payment_id}")
            return JsonResponse({"status": "error", "message": "Pago no encontrado en MP"}, status=404)

        payment = payment_info["response"]
        payment_status = payment.get("status")
        metadata = payment.get("metadata") # ¡Aquí recuperamos los datos de la cita!

        # 3. ¡El pago fue aprobado!
        if payment_status == 'approved':
            print(f"✅ Pago APROBADO (ID: {payment_id})")
            print(f"Metadata recuperada: {metadata}")

            # 4. Crear la cita en la Base de Datos
            # Usamos el AppointmentSerializer para validar y crear
            serializer = AppointmentSerializer(data=metadata)
            if serializer.is_valid():
                serializer.save()
                print("✅ Cita creada exitosamente en la Base de Datos.")
            else:
                # El metadata era inválido (ej: solapamiento de hora)
                print(f"❌ ERROR DE VALIDACIÓN: {serializer.errors}")
                # (Aquí podrías enviar un email al admin o al usuario)
                return JsonResponse({"status": "error", "errors": serializer.errors}, status=400)
        
        else:
            # El pago fue 'rejected', 'pending', etc.
            print(f"Pago NO aprobado. Estado: {payment_status}")

        # 5. Responder 200 OK a Mercado Pago
        # (Es crucial responder 200 OK para que MP sepa que recibimos la notificación)
        return JsonResponse({"status": "received"}, status=200)

    except Exception as e:
        # Captura cualquier error (ej: el serializer falló)
        print(f"Error al procesar el webhook: {e}")
        # Respondemos 500 para que MP intente de nuevo más tarde
        return JsonResponse({"status": "error", "message": str(e)}, status=500)