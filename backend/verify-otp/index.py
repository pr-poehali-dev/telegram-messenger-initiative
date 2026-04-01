import os
import json
import base64
import time
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
        code = str(body.get("code", "")).strip()
    except Exception:
        response.status = 400
        response.body = json.dumps({"error": "Invalid request body"})
        return response

    if not phone or not code:
        response.status = 400
        response.body = json.dumps({"error": "Phone and code are required"})
        return response

    import re
    normalized = "+" + re.sub(r"\D", "", phone)

    try:
        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id FROM "{SCHEMA}".sms_codes
                        WHERE phone = %s
                          AND code = %s
                          AND used = FALSE
                          AND expires_at > NOW()
                        ORDER BY created_at DESC
                        LIMIT 1""",
                    (normalized, code)
                )
                row = cur.fetchone()

                if not row:
                    response.status = 401
                    response.body = json.dumps({"error": "Invalid or expired code"})
                    return response

                otp_id = row[0]

                cur.execute(
                    f'UPDATE "{SCHEMA}".sms_codes SET used = TRUE WHERE id = %s',
                    (otp_id,)
                )

                cur.execute(
                    f"""INSERT INTO "{SCHEMA}".users (phone)
                        VALUES (%s)
                        ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
                        RETURNING id, phone, name""",
                    (normalized,)
                )
                user_row = cur.fetchone()

            conn.commit()

        user_id, user_phone, user_name = user_row
        token = base64.b64encode(f"{user_id}:{user_phone}:{int(time.time())}".encode()).decode()

        print(f"[verify-otp] User authenticated: id={user_id}, phone={user_phone}")

        response.status = 200
        response.body = json.dumps({
            "success": True,
            "token": token,
            "user": {
                "id": user_id,
                "phone": user_phone,
                "name": user_name,
            }
        })
    except Exception as e:
        print(f"[verify-otp] DB error: {e}")
        response.status = 500
        response.body = json.dumps({"error": "Internal server error"})

    return response
