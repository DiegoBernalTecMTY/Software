
from flask import Flask, request, jsonify, make_response
try:
    # optional dependency: flask-cors
    from flask_cors import CORS
except Exception:
    CORS = None
import requests
import os

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
                query_url = f"{BACKENDLESS_USUARIOS_TABLE}?where={q}"
                r = requests.get(query_url, headers=HEADERS, timeout=10)
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
    query_url = f"{BACKENDLESS_USUARIOS_TABLE}?where={where_clause}"
    try:
        response = requests.get(query_url, headers=HEADERS)
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
    query_url = f"{BACKENDLESS_USUARIOS_TABLE}?where={where_clause}"
    try:
        # 1. Encontrar el objectId del usuario por su 'id' de tabla
        response_find = requests.get(query_url, headers=HEADERS)
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
    query_url = f"{BACKENDLESS_USUARIOS_TABLE}?where={where_clause}"
    try:
        # 1. Encontrar el objectId del usuario por su 'id' de tabla
        response_find = requests.get(query_url, headers=HEADERS)
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
        url = f"{BACKENDLESS_CITA_TABLE}{'?where=' + where if where else ''}"
        response = requests.get(url, headers=HEADERS)
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
    # Naive implementation: echo back the command and return no created cita.
    result = {
        "mensaje": f"Comando recibido: {texto}",
        "resultado": None
    }
    return jsonify(result), 201

if __name__ == '__main__':
    app.run(debug=True)