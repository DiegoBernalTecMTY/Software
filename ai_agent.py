import os
import requests
import json
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

import functools

from langchain.agents import create_agent
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langchain_community.chat_message_histories import ChatMessageHistory
from langgraph.checkpoint.memory import InMemorySaver

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
# Using a powerful model capable of function calling and reasoning
DEFAULT_MODEL = os.environ.get("GROQ_TEXT_MODEL", "llama3-70b-8192")
# Base URL for our local Flask API
LOCAL_API_BASE = os.environ.get("LOCAL_API_BASE", "http://127.0.0.1:5000")

# LangSmith Configuration (for tracing and debugging)
# Ensure these are set in your .env file to enable tracing
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_API_KEY"] = os.environ.get("LANGSMITH_API_KEY")
os.environ["LANGCHAIN_PROJECT"] = os.environ.get("LANGSMITH_PROJECT")

CURRENT_USER_TOKEN = None
# --- Agent Tools ---
# These are the functions the agent can decide to use.
# They interact with our Flask backend.

def create_tools(user_token: str):
    """Create tools with user_token baked in"""
    print(f"✅ Creating tools with user_token: {user_token}")  # Debug
    @tool
    def create_appointment(titulo: str, fecha: str, hora_inicio: str, lugar: str = "Por definir", descripcion: str = "") -> str:
        """Create a new appointment for the user."""
        return _create_appointment_impl(titulo, fecha, hora_inicio, lugar, descripcion, user_token)

    @tool
    def list_appointments(where_clause: str = None) -> str:
        """List appointments for the user, optionally filtered by a where clause."""
        return _list_appointments_impl(user_token, where_clause)

    @tool
    def update_appointment(object_id: str, updates: dict) -> str:
        """Update an existing appointment identified by object_id with the provided updates."""
        return _update_appointment_impl(object_id, updates, user_token)

    @tool
    def delete_appointment(object_id: str) -> str:
        """Delete an existing appointment identified by object_id."""
        return _delete_appointment_impl(object_id, user_token)

    return [create_appointment, list_appointments, update_appointment, delete_appointment]

# Implementation functions (the actual logic)
def _create_appointment_impl(titulo: str, fecha: str, hora_inicio: str, lugar: str, descripcion: str, user_token: str) -> str:
    """Crea una nueva cita. La fecha DEBE estar en formato YYYY-MM-DD. La hora_inicio DEBE estar en formato HH:MM (24-hour)."""
    try:
        headers = {'user-token': user_token, 'Content-Type': 'application/json'}
        payload = {"titulo": titulo, "fecha": fecha, "hora_inicio": hora_inicio, "lugar": lugar, "descripcion": descripcion}
        response = requests.post(f"{LOCAL_API_BASE}/data/citas", json=payload, headers=headers)
        response.raise_for_status()
        return f"Cita creada exitosamente. Detalles: {json.dumps(response.json())}"
    except Exception as e:
        return f"Error al crear la cita: {e}. Informa al usuario."

def _list_appointments_impl(user_token: str, where_clause: str = None) -> str:
    """Lista las citas del usuario. Puede filtrar con 'where_clause'. Ejemplo: "titulo LIKE '%dentista%'"""
    try:
        headers = {'user-token': user_token}
        params = {'where': where_clause} if where_clause else None
        response = requests.get(f"{LOCAL_API_BASE}/data/citas", params=params, headers=headers)
        response.raise_for_status()
        citas = response.json()
        if not citas:
            return "No se encontraron citas que coincidan con la búsqueda."
        return f"Citas encontradas: {json.dumps(citas)}"
    except Exception as e:
        return f"Error al listar las citas: {e}. Informa al usuario."

def _update_appointment_impl(object_id: str, updates: dict, user_token: str) -> str:
    """Actualiza una cita existente por su object_id. 'updates' es un diccionario con los campos a cambiar."""
    try:
        headers = {'user-token': user_token, 'Content-Type': 'application/json'}
        response = requests.put(f"{LOCAL_API_BASE}/data/citas/{object_id}", json=updates, headers=headers)
        response.raise_for_status()
        return f"Cita actualizada. Detalles: {json.dumps(response.json())}"
    except Exception as e:
        return f"Error al actualizar la cita: {e}. Verifica que el object_id sea correcto."

def _delete_appointment_impl(object_id: str, user_token: str) -> str:
    """Elimina una cita existente por su object_id."""
    try:
        headers = {'user-token': user_token}
        response = requests.delete(f"{LOCAL_API_BASE}/data/citas/{object_id}", headers=headers)
        response.raise_for_status()
        return f"Cita con ID {object_id} eliminada exitosamente."
    except Exception as e:
        return f"Error al eliminar la cita: {e}. Verifica que el object_id sea correcto."



# --- Agent Definition ---

# In-memory store for session histories.
# In a production environment, you would use a persistent store like Redis or a database.
store = {}

def get_session_history(session_id: str) -> ChatMessageHistory:
    """Retrieves or creates a chat history for a given session ID."""
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]


# The system prompt for the agent
SYSTEM_PROMPT = """
Eres un asistente virtual experto en la gestión de citas, y te comunicas exclusivamente en español.
Tu objetivo es ayudar al usuario a crear, consultar, modificar y eliminar sus citas de manera eficiente y amigable.

INSTRUCCIONES DE OPERACIÓN:
1.  **Conversa Naturalmente**: Sé amable y conversacional.
2.  **Usa las Herramientas**: Para cualquier acción relacionada con citas (crear, listar, etc.), DEBES usar una de las herramientas disponibles.
3.  **Extrae Información**: Presta atención a los detalles en la conversación del usuario (título, fecha, hora, etc.) para usarlos como argumentos en las herramientas. La fecha actual se menciona al inicio de la entrada del usuario y te sirve de referencia para términos como "mañana" o "próximo martes".
4.  **Pide Clarificación**: Si te falta información crucial para usar una herramienta (ej. el título para crear una cita), pide amablemente al usuario que la proporcione.
5.  **Confirma Acciones**: Antes de realizar acciones destructivas como eliminar o modificar una cita, busca la cita primero con `list_appointments` para obtener su `object_id` y presenta la información al usuario para que confirme.
6.  **Formato de Respuesta**: Responde usando el formato ReAct, que incluye tu pensamiento, la acción a tomar y la observación del resultado de la herramienta.

Si al usar las herramientas encuentras errores, como que el usuario no especific'o un rango de fechas, llama de nuevo a la herramienta con un rango de fechas adecuado y corto e informa al usuario sobre el rango de dias que le est'as mostrando.
"""

    
# Initialize the agent executor

checkpointer = InMemorySaver()

    
# Initialize the agent executor
class Agente_de_Citas:
    def __init__(self, session_id: str = "default_session", user_token: str = None):
        self.session_id = session_id  # ✅ Store session_id
        self.user_token = user_token  # ✅ Store user_token
        
        llm = ChatGroq(model=DEFAULT_MODEL, temperature=0, groq_api_key=GROQ_API_KEY)
        
        tools = create_tools(user_token=self.user_token)

        self.agent = create_agent(
            model=llm,
            tools=tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=checkpointer
        )

    def invoke(self, text: str):
        current_time = datetime.now().strftime("%A, %Y-%m-%d %H:%M:%S")
        input_with_datetime = f"Fecha y hora actual: {current_time}\n\n{text}"
        
        result = self.agent.invoke(
            {"messages": [{"role": "user", "content": input_with_datetime}]},
            {"configurable": {"thread_id": self.session_id}},  # ✅ Now defined
        )
        
        # Extract output
        if hasattr(result, 'content'):
            output = result.content
        elif isinstance(result, dict) and 'messages' in result:
            messages = result['messages']
            if messages:
                last_msg = messages[-1]
                output = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)
            else:
                output = "No response"
        else:
            output = str(result)
        
        return {"output": output, "session_id": self.session_id}



# Example of how to use it for testing
if __name__ == '__main__':
    print("Asistente de citas iniciado. Escribe 'salir' para terminar.")
    
    # Use a unique session ID for this test run
    test_session_id = "test-run-123"
    
    while True:
        user_input = input("Tú: ")
        if user_input.lower() == 'salir':
            break
        
        response = run_text_agent(user_input, session_id=test_session_id)
        print(f"Asistente: {response['output']}")