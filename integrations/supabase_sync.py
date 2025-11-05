import logging, requests
from django.conf import settings

class SupabaseAdminError(RuntimeError):
    pass

def _config():
    base_url = (getattr(settings, "SUPABASE_URL", "") or "").strip().rstrip("/")
    service_role = (getattr(settings, "SUPABASE_SERVICE_ROLE", "") or "").strip()
    if not base_url or not service_role:
        raise SupabaseAdminError("SUPABASE_URL o SUPABASE_SERVICE_ROLE no configurados")
    headers = {
        "apikey": service_role,
        "Authorization": f"Bearer {service_role}",
        "Content-Type": "application/json",
    }
    return base_url, headers

def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()

def _admin_get_by_email(session: requests.Session, base_url: str, headers: dict, email: str):
    url = f"{base_url}/auth/v1/admin/users"
    r = session.get(url, headers=headers, params={"email": email}, timeout=10)
    if r.status_code != 200:
        raise SupabaseAdminError(f"Admin GET users?email= fallo {r.status_code}: {r.text}")
    data = r.json()
    users = data.get("users", data if isinstance(data, list) else [])
    users = [u for u in users if _normalize_email(u.get("email")) == email]
    if len(users) == 0:
        return None
    if len(users) > 1:
        raise SupabaseAdminError(f"Ambigüedad: múltiples usuarios con email {email}")
    return users[0]

def _has_email_provider(user_json: dict) -> bool:
    for idt in user_json.get("identities", []) or []:
        if (idt.get("provider") or "").lower() == "email":
            return True
    # si identities viene vacío (caso antiguos), asumir que sí
    return not user_json.get("identities")

def ensure_supabase_user(
    *,
    email: str,
    password: str | None,
    role: str,
    first_name: str | None = None,
    last_name:  str | None = None,
) -> str:
    email_norm = _normalize_email(email)
    base_url, headers = _config()
    admin_users = f"{base_url}/auth/v1/admin/users"

    full_name = f"{(first_name or '').strip()} {(last_name or '').strip()}".strip() or None

    with requests.Session() as s:
        existing = _admin_get_by_email(s, base_url, headers, email_norm)
        meta = {"role": role}
        if first_name: meta["first_name"] = first_name
        if last_name:  meta["last_name"]  = last_name
        if full_name:  meta["full_name"]  = full_name

        if existing:
            uid = existing.get("id")
            if not uid:
                raise SupabaseAdminError("Usuario existente sin id en respuesta Admin")

            patch_payload = {
                "email_confirm": True,
                "user_metadata": meta,
            }
            if password and _has_email_provider(existing):
                patch_payload["password"] = password

            up = s.patch(f"{admin_users}/{uid}", json=patch_payload, headers=headers, timeout=10)
            if up.status_code not in (200, 201):
                # compat: algunos stacks requieren PUT
                up = s.put(f"{admin_users}/{uid}", json=patch_payload, headers=headers, timeout=10)
            if up.status_code not in (200, 201):
                logging.warning("Admin update supabase user (%s) no 2xx: %s %s", uid, up.status_code, up.text)
            return uid

        create_payload = {
            "email": email_norm,
            "email_confirm": True,
            "user_metadata": meta,
        }
        if password:
            create_payload["password"] = password

        cr = s.post(admin_users, json=create_payload, headers=headers, timeout=10)
        if cr.status_code in (200, 201):
            uid = cr.json().get("id")
            if not uid:
                raise SupabaseAdminError("Creación sin id en respuesta")
            return uid

        if cr.status_code in (400, 409, 422):
            again = _admin_get_by_email(s, base_url, headers, email_norm)
            if again and again.get("id"):
                return again["id"]

        raise SupabaseAdminError(f"Admin create fallo {cr.status_code}: {cr.text}")

