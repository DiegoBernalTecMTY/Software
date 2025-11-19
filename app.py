from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import requests
import os
import json
from dotenv import load_dotenv
from ai_agent import Agente_de_Citas, transcription_service
import io

# Load environment variables from .env file
load_dotenv()



app = Flask(__name__)
# Explicit CORS configuration: allow frontend origins, common headers, and credentials.
from flask_cors import CORS

# Allow all origins in development, but ensure the frontend can send `user-token` and Content-Type.
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers=["Content-Type", "Authorization", "user-token"], expose_headers=["user-token"]) 

# --- Backendless Configuration ---
BACKENDLESS_APP_ID = os.environ.get('BACKENDLESS_APP_ID')
BACKENDLESS_REST_API_KEY = os.environ.get('BACKENDLESS_REST_API_KEY')
BACKENDLESS_BASE_URL = f"https://api.backendless.com/{BACKENDLESS_APP_ID}/{BACKENDLESS_REST_API_KEY}"
BACKENDLESS_USERS_URL = f"{BACKENDLESS_BASE_URL}/users"

HEADERS = {
    "Content-Type": "application/json",
}

# --- NEW: Secure User ID Retriever ---
@app.route('/users/me', methods=['GET'])
def get_user_id_from_token(user_token: str) -> str | None:
    """
    Validate a `user-token` and retrieve the Backendless `objectId`.

    Strategy:
    - If the token was issued via our proxied `/users/login`, we store a
      mapping in `_TOKEN_TO_USER` and can return the objectId directly.
    - Otherwise, we attempt to call Backendless (best-effort). Note: some
      Backendless REST endpoints treat `/users/me` as an entity id and will
      return 404 ("Entity with ID me not found"). In that case this function
      will log the failure and return None.
    """
    user_token = request.headers.get('user-token')
    if not user_token:
        return None

    # 1) Fast path: check mappings for tokens we issued via /users/login
    mapped = _TOKEN_TO_USER.get(user_token)
    if mapped:
        return mapped

    # 2) Fallback: try to query Backendless for the current user (may return 404)
    try:
        headers = {'user-token': user_token}
        url = f"{BACKENDLESS_USERS_URL}/me"
        print(f"[AUTH_DEBUG] GET {url} headers={headers}")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        user_data = response.json()
        return user_data.get('objectId')
    except requests.exceptions.RequestException as e:
        msg = f"[AUTH_ERROR] Failed to validate token and get user ID: {e}"
        try:
            resp = getattr(e, 'response', None)
            if resp is not None:
                msg += f" | status={resp.status_code} | body={resp.text}"
        except Exception:
            pass
        print(msg)
        return None

def _mask(s: str) -> str:
    if not s:
        return None
    s = str(s)
    if len(s) <= 6:
        return '****'
    return s[:3] + '...' + s[-3:]


@app.route('/debug/urls', methods=['GET'])
def debug_urls():
    """Return masked Backendless URL and indicate whether env vars loaded."""
    return jsonify({
        'backendless_base_url': BACKENDLESS_BASE_URL,
        'backendless_app_id': _mask(BACKENDLESS_APP_ID),
        'backendless_rest_api_key': _mask(BACKENDLESS_REST_API_KEY),
    }), 200


@app.route('/debug/env', methods=['GET'])
def debug_env():
    """Report presence of important env vars (without revealing secrets)."""
    return jsonify({
        'has_groq_api_key': bool(os.environ.get('GROQ_API_KEY')),
        'has_backendless_app_id': bool(BACKENDLESS_APP_ID),
        'has_backendless_rest_api_key': bool(BACKENDLESS_REST_API_KEY),
    }), 200

# Backendless API endpoints
# Use the canonical table path that matches the Backendless table name used
# by the frontend (`/data/Cita`). This ensures consistent behavior
# regardless of calling `/data/citas` or `/data/Cita` on our proxy.
BACKENDLESS_CITA_TABLE_URL = f"{BACKENDLESS_BASE_URL}/data/citas"
# Notifications table URL
BACKENDLESS_NOTIF_TABLE_URL = f"{BACKENDLESS_BASE_URL}/data/notificaciones"

# Simple in-memory map for tokens obtained via this proxy: user-token -> objectId
# This permits the server to validate tokens that were issued through our
# proxied `/users/login` endpoint without relying on a `/users/me` REST route
# which Backendless may not support (it treats 'me' as an entity id).
_TOKEN_TO_USER: dict = {}

# --- Helper to map agent response to frontend format ---
def _map_agent_response_to_frontend(agent_response: dict) -> dict:
    """
    Maps the output from the new agent to the CommandResponse shape
    the frontend expects: { exito, respuesta, mensaje, resultado }.
    """
    if not isinstance(agent_response, dict):
        return {'exito': False, 'respuesta': str(agent_response), 'mensaje': 'Error inesperado del agente.', 'resultado': None}

    # The agent's direct output is the "respuesta"
    respuesta = agent_response.get('output', 'No se pudo procesar el comando.')
    
    # Check if the agent's output contains structured data from a tool
    # LangChain agents often return stringified JSON from tools.
    tool_result_str = agent_response.get('tool_result')
    resultado = None
    if tool_result_str:
        try:
            # Try to parse it as JSON
            resultado = json.loads(tool_result_str)
        except (json.JSONDecodeError, TypeError):
            # If not JSON, just pass the raw string
            resultado = tool_result_str

    return {
        'exito': True,  # Assume success if the agent provided a response
        'respuesta': respuesta,
        'mensaje': respuesta, # Use the same for mensaje for simplicity
        'resultado': resultado,
        'raw': agent_response, # Keep the raw agent output for debugging
    }

# --- Citas (Appointments) CRUD API Endpoints ---
# These endpoints are called by the tools in ai_agent.py

@app.route('/data/citas', methods=['POST'])
@app.route('/data/Cita', methods=['POST'])
def create_cita():
    user_token = request.headers.get('user-token')
    if not get_user_id_from_token(user_token): # Validate token before creating
        return jsonify({"error": "Invalid or expired token."}), 401

    try:
        # Forward the token so Backendless can automatically set the ownerId
        headers = {'user-token': user_token, 'Content-Type': 'application/json'}
        response = requests.post(BACKENDLESS_CITA_TABLE_URL, json=request.json, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/data/citas', methods=['GET'])
@app.route('/data/Cita', methods=['GET'])
def get_citas():
    user_token = request.headers.get('user-token')
    user_object_id = get_user_id_from_token(user_token)

    if not user_object_id:
        # If token validation failed, attempt a best-effort extraction of the
        # ownerId from the incoming `where` query parameter. The frontend
        # often includes `where=ownerId = '<objectId>'` when fetching citas.
        # This is a development convenience only — in production require
        # proper token validation or a secure introspection endpoint.
        agent_where_clause = request.args.get('where')
        extracted_owner = None
        if agent_where_clause:
            import re
            m = re.search(r"ownerId\s*=\s*'([0-9A-Fa-f-]{36})'", agent_where_clause)
            if m:
                extracted_owner = m.group(1)
                print(f"[AUTH_WARN] Token validation failed; extracted ownerId from query: {extracted_owner}")
                user_object_id = extracted_owner
        if not user_object_id:
            return jsonify({"error": "Invalid or expired token. Please log in again."}), 401

    # SECURE FILTER INJECTION
    owner_filter = f"ownerId = '{user_object_id}'"
    agent_where_clause = request.args.get('where')

    if agent_where_clause:
        # Combine the mandatory owner filter with the agent's query
        final_where = f"{owner_filter} AND ({agent_where_clause})"
    else:
        final_where = owner_filter

    try:
        params = {'where': final_where}
        # Forward the user's token when calling Backendless. Some Backendless
        # setups expect the token even when filtering by ownerId, and it
        # improves consistency with other endpoints.
        headers = {'Content-Type': 'application/json'}
        if user_token:
            headers['user-token'] = user_token

        print(f"[DEBUG] Fetching citas from Backendless: url={BACKENDLESS_CITA_TABLE_URL} params={params} headers={dict(headers)}")
        response = requests.get(BACKENDLESS_CITA_TABLE_URL, params=params, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        # Provide detailed backend response info for debugging
        msg = str(e)
        try:
            resp = getattr(e, 'response', None)
            if resp is not None:
                msg = f"Upstream status={resp.status_code} body={resp.text}"
        except Exception:
            pass
        print(f"[ERROR] Error fetching citas: {msg}")
        return jsonify({"error": msg}), 500
        
@app.route('/data/citas/<string:object_id>', methods=['GET'])
@app.route('/data/Cita/<string:object_id>', methods=['GET'])
def get_cita_by_id(object_id):
    try:
        url = f"{BACKENDLESS_CITA_TABLE_URL}/{object_id}"
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e), "message": "Failed to retrieve appointment from Backendless"}), 500

@app.route('/data/citas/<string:object_id>', methods=['PUT'])
@app.route('/data/Cita/<string:object_id>', methods=['PUT'])
def update_cita(object_id):
    user_token = request.headers.get('user-token')
    if not get_user_id_from_token(user_token):
        return jsonify({"error": "Invalid or expired token."}), 401

    try:
        headers = {'user-token': user_token, 'Content-Type': 'application/json'}
        url = f"{BACKENDLESS_CITA_TABLE_URL}/{object_id}"
        response = requests.put(url, json=request.json, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        # If the user doesn't own the object, Backendless will return a 403/404, caught here.
        return jsonify({"error": str(e)}), 500


@app.route('/data/citas/<string:object_id>', methods=['DELETE'])
@app.route('/data/Cita/<string:object_id>', methods=['DELETE'])
def delete_cita(object_id):
    user_token = request.headers.get('user-token')
    # Validate token and get user object id (needed to scope notification deletion)
    user_object_id = get_user_id_from_token(user_token)
    if not user_object_id:
        return jsonify({"error": "Invalid or expired token."}), 401

    headers = {'user-token': user_token} if user_token else {}

    # 1) Attempt to delete any notifications related to this cita for this user.
    #    We try multiple common field names that the frontend/backend may use
    #    to reference a cita on a notification record.
    try:
        owner_filter = f"ownerId = '{user_object_id}'"
        cita_filters = (
            f"citaObjectId = '{object_id}' OR cita_object_id = '{object_id}' OR cita = '{object_id}'"
        )
        where_clause = f"{owner_filter} AND ({cita_filters})"
        params = {'where': where_clause}
        # Backendless supports DELETE with a `where` param to remove multiple records.
        notif_url = BACKENDLESS_NOTIF_TABLE_URL
        notif_resp = requests.delete(notif_url, params=params, headers=headers, timeout=10)
        if notif_resp.status_code >= 400:
            # Log and continue — do not block cita deletion on notification cleanup failure
            print(f"[WARN] Failed to delete related notifications for cita {object_id}: status={notif_resp.status_code} body={notif_resp.text}")
        else:
            print(f"[DEBUG] Deleted related notifications for cita {object_id}: status={notif_resp.status_code} body={notif_resp.text}")
    except requests.exceptions.RequestException as e:
        # Log the exception but proceed to delete the cita itself.
        print(f"[ERROR] Exception while deleting related notifications for cita {object_id}: {e}")

    # 2) Delete the cita itself
    try:
        url = f"{BACKENDLESS_CITA_TABLE_URL}/{object_id}"
        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


# --- Notificaciones (Reminders) CRUD API Endpoints ---
# These endpoints allow the frontend to list, read and delete notification records
# The Backendless `notificaciones` table is expected to exist and be protected by
# ownerId; we forward the `user-token` header and enforce owner filtering when
# possible (similar to the citas endpoints).


@app.route('/data/notificaciones', methods=['GET'])
@app.route('/data/Notificacion', methods=['GET'])
def get_notificaciones():
    user_token = request.headers.get('user-token')
    user_object_id = get_user_id_from_token(user_token)

    if not user_object_id:
        # Attempt to extract ownerId from where clause as fallback (dev convenience)
        agent_where_clause = request.args.get('where')
        extracted_owner = None
        if agent_where_clause:
            import re
            m = re.search(r"ownerId\s*=\s*'([0-9A-Fa-f-]{36})'", agent_where_clause)
            if m:
                extracted_owner = m.group(1)
                print(f"[AUTH_WARN] Token validation failed; extracted ownerId from query: {extracted_owner}")
                user_object_id = extracted_owner
        if not user_object_id:
            return jsonify({"error": "Invalid or expired token. Please log in again."}), 401

    # Build owner filter and combine with agent where clause if provided
    owner_filter = f"ownerId = '{user_object_id}'"
    agent_where_clause = request.args.get('where')
    if agent_where_clause:
        final_where = f"{owner_filter} AND ({agent_where_clause})"
    else:
        final_where = owner_filter

    try:
        params = {'where': final_where}
        headers = {'Content-Type': 'application/json'}
        if user_token:
            headers['user-token'] = user_token

        print(f"[DEBUG] Fetching notificaciones from Backendless: url={BACKENDLESS_NOTIF_TABLE_URL} params={params} headers={dict(headers)}")
        response = requests.get(BACKENDLESS_NOTIF_TABLE_URL, params=params, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        msg = str(e)
        try:
            resp = getattr(e, 'response', None)
            if resp is not None:
                msg = f"Upstream status={resp.status_code} body={resp.text}"
        except Exception:
            pass
        print(f"[ERROR] Error fetching notificaciones: {msg}")
        return jsonify({"error": msg}), 500


@app.route('/data/notificaciones/<string:object_id>', methods=['GET'])
@app.route('/data/Notificacion/<string:object_id>', methods=['GET'])
def get_notificacion_by_id(object_id):
    try:
        url = f"{BACKENDLESS_NOTIF_TABLE_URL}/{object_id}"
        headers = dict(HEADERS)
        token = request.headers.get('user-token')
        if token:
            headers['user-token'] = token
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e), "message": "Failed to retrieve notification from Backendless"}), 500


@app.route('/data/notificaciones/<string:object_id>', methods=['DELETE'])
@app.route('/data/Notificacion/<string:object_id>', methods=['DELETE'])
def delete_notificacion(object_id):
    user_token = request.headers.get('user-token')
    if not get_user_id_from_token(user_token):
        return jsonify({"error": "Invalid or expired token."}), 401

    try:
        headers = {'user-token': user_token}
        url = f"{BACKENDLESS_NOTIF_TABLE_URL}/{object_id}"
        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data/notificaciones', methods=['POST'])
@app.route('/data/Notificacion', methods=['POST'])
def create_notificacion():
    """
    Create a new notification linked to a cita.
    Validates that the user-token is present and that the referenced cita
    belongs to the same user. Forwards the payload to Backendless and
    returns the created object.
    """
    user_token = request.headers.get('user-token')
    user_object_id = get_user_id_from_token(user_token)

    if not user_object_id:
        return jsonify({"error": "Invalid or expired token."}), 401

    payload = request.json or {}

    # Support either `citaObjectId` (frontend) or `cita_object_id` (backend)
    cita_id = payload.get('citaObjectId') or payload.get('cita_object_id') or payload.get('cita')
    if not cita_id:
        return jsonify({"error": "Missing cita reference (citaObjectId)."}), 400

    # Verify the cita exists and belongs to this user
    try:
        cita_url = f"{BACKENDLESS_CITA_TABLE_URL}/{cita_id}"
        headers = dict(HEADERS)
        # include token to allow Backendless to validate ownership where possible
        if user_token:
            headers['user-token'] = user_token
        resp = requests.get(cita_url, headers=headers)
        resp.raise_for_status()
        cita_obj = resp.json()
        owner = cita_obj.get('ownerId') or cita_obj.get('owner') or cita_obj.get('usuario')
        if owner and owner != user_object_id:
            return jsonify({"error": "You do not own the referenced cita."}), 403
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to verify cita: {e}"}), 400

    # Forward create to Backendless (Backendless will set ownerId based on token)
    try:
        headers = {'user-token': user_token, 'Content-Type': 'application/json'} if user_token else {'Content-Type': 'application/json'}
        response = requests.post(BACKENDLESS_NOTIF_TABLE_URL, json=payload, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        msg = str(e)
        try:
            resp = getattr(e, 'response', None)
            if resp is not None:
                msg = f"Upstream status={resp.status_code} body={resp.text}"
        except Exception:
            pass
        print(f"[ERROR] Error creating notificacion: {msg}")
        return jsonify({"error": msg}), 500

# --- Users / Auth proxy endpoints (Backendless) ---


@app.route('/users/login', methods=['POST'])
def users_login():
    data = request.json
    try:
        url = f"{BACKENDLESS_BASE_URL}/users/login"
        response = requests.post(url, json=data, headers=HEADERS)
        response.raise_for_status()
        resp_json = response.json()
        # Store token->user mapping for tokens issued through this proxy
        token = resp_json.get('user-token') or resp_json.get('userToken')
        object_id = resp_json.get('objectId')
        if token and object_id:
            _TOKEN_TO_USER[token] = object_id
            print(f"[AUTH_DEBUG] Stored token->user mapping for objectId={object_id}")
        # If we didn't store a mapping, log the full response to aid debugging
        if not (token and object_id):
            print(f"[AUTH_DEBUG] Login response without token/objectId mapping: {resp_json}")
        return jsonify(resp_json), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e), "message": "Failed to login with Backendless"}), 500


@app.route('/users/register', methods=['POST'])
def users_register():
    data = request.json
    try:
        url = f"{BACKENDLESS_BASE_URL}/users/register"
        response = requests.post(url, json=data, headers=HEADERS)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e), "message": "Failed to register user with Backendless"}), 500


@app.route('/users/logout', methods=['GET'])
def users_logout():
    # Forward logout call to Backendless; include user-token header if provided
    token = request.headers.get('user-token')
    headers = dict(HEADERS)
    if token:
        headers['user-token'] = token
    try:
        url = f"{BACKENDLESS_BASE_URL}/users/logout"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        # Remove mapping for this token if present
        if token and token in _TOKEN_TO_USER:
            _TOKEN_TO_USER.pop(token, None)
            print(f"[AUTH_DEBUG] Removed token->user mapping for token")
        return jsonify(response.json() if response.content else {}), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e), "message": "Failed to logout with Backendless"}), 500


@app.route('/users/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    token = request.headers.get('user-token')
    headers = dict(HEADERS)
    if token:
        headers['user-token'] = token
    try:
        url = f"{BACKENDLESS_BASE_URL}/users/{user_id}"
        response = requests.put(url, json=data, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e), "message": "Failed to update user in Backendless"}), 500


@app.route('/users/<string:user_id>/password', methods=['PUT'])
def change_user_password(user_id):
    data = request.json
    token = request.headers.get('user-token')
    headers = dict(HEADERS)
    if token:
        headers['user-token'] = token
    try:
        url = f"{BACKENDLESS_BASE_URL}/users/{user_id}/password"
        response = requests.put(url, json=data, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e), "message": "Failed to change user password in Backendless"}), 500

# --- AI Agent Endpoint ---
# Import the new, intelligent agent

# --- AI Agent Endpoint ---

@app.route('/api/ai/text', methods=['POST'])
def handle_ai_text():
    data = request.json or {}
    text = data.get('text')
    session_id = data.get('session_id')
    user_token = request.headers.get('user-token')

    # ✅ Validate token FIRST
    if not user_token:
        return jsonify({"error": "Authentication token is missing."}), 401
    
    if not text:
        return jsonify({"error": "Text input is required."}), 400
    
    if not session_id:
        session_id = "default_session"

    try:
        # ✅ Create agent (inherently uses shared checkpointer)
        current_agent = Agente_de_Citas(session_id=session_id, user_token=user_token)
        
        # ✅ No need to reassign — already set in __init__
        agent_result = current_agent.invoke(text)

        # Map the agent result to the frontend's expected CommandResponse shape
        mapped = _map_agent_response_to_frontend(agent_result)
        return jsonify(mapped), 200
    except Exception as e:
        print(f"[ERROR] An error occurred in handle_ai_text: {e}")
        return jsonify({"error": "An internal error occurred."}), 500

@app.route('/api/session/create', methods=['POST'])
def create_session():
    """
    Create a new conversation session.
    """
    import uuid
    session_id = str(uuid.uuid4())
    return jsonify({"session_id": session_id}), 200


@app.route('/api/ai/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Endpoint stub to receive audio and return a transcription.

    Expected usage (examples):
      - multipart/form-data with a file field named "audio"
      - raw audio bytes in the request body
      - JSON body with a base64-encoded audio payload (optional)

    The function currently validates the request and reads the audio bytes
    into `audio_bytes`. Replace the placeholder section below with your
    preferred transcription implementation (local model, cloud API, etc.).

    Response JSON shape expected by the frontend:
      { "transcript": "...text..." }

    The caller (frontend) should send the transcription back into the
    main text box. The frontend integration is described in a brief note
    in the repository README or can be done by calling this endpoint
    and setting the textarea value to the returned `transcript`.
    """
    # Basic auth check consistent with other endpoints
    user_token = request.headers.get('user-token')
    if not user_token:
        return jsonify({"error": "Authentication token is missing."}), 401

    audio_bytes = None

    # 1) multipart/form-data file upload
    if 'audio' in request.files:
        audio_file = request.files.get('audio')
        if audio_file:
            audio_bytes = audio_file.read()

    # 2) JSON payload with base64 (optional)
    if audio_bytes is None and request.is_json:
        body = request.get_json(silent=True) or {}
        b64 = body.get('audio_base64')
        if b64:
            try:
                import base64
                audio_bytes = base64.b64decode(b64)
            except Exception:
                return jsonify({"error": "Invalid base64 audio payload."}), 400

    # 3) Raw bytes in body
    if audio_bytes is None:
        raw = request.get_data()
        if raw:
            audio_bytes = raw

    if not audio_bytes:
        return jsonify({"error": "No audio provided."}), 400

    # Placeholder: developer (you) will implement actual transcription here.
    # Example:
    #transcript = transcription_service(audio_bytes, language='es-ES')
    # For now return an empty transcript and a helpful message so frontend
    # integration can be completed once you implement the transcription logic.
    try:
        f = io.BytesIO(audio_bytes)
        f.name = 'recording.webm'
        transcript = transcription_service(f)
        return jsonify({"transcript": transcript}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Health Check ---
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


@app.route('/debug/tokens', methods=['GET'])
def debug_tokens():
    """Return masked token->user mappings for debugging (development only)."""
    def mask_token(t: str) -> str:
        if not t: return None
        if len(t) <= 8: return '****'
        return t[:4] + '...' + t[-4:]

    masked = {mask_token(k): v for k, v in _TOKEN_TO_USER.items()}
    return jsonify({'mappings': masked, 'count': len(_TOKEN_TO_USER)}), 200

if __name__ == '__main__':
    # Makes the server accessible on your local network
    app.run(host='0.0.0.0', port=5000, debug=True)