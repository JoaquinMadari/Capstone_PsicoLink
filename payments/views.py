import mercadopago
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['POST'])
def create_preference(request):
    sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

    preference_data = {
        "items": [
            {
                "title": "Sesión Psicológica",
                "quantity": 1,
                "currency_id": "CLP",
                "unit_price": 20000
            }
        ],
        "back_urls": {
            "success": "https://psicolink-front/success",
            "failure": "https://psicolink-front/failure",
            "pending": "https://psicolink-front/pending"
        },
        "auto_return": "approved"
    }

    result = sdk.preference().create(preference_data)
    return Response(result["response"])
