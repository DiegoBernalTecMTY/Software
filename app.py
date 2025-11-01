
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# --- Configuración de Backendless ---
# Reemplaza con tus propias credenciales de Backendless
BACKENDLESS_APP_ID = 'E60A01B9-D08F-4932-915E-F479323571A3'
BACKENDLESS_REST_API_KEY = '222DE0E2-363D-468A-A5B3-0556E6A62310'
BACKENDLESS_BASE_URL = f"https://api.backendless.com/{BACKENDLESS_APP_ID}/{BACKENDLESS_REST_API_KEY}/data/usuarios"

HEADERS = {
    "Content-Type": "application/json",
    "application-id": BACKENDLESS_APP_ID,
    "secret-key": BACKENDLESS_REST_API_KEY,
    "api-version": "1.0"
}

# --- Servicios CRUD ---

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
        response = requests.post(BACKENDLESS_BASE_URL, json=data, headers=HEADERS)
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
        response = requests.get(BACKENDLESS_BASE_URL, headers=HEADERS)
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
    query_url = f"{BACKENDLESS_BASE_URL}?where={where_clause}"
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
    query_url = f"{BACKENDLESS_BASE_URL}?where={where_clause}"
    try:
        # 1. Encontrar el objectId del usuario por su 'id' de tabla
        response_find = requests.get(query_url, headers=HEADERS)
        response_find.raise_for_status()
        usuarios = response_find.json()

        if not usuarios:
            return jsonify({"message": f"Usuario con ID {id} no encontrado"}), 404

        backendless_object_id = usuarios[0]['objectId']
        update_url = f"{BACKENDLESS_BASE_URL}/{backendless_object_id}"

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
    query_url = f"{BACKENDLESS_BASE_URL}?where={where_clause}"
    try:
        # 1. Encontrar el objectId del usuario por su 'id' de tabla
        response_find = requests.get(query_url, headers=HEADERS)
        response_find.raise_for_status()
        usuarios = response_find.json()

        if not usuarios:
            return jsonify({"message": f"Usuario con ID {id} no encontrado"}), 404

        backendless_object_id = usuarios[0]['objectId']
        delete_url = f"{BACKENDLESS_BASE_URL}/{backendless_object_id}"

        # 2. Realizar la eliminación
        response_delete = requests.delete(delete_url, headers=HEADERS)
        response_delete.raise_for_status()
        # Backendless devuelve un JSON vacío o un objeto con "deletionTime" en caso de éxito.
        # No hay un body significativo para devolver más allá del 200 OK.
        return jsonify({"message": f"Usuario con ID {id} eliminado exitosamente"}), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)