import os
import json
import random
from datetime import datetime, timedelta
import psycopg

DB_URL = os.environ["DATABASE_URL"]
SCHEMA = os.environ["MAIN_DB_SCHEMA"]

def handler(request, response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"

    if request.method == "OPTIONS":
        response.status = 200
        return response

    if request.method != "POST":
        response.status = 405
        response.body = json.dumps({"error": "Method not allowed"})
        return response

    try:
        body = request.json()
        phone = str(body.get("phone", "")).strip()
    except Exception:
        response.status = 400
        response.body = json.dumps({"error": "Invalid request body"})
        return response

    import re
    clean = re.sub(r"[\s\-()]", "", phone)
    if not phone or not re.match(r"^\+?[0-9]{10,15}$", clean):
        response.status = 400
        response.body = json.dumps({"error": "Invalid phone number"})
        return response

    normalized = "+" + re.sub(r"\D", "", phone)
    code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    try:
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f'UPDATE "{SCHEMA}".sms_codes SET used = TRUE WHERE phone = %s AND used = FALSE',
                    (normalized,)
                )
                cur.execute(
                    f'INSERT INTO "{SCHEMA}".sms_codes (phone, code, expires_at) VALUES (%s, %s, %s)',
                    (normalized, code, expires_at)
                )
            conn.commit()

        print(f"[send-otp] Phone: {normalized}, Code: {code}")
        response.status = 200
        response.body = json.dumps({"success": True, "message": "OTP sent", "dev_code": code})
    except Exception as e:
        print(f"[send-otp] DB error: {e}")
        response.status = 500
        response.body = json.dumps({"error": "Internal server error"})

    return response
