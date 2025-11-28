import logging
import time
import unicodedata
import re
from typing import Any, Dict, Optional
import requests
from django.conf import settings

log = logging.getLogger(__name__)

class SupabaseAdminError(RuntimeError):
    pass

ZERO_WIDTH_RE = re.compile(r"[\u200B-\u200D\uFEFF]")

def _normalize_email(email: str) -> str:
    e = email or ""
    e = unicodedata.normalize("NFKC", e)
    e = ZERO_WIDTH_RE.sub("", e)
    e = e.strip().lower()
    return e

def _config():
    base_url = (getattr(settings, "SUPABASE_URL", "") or "").strip().rstrip("/")
    service_role = (getattr(settings, "SUPABASE_SERVICE_ROLE", "") or "").strip()
    anon_key = (getattr(settings, "SUPABASE_ANON_KEY", "") or "").strip() 
    
    if not base_url or not service_role or not anon_key:
        raise SupabaseAdminError("SUPABASE_URL, SUPABASE_SERVICE_ROLE o SUPABASE_ANON_KEY no configurados")
    
    headers_admin = {
        "apikey": service_role,
        "Authorization": f"Bearer {service_role}",
        "Content-Type": "application/json",
    }
    
    # Devolvemos ambos: URL, Headers de Admin, y la Anon Key
    return base_url, headers_admin, anon_key

def _extract_user(obj: Any) -> Optional[Dict[str, Any]]:
    if obj is None:
        return None
    if isinstance(obj, dict):
        if "user" in obj and isinstance(obj["user"], dict):
            return obj["user"]
        if "users" in obj and isinstance(obj["users"], list) and obj["users"]:
            return obj["users"][0]
        return obj
    if isinstance(obj, list) and obj:
        return obj[0]
    return None

def _admin_get_by_email(session: requests.Session, base_url: str, headers: dict, email: str):
    url = f"{base_url}/auth/v1/admin/users"
    r = session.get(url, headers=headers, params={"email": email}, timeout=20)
    if r.status_code == 404:
        return None
    if r.status_code != 200:
        raise SupabaseAdminError(f"Admin GET users?email= fallo {r.status_code}: {r.text}")
    user = _extract_user(r.json())
    if not user:
        return None
    em = _normalize_email(user.get("email", ""))
    return user if em == email else None

def _has_email_provider(user_json: dict) -> bool:
    idents = user_json.get("identities") or []
    for idt in idents:
        if (idt.get("provider") or "").lower() == "email":
            return True
    return not idents


#Intenta iniciar sesión en Supabase y devuelve el access_token del usuario.
def get_supabase_session_tokens(email: str, password: str) -> Optional[Dict[str, str]]:
    email_norm = _normalize_email(email)
    
    base_url, _, anon_key = _config() 

    headers_anon = { 
        "apikey": anon_key,
        "Content-Type": "application/json",
    }
    
    url = f"{base_url}/auth/v1/token?grant_type=password"
    
    payload = {
        "email": email_norm,
        "password": password,
    }

    try:
        r = requests.post(url, json=payload, headers=headers_anon, timeout=10) 
        r.raise_for_status()

        data: Dict[str, Any] = r.json()
        
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        
        if access_token and refresh_token:
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        
        log.warning("Respuesta de Supabase incompleta: Faltan tokens.")
        return None
        
    except requests.exceptions.HTTPError as e:
        log.warning("Fallo al obtener tokens de Supabase para %s (%s): %s", email, e.response.status_code, e.response.text)
        return None
    except Exception as e:
        log.error("Error inesperado al obtener tokens de Supabase: %s", e)
        return None
    

def ensure_supabase_user(
    *,
    email: str,
    password: Optional[str],
    role: str,
    first_name: Optional[str] = None,
    last_name:  Optional[str] = None,
) -> str:
    email_norm = _normalize_email(email)
    base_url, headers, _ = _config()
    admin_users = f"{base_url}/auth/v1/admin/users"

    full_name = f"{(first_name or '').strip()} {(last_name or '').strip()}".strip() or None
    meta = {"role": role}
    if first_name: meta["first_name"] = first_name
    if last_name:  meta["last_name"]  = last_name
    if full_name:  meta["full_name"]  = full_name

    create_payload_full = {
        "email": email_norm,
        "email_confirm": True,
        "user_metadata": meta,
    }
    if password:
        create_payload_full["password"] = password

    with requests.Session() as s:
        # Verificar si existe
        try:
            existing = _admin_get_by_email(s, base_url, headers, email_norm)
        except SupabaseAdminError as e:
            log.warning("Lookup inicial por email falló: %s", e)
            existing = None

        if existing:
            uid = existing.get("id")
            if not uid:
                raise SupabaseAdminError("Usuario existente sin id en respuesta Admin")
            patch = {
                "email_confirm": True,
                "user_metadata": meta,
            }
            if password and _has_email_provider(existing):
                patch["password"] = password
            up = s.patch(f"{admin_users}/{uid}", json=patch, headers=headers, timeout=20)
            if up.status_code not in (200, 201):
                up = s.put(f"{admin_users}/{uid}", json=patch, headers=headers, timeout=20)
            if up.status_code not in (200, 201):
                log.warning("Admin update supabase user (%s) no 2xx: %s %s", uid, up.status_code, up.text)
            return uid

        # create
        cr = s.post(admin_users, json=create_payload_full, headers=headers, timeout=20)
        if cr.status_code in (200, 201):
            data = _extract_user(cr.json()) or cr.json()
            uid = (data or {}).get("id")
            if not uid:
                raise SupabaseAdminError(f"Creación sin id en respuesta: {cr.text}")
            return uid

        # datos inválidos o ya existe
        if cr.status_code in (400, 409, 422):
            again = _admin_get_by_email(s, base_url, headers, email_norm)
            if again and again.get("id"):
                return again["id"]
            raise SupabaseAdminError(f"Admin create fallo {cr.status_code}: {cr.text}")

        # error 5xx → estrategia de rescate
        if 500 <= cr.status_code < 600:
            log.error("Admin create 5xx: %s %s", cr.status_code, cr.text)

            # lookup con backoff (a veces crea pero responde 500)
            for wait in (0.5, 1.2, 2.0):
                time.sleep(wait)
                try:
                    u2 = _admin_get_by_email(s, base_url, headers, email_norm)
                except SupabaseAdminError as e:
                    log.warning("Lookup post-5xx falló: %s", e)
                    u2 = None
                if u2 and u2.get("id"):
                    return u2["id"]

            # create mínimo (sin user_metadata)
            create_payload_min = {
                "email": email_norm,
                "email_confirm": True,
            }
            if password:
                create_payload_min["password"] = password

            cr2 = s.post(admin_users, json=create_payload_min, headers=headers, timeout=20)
            if cr2.status_code in (200, 201):
                data2 = _extract_user(cr2.json()) or cr2.json()
                uid2 = (data2 or {}).get("id")
                if not uid2:
                    raise SupabaseAdminError(f"Creación mínima sin id en respuesta: {cr2.text}")

                # patch metadata
                patch2 = { "user_metadata": meta, "email_confirm": True }
                up2 = s.patch(f"{admin_users}/{uid2}", json=patch2, headers=headers, timeout=20)
                if up2.status_code not in (200, 201):
                    up2 = s.put(f"{admin_users}/{uid2}", json=patch2, headers=headers, timeout=20)
                if up2.status_code not in (200, 201):
                    log.warning("Patch metadata post-min-create no 2xx: %s %s", up2.status_code, up2.text)
                return uid2

            # lookup final
            try:
                u3 = _admin_get_by_email(s, base_url, headers, email_norm)
            except SupabaseAdminError as e:
                log.warning("Lookup final post-5xx falló: %s", e)
                u3 = None
            if u3 and u3.get("id"):
                return u3["id"]

            raise SupabaseAdminError(f"Admin create fallo {cr.status_code}: {cr.text}")

        # otro código de error
        raise SupabaseAdminError(f"Admin create fallo {cr.status_code}: {cr.text}")
