
from flask import Flask, request, jsonify, make_response
try:
    # optional dependency: flask-cors
    from flask_cors import CORS
except Exception:
    CORS = None
import requests
import os
import json
import re
try:
    from openai import OpenAI
except Exception:
    OpenAI = None

# AI helper (Gemini / LangChain scaffold)
try:
    from ai import process_command as ai_process_command
except Exception:
    ai_process_command = None

# New agent abstraction (LangChain / Groq)
try:
    from ai_agent import run_text_agent, run_voice_agent, create_plan_events
except Exception:
    run_text_agent = None
    run_voice_agent = None
    create_plan_events = None

app = Flask(__name__)

# Lightweight CORS handling (works even if flask-cors is not installed)
if CORS is not None:
    CORS(app)


@app.before_request
def handle_options_preflight():
    # Respond to OPTIONS requests for CORS preflight quickly
    if request.method == 'OPTIONS':
        resp = make_response()
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, user-token, application-id, secret-key'
        return resp


@app.after_request
def set_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, user-token, application-id, secret-key'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

# --- Configuración de Backendless ---
# Prefer using environment variables for credentials in development/CI.
# These values fall back to the existing hard-coded values for convenience.
BACKENDLESS_APP_ID = os.environ.get('BACKENDLESS_APP_ID', 'E60A01B9-D08F-4932-915E-F479323571A3')
BACKENDLESS_REST_API_KEY = os.environ.get('BACKENDLESS_REST_API_KEY', '222DE0E2-363D-468A-A5B3-0556E6A62310')
BACKENDLESS_BASE_URL = f"https://api.backendless.com/{BACKENDLESS_APP_ID}/{BACKENDLESS_REST_API_KEY}"

HEADERS = {
    "Content-Type": "application/json",
    "application-id": BACKENDLESS_APP_ID,
    "secret-key": BACKENDLESS_REST_API_KEY,
    "api-version": "1.0"
}

# Convenience URLs for Backendless endpoints we need
BACKENDLESS_USERS_URL = f"{BACKENDLESS_BASE_URL}/users"
BACKENDLESS_USUARIOS_TABLE = f"{BACKENDLESS_BASE_URL}/data/usuarios"
# Note: your Backendless tables are named `usuarios` and `citas` in the Console.
# Use the exact table name (`citas`) for the Cita table.
BACKENDLESS_CITA_TABLE = f"{BACKENDLESS_BASE_URL}/data/citas"


def _search_citas_by_query(query: str, limit: int = 10):
    """Try to find candidate citas that match a natural-language query.

    This is a simple heuristic: build a `where` clause searching the `titulo`
    and `descripcion` fields for keywords extracted from the query. Returns a
    list of candidate dicts with keys: id (objectId), titulo, fecha, hora_inicio, snippet.
    """
    if not query:
        return []
    # crude keyword extraction: remove small stopwords and take top keywords
    kws = [w for w in re.findall(r"[\wáéíóúñÑ]+", query.lower()) if len(w) > 2]
    stop = {'con', 'el', 'la', 'los', 'las', 'a', 'en', 'de', 'del', 'para', 'por', 'que', 'este', 'esta', 'próximo', 'próxima', 'siguiente', 'un', 'una'}
    kws = [k for k in kws if k not in stop]
    if not kws:
        return []
    clauses = []
    for k in kws[:5]:
        clauses.append(f"titulo LIKE '%{k}%'")
        clauses.append(f"descripcion LIKE '%{k}%'")
    where = ' OR '.join(clauses)
    try:
        r = requests.get(BACKENDLESS_CITA_TABLE, headers=HEADERS, params={'where': where, 'pageSize': limit}, timeout=10)
        r.raise_for_status()
        found = r.json() or []
        candidates = []
        for rec in found:
            candidates.append({
                'id': rec.get('objectId') or rec.get('id'),
                'titulo': rec.get('titulo'),
                'fecha': rec.get('fecha'),
                'hora_inicio': rec.get('hora_inicio'),
                'snippet': f"{rec.get('titulo','')} - {rec.get('fecha','')} {rec.get('hora_inicio','')}",
            })
        return candidates
    except Exception:
        return []

# --- Servicios CRUD ---


@app.route('/users/register', methods=['POST'])
def users_register():
    """Proxy endpoint to register a user in Backendless Users service."""
    data = request.json
    try:
        url = f"{BACKENDLESS_USERS_URL}/register"
        print(f"[DEBUG] POST to Backendless URL: {url}")
        response = requests.post(url, json=data, headers=HEADERS)
        response.raise_for_status()
        created_user = response.json()

        # Create a corresponding record in the `usuarios` data table so the
        # frontend / admin can see application-level profiles. We store the
        # Backendless user objectId in `backendlessUserId` for linkage.
        try:
            usuario_payload = {
                "email": created_user.get('email'),
                "nombre": created_user.get('nombre'),
                "backendlessUserId": created_user.get('objectId')
            }
            # best-effort: don't fail registration if this auxiliary write fails
            requests.post(BACKENDLESS_USUARIOS_TABLE, json=usuario_payload, headers=HEADERS, timeout=10)
        except Exception:
            print('[WARN] creating usuarios record failed (non-fatal)')

        return jsonify(created_user), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/users/login', methods=['POST'])
def users_login():
    """Proxy endpoint to login a user via Backendless Users service."""
    data = request.json
    try:
        url = f"{BACKENDLESS_USERS_URL}/login"
        print(f"[DEBUG] POST to Backendless URL: {url}")
        response = requests.post(url, json=data, headers=HEADERS)
        response.raise_for_status()
        # Backendless may return token in JSON or headers; return whatever it sends
        try:
            body = response.json()
        except Exception:
            body = {'message': response.text}
        # If token present in headers, include it in the JSON for the frontend convenience
        token = response.headers.get('user-token') or response.headers.get('user-token'.lower())
        if token and isinstance(body, dict) and 'user-token' not in body:
            body['user-token'] = token
        # After successful login, ensure a `usuarios` record exists for this
        # Backendless user (upsert by backendlessUserId). This keeps the
        # application `usuarios` table in sync with the Users service.
        try:
            if isinstance(body, dict) and body.get('objectId'):
                backendless_id = body.get('objectId')
                # Query for existing profile by backendlessUserId
                q = f"backendlessUserId = '{backendless_id}'"
                # Use params so requests encodes the where clause correctly
                r = requests.get(BACKENDLESS_USUARIOS_TABLE, headers=HEADERS, params={'where': q}, timeout=10)
                if r.ok:
                    found = r.json()
                    if found:
                        # update existing profile with latest email/nombre
                        obj_id = found[0]['objectId']
                        update_url = f"{BACKENDLESS_USUARIOS_TABLE}/{obj_id}"
                        requests.put(update_url, json={
                            'email': body.get('email'),
                            'nombre': body.get('nombre'),
                            'backendlessUserId': backendless_id
                        }, headers=HEADERS, timeout=10)
                    else:
                        # create a new usuarios record
                        requests.post(BACKENDLESS_USUARIOS_TABLE, json={
                            'email': body.get('email'),
                            'nombre': body.get('nombre'),
                            'backendlessUserId': backendless_id
                        }, headers=HEADERS, timeout=10)
        except Exception:
            print('[WARN] sync to usuarios table failed (non-fatal)')

        return jsonify(body), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/users/logout', methods=['GET'])
def users_logout():
    """Proxy endpoint to logout the current user. Requires user-token header."""
    token = request.headers.get('user-token')
    headers = dict(HEADERS)
    if token:
        headers['user-token'] = token
    try:
        url = f"{BACKENDLESS_USERS_URL}/logout"
        print(f"[DEBUG] GET to Backendless URL: {url}")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return jsonify({"message": "Logged out"}), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/debug/urls', methods=['GET'])
def debug_urls():
    # Return computed Backendless URLs (safe to share) to help debugging
    return jsonify({
        'BACKENDLESS_BASE_URL': BACKENDLESS_BASE_URL,
        'BACKENDLESS_USERS_URL': BACKENDLESS_USERS_URL,
        'BACKENDLESS_USUARIOS_TABLE': BACKENDLESS_USUARIOS_TABLE,
        'BACKENDLESS_CITA_TABLE': BACKENDLESS_CITA_TABLE,
    })


@app.route('/usuarios', methods=['POST'])
def create_usuario():
    """
    Crea un nuevo usuario.
    Ejemplo de request body:
    {
        "id": 1,
        "first_name": "Juan",
        "last_name": "Pérez",
        "email": "juan.perez@example.com",
        "gender": "Male",
        "ip_address": "192.168.1.1"
    }
    """
    data = request.json
    try:
        response = requests.post(BACKENDLESS_USUARIOS_TABLE, json=data, headers=HEADERS)
        response.raise_for_status()  # Lanza una excepción para códigos de estado de error
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/usuarios', methods=['GET'])
def get_all_usuarios():
    """
    Obtiene todos los usuarios.
    """
    try:
        response = requests.get(BACKENDLESS_USUARIOS_TABLE, headers=HEADERS)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/usuarios/<int:id>', methods=['GET'])
def get_usuario_by_id(id):
    """
    Obtiene un usuario por su ID.
    Backendless utiliza un campo 'objectId' para identificar registros.
    Necesitamos hacer una consulta para encontrar el usuario con el 'id' proporcionado.
    """
    where_clause = f"id = {id}"
    try:
        # Use params to ensure proper encoding of the where clause
        response = requests.get(BACKENDLESS_USUARIOS_TABLE, headers=HEADERS, params={'where': where_clause})
        response.raise_for_status()
        usuarios = response.json()
        if usuarios:
            return jsonify(usuarios[0]), 200
        else:
            return jsonify({"message": f"Usuario con ID {id} no encontrado"}), 404
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/usuarios/<int:id>', methods=['PUT'])
def update_usuario(id):
    """
    Actualiza un usuario existente por su ID.
    Backendless requiere el 'objectId' para actualizaciones.
    Primero buscamos el usuario por el 'id' de la tabla, luego actualizamos usando el 'objectId'.
    Ejemplo de request body:
    {
        "first_name": "Juan Carlos",
        "email": "juan.carlos@example.com"
    }
    """
    data = request.json
    where_clause = f"id = {id}"
    try:
        # 1. Encontrar el objectId del usuario por su 'id' de tabla
        response_find = requests.get(BACKENDLESS_USUARIOS_TABLE, headers=HEADERS, params={'where': where_clause})
        response_find.raise_for_status()
        usuarios = response_find.json()

        if not usuarios:
            return jsonify({"message": f"Usuario con ID {id} no encontrado"}), 404

        backendless_object_id = usuarios[0]['objectId']
        update_url = f"{BACKENDLESS_USUARIOS_TABLE}/{backendless_object_id}"

        # 2. Realizar la actualización
        response_update = requests.put(update_url, json=data, headers=HEADERS)
        response_update.raise_for_status()
        return jsonify(response_update.json()), response_update.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/usuarios/<int:id>', methods=['DELETE'])
def delete_usuario(id):
    """
    Elimina un usuario por su ID.
    Backendless requiere el 'objectId' para eliminaciones.
    Primero buscamos el usuario por el 'id' de la tabla, luego eliminamos usando el 'objectId'.
    """
    where_clause = f"id = {id}"
    try:
        # 1. Encontrar el objectId del usuario por su 'id' de tabla
        response_find = requests.get(BACKENDLESS_USUARIOS_TABLE, headers=HEADERS, params={'where': where_clause})
        response_find.raise_for_status()
        usuarios = response_find.json()

        if not usuarios:
            return jsonify({"message": f"Usuario con ID {id} no encontrado"}), 404

        backendless_object_id = usuarios[0]['objectId']
        delete_url = f"{BACKENDLESS_USUARIOS_TABLE}/{backendless_object_id}"

        # 2. Realizar la eliminación
        response_delete = requests.delete(delete_url, headers=HEADERS)
        response_delete.raise_for_status()
        # Backendless devuelve un JSON vacío o un objeto con "deletionTime" en caso de éxito.
        # No hay un body significativo para devolver más allá del 200 OK.
        return jsonify({"message": f"Usuario con ID {id} eliminado exitosamente"}), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data/Cita', methods=['POST'])
def create_cita():
    data = request.json
    try:
        # Forward the incoming user-token (if present) so Backendless will set
        # the ownerId of the created record automatically.
        headers = dict(HEADERS)
        token = request.headers.get('user-token')
        if token:
            headers['user-token'] = token

        response = requests.post(BACKENDLESS_CITA_TABLE, json=data, headers=headers)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data/Cita', methods=['GET'])
def list_citas():
    where = request.args.get('where')
    try:
        # Use params so requests handles encoding of the where clause correctly
        params = {'where': where} if where else None
        response = requests.get(BACKENDLESS_CITA_TABLE, headers=HEADERS, params=params)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data/Cita/<id>', methods=['GET'])
def get_cita(id):
    try:
        response = requests.get(f"{BACKENDLESS_CITA_TABLE}/{id}", headers=HEADERS)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data/Cita/<id>', methods=['PUT'])
def update_cita(id):
    data = request.json
    try:
        response = requests.put(f"{BACKENDLESS_CITA_TABLE}/{id}", json=data, headers=HEADERS)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data/Cita/<id>', methods=['DELETE'])
def delete_cita(id):
    try:
        response = requests.delete(f"{BACKENDLESS_CITA_TABLE}/{id}", headers=HEADERS)
        response.raise_for_status()
        return jsonify({"message": "Cita deleted"}), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data/Comando', methods=['POST'])
def process_comando():
    data = request.json
    texto = data.get('texto') if data else ''
    confirm = bool(data.get('confirm')) if data else False
    # If AI helper is available, use it to parse intent and produce structured result.
    if ai_process_command:
        try:
            parsed = ai_process_command(texto)
            # Ensure parsed is JSON-serializable
            # If caller requested confirmation execution and the AI parsed a create/update/delete,
            # attempt to perform the action against Backendless (server-side execution).
            if confirm and isinstance(parsed, dict):
                action = parsed.get('action')
                resultado = parsed.get('resultado')
                # Forward user-token if present so Backendless sets ownerId
                headers = dict(HEADERS)
                token = request.headers.get('user-token')
                if token:
                    headers['user-token'] = token

                # CREATE (existing behavior)
                if action == 'create' and resultado and isinstance(resultado, dict):
                    try:
                        resp = requests.post(BACKENDLESS_CITA_TABLE, json=resultado, headers=headers)
                        resp.raise_for_status()
                        created = resp.json()
                        parsed['executed'] = {'status': 'created', 'record': created}
                        return jsonify(parsed), 201
                    except requests.exceptions.RequestException as e:
                        parsed['executed'] = {'status': 'error', 'message': str(e)}
                        return jsonify(parsed), 500

                # UPDATE: accept either 'updates' (partial) or 'resultado' (full)
                if action == 'update':
                    target = parsed.get('target_id')
                    body = parsed.get('updates') or resultado
                    if not target:
                        # No target id: if query provided, search and return candidates for clarification
                        if parsed.get('query'):
                            parsed['candidates'] = _search_citas_by_query(parsed.get('query'))
                            return jsonify(parsed), 200
                        parsed['executed'] = {'status': 'error', 'message': 'target_id missing for update'}
                        return jsonify(parsed), 400
                    if not body:
                        parsed['executed'] = {'status': 'error', 'message': 'no updates provided for update'}
                        return jsonify(parsed), 400
                    try:
                        resp = requests.put(f"{BACKENDLESS_CITA_TABLE}/{target}", json=body, headers=headers)
                        resp.raise_for_status()
                        updated = resp.json()
                        parsed['executed'] = {'status': 'updated', 'record': updated}
                        return jsonify(parsed), 200
                    except requests.exceptions.RequestException as e:
                        parsed['executed'] = {'status': 'error', 'message': str(e)}
                        return jsonify(parsed), 500

                # DELETE: require target_id; if missing try query -> candidates
                if action == 'delete':
                    target = parsed.get('target_id')
                    if not target:
                        if parsed.get('query'):
                            parsed['candidates'] = _search_citas_by_query(parsed.get('query'))
                            return jsonify(parsed), 200
                        parsed['executed'] = {'status': 'error', 'message': 'target_id missing for delete'}
                        return jsonify(parsed), 400
                    try:
                        resp = requests.delete(f"{BACKENDLESS_CITA_TABLE}/{target}", headers=headers)
                        resp.raise_for_status()
                        parsed['executed'] = {'status': 'deleted'}
                        return jsonify(parsed), 200
                    except requests.exceptions.RequestException as e:
                        parsed['executed'] = {'status': 'error', 'message': str(e)}
                        return jsonify(parsed), 500

            # If not confirming execution, or confirm==False, just return the parsed suggestion
            return jsonify(parsed), 200
        except Exception as e:
            # Return model error to frontend so it can display a helpful message
            return jsonify({"action": "none", "mensaje": f"Error al procesar comando: {str(e)}", "resultado": None}), 500

    # Fallback: naive echo
    result = {
        "action": "none",
        "mensaje": f"Comando recibido: {texto}",
        "resultado": None
    }
    return jsonify(result), 201

if __name__ == '__main__':
    app.run(debug=True)


def _make_groq_client():
    """Return an OpenAI-compatible client configured for Groq if available."""
    if OpenAI is None:
        return None
    groq_key = os.environ.get('GROQ_API_KEY')
    groq_base = os.environ.get('GROQ_BASE_URL', 'https://api.groq.com/openai/v1')
    return OpenAI(api_key=groq_key, base_url=groq_base)


@app.route('/api/ai/text', methods=['POST'])
def api_ai_text():
    """Process a text instruction via the new ai_agent abstraction."""
    data = request.json or {}
    text = data.get('text') or data.get('texto')
    user_ctx = data.get('context') or {}
    if run_text_agent is None:
        return jsonify({'error': 'AI agent not available'}), 500
    try:
        parsed = run_text_agent(text, user_ctx)
        return jsonify(parsed), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/voice', methods=['POST'])
def api_ai_voice():
    """Accepts either JSON {transcript:...} or multipart form with `audio` file.
    If audio file provided, attempts transcription using Groq via OpenAI client.
    """
    # If transcript provided directly
    if request.is_json:
        data = request.json
        transcript = data.get('transcript') or data.get('texto')
        user_ctx = data.get('context') or {}
        if run_voice_agent is None:
            return jsonify({'error': 'AI agent not available'}), 500
        return jsonify(run_voice_agent(transcript, user_ctx)), 200

    # Else, handle multipart audio upload
    if 'audio' not in request.files:
        return jsonify({'error': 'No transcript or audio file provided'}), 400
    audio = request.files['audio']
    client = _make_groq_client()
    if client is None:
        return jsonify({'error': 'OpenAI/Groq client not available'}), 500
    try:
        # Try client helper if available
        if hasattr(client, 'audio') and hasattr(client.audio, 'transcriptions'):
            resp = client.audio.transcriptions.create(file=audio, model='whisper-large-v3-turbo')
            transcript = getattr(resp, 'text', None) or getattr(resp, 'transcript', None) or str(resp)
        else:
            # Fallback: call Groq OpenAI-compatible REST endpoint directly
            groq_base = os.environ.get('GROQ_BASE_URL', 'https://api.groq.com/openai/v1')
            groq_key = os.environ.get('GROQ_API_KEY')
            url = groq_base.rstrip('/') + '/audio/transcriptions'
            files = {'file': (audio.filename, audio.stream, audio.mimetype)}
            headers = {'Authorization': f'Bearer {groq_key}'}
            r = requests.post(url, files=files, headers=headers, timeout=60)
            r.raise_for_status()
            data = r.json()
            # Attempt common fields
            transcript = data.get('text') or data.get('transcript') or json.dumps(data, ensure_ascii=False)
    except Exception as e:
        return jsonify({'error': 'Transcription failed: ' + str(e)}), 500

    # Delegate to voice agent
    if run_voice_agent is None:
        return jsonify({'error': 'AI agent not available after transcription', 'transcript': transcript}), 500
    return jsonify(run_voice_agent(transcript, {})), 200


@app.route('/api/ai/plan', methods=['POST'])
def api_ai_plan():
    data = request.json or {}
    goal = data.get('goal')
    window = data.get('window')
    prefs = data.get('preferences')
    if create_plan_events is None:
        return jsonify({'error': 'Plan generator not available'}), 500
    try:
        events = create_plan_events(goal, window, prefs)
        return jsonify({'plan': events}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- OAuth / Integrations stubs (Google / Outlook) ---
@app.route('/integrations/google/start', methods=['GET'])
def integrations_google_start():
    # Redirect the user to Google OAuth consent screen (server should implement)
    return jsonify({'message': 'TODO: implement Google OAuth start endpoint'}), 501


@app.route('/integrations/google/callback', methods=['GET'])
def integrations_google_callback():
    # Exchange code for tokens and persist them securely (TODO)
    return jsonify({'message': 'TODO: implement Google OAuth callback endpoint'}), 501


@app.route('/integrations/outlook/start', methods=['GET'])
def integrations_outlook_start():
    return jsonify({'message': 'TODO: implement Outlook OAuth start endpoint'}), 501


@app.route('/integrations/outlook/callback', methods=['GET'])
def integrations_outlook_callback():
    return jsonify({'message': 'TODO: implement Outlook OAuth callback endpoint'}), 501