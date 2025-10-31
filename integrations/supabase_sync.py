import logging, requests
from django.conf import settings

class SupabaseAdminError(RuntimeError):
    pass

def _headers():
    base_url = getattr(settings, "SUPABASE_URL", "").strip().rstrip("/")
    service_role = getattr(settings, "SUPABASE_SERVICE_ROLE", "").strip()
    if not base_url or not service_role:
        raise SupabaseAdminError("SUPABASE_URL o SUPABASE_SERVICE_ROLE no configurados")
    return base_url, {
        "apikey": service_role,
        "Authorization": f"Bearer {service_role}",
        "Content-Type": "application/json",
    }

def ensure_supabase_user(email: str, password: str, role: str) -> str:
    email = (email or "").strip().lower()
    base_url, headers = _headers()
    admin_users = f"{base_url}/auth/v1/admin/users"

    #Intentar crear usuario
    payload = {
        "email": email,
        "password": password,
        "user_metadata": {"role": role},
        "email_confirm": True,
    }
    r = requests.post(admin_users, json=payload, headers=headers, timeout=10)
    if r.status_code in (200, 201):
        return r.json().get("id")

    if r.status_code in (400, 409, 422):
        gr = requests.get(admin_users, headers=headers, params={"email": email}, timeout=10)
        if gr.status_code == 200:
            data = gr.json()
            users = data.get("users", data if isinstance(data, list) else [])
            if users:
                u = users[0]
                uid = u.get("id")
                #Si el email no está confirmado, confírmalo y sincroniza password
                upd = {
                    "email_confirm": True,
                    "password": password,
                    "user_metadata": {"role": role},
                }
                up = requests.patch(f"{admin_users}/{uid}", json=upd, headers=headers, timeout=10)
                if up.status_code not in (200, 201):
                    # fallback PUT por compat
                    up = requests.put(f"{admin_users}/{uid}", json=upd, headers=headers, timeout=10)
                return uid

    raise SupabaseAdminError(f"Supabase admin error {r.status_code}: {r.text}")