import os
import requests
import json
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

from typing import Optional, Annotated

from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langchain_community.chat_message_histories import ChatMessageHistory
from langgraph.checkpoint.memory import InMemorySaver
from langchain_core.messages import ToolMessage

import os

import json

from groq import Groq

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
        """
        Create a new appointment for the user.

        The database schema is provided in the system prompt.
        
        Args:
            titulo: The title/name of the appointment
            fecha: The date in YYYY-MM-DD format
            hora_inicio: The time in HH:MM format
            lugar: The location of the appointment
            descripcion: Additional description or notes about the appointment
        
        Returns:
            Confirmation message with appointment details
        """
        return _create_appointment_impl(titulo, fecha, hora_inicio, lugar, descripcion, user_token)

    @tool
    def list_appointments(where_clause: Annotated[Optional[str], "Optional SQL WHERE clause. If not provided, list all appointments."] = None
    ) -> str:
        """
        List all appointments for the user.

        The database schema is provided in the system prompt.

        Examples of proper where_clause format:
        - "fecha = '2025-11-25'"
        - "fecha >= '2025-11-01' AND fecha <= '2025-11-30'"
        - "hora_inicio = '10:00'"
        - "status = 'confirmed'"
        - "titulo LIKE '%dentista%'"
        
        
        Args:
            where_clause: Optional SQL WHERE clause to filter appointments. 
                         Examples: "titulo LIKE '%dentista%'" or "fecha >= '2025-12-01' AND fecha <= '2025-12-31'"
        
        Returns:
            A JSON string containing the list of appointments or an error message.
        """
        return _list_appointments_impl(user_token, where_clause)

    @tool
    def update_appointment(object_id: str, updates: dict) -> str:
        """
        Update an existing appointment.
        
        Args:
            object_id: The ID of the appointment to update
            updates: A dictionary of fields to update with their new values
        
        Returns:
            Confirmation message
        """
        return _update_appointment_impl(object_id, updates, user_token)

    @tool
    def delete_appointment(object_id: str) -> str:
        """Delete an existing appointment identified by object_id."""
        return _delete_appointment_impl(object_id, user_token)

    @tool
    def create_notification(
        cita_object_id: str,
        mensaje: str,
        minutos_antes: int = None,
        schedule_at: Annotated[Optional[str], "ISO timestamp with timezone"] = None,
    ) -> str:
        """
        Creates a new notification (reminder) for a specific appointment.
        To use this tool, you must first know the 'object_id' of the appointment you want the reminder for.
        You can get the appointment's 'object_id' by using the 'list_appointments' tool first.

        Args:
            cita_object_id: The unique ID of the appointment to link the notification to.
            mensaje: The reminder message that will be shown to the user.
            minutos_antes: How many minutes before the appointment the notification should be set for.

        Returns:
            A confirmation message with the details of the created notification.
        """
        # user_token is captured from the create_tools closure; do not expose it
        return _create_notification_impl(cita_object_id, mensaje, minutos_antes, schedule_at, user_token)

    @tool
    def list_notifications(
        where_clause: Annotated[Optional[str], "Optional SQL WHERE clause. If not provided, list all notifications."] = None
    ) -> str:
        """
        Lists all notifications (reminders) for the user.
        Can be filtered using a WHERE clause. This is useful for finding specific notifications to delete.

        Args:
            where_clause: Optional SQL WHERE clause to filter notifications.
                        Examples: "mensaje LIKE '%revisar reporte%'" or "minutos_antes = 60"

        Returns:
            A JSON string containing the list of notifications or an error message.
        """
        return _list_notifications_impl(user_token, where_clause)

    @tool
    def delete_notification(object_id: str) -> str:
        """
        Deletes an existing notification identified by its unique object_id.
        To use this tool, you must first find the 'object_id' of the specific notification you want to delete by using 'list_notifications'.

        Args:
            object_id: The unique ID of the notification to delete.

        Returns:
            A confirmation message indicating success or failure.
        """
        return _delete_notification_impl(object_id, user_token)

    return [create_appointment, list_appointments, update_appointment, delete_appointment, 
            create_notification, list_notifications, delete_notification]

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
        return f"Error al crear la cita: {e}. Intenta de nuevo."

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
        return f"Error al listar las citas: {e}. Intenta otra vez modificando el where clause."

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

# --- NEW NOTIFICATION IMPLEMENTATION FUNCTIONS ---

def _create_notification_impl(cita_object_id: str, mensaje: str, minutos_antes: int = None, schedule_at: Optional[str] = None, user_token: str = None) -> str:
    """Creates a new notification linked to a specific cita.

    If `schedule_at` is not provided, this function will attempt to fetch the cita
    and compute `schedule_at` by subtracting `minutos_antes` from the cita's datetime.
    """
    try:
        headers = {'user-token': user_token, 'Content-Type': 'application/json'}

        # If schedule_at not provided, try to compute it from the cita's datetime
        if not schedule_at:
            if minutos_antes is None:
                return "Error: se requiere 'schedule_at' o 'minutos_antes' para programar la notificación."

            # Fetch the cita to get its datetime
            try:
                resp = requests.get(f"{LOCAL_API_BASE}/data/citas/{cita_object_id}", headers=headers)
                resp.raise_for_status()
                cita = resp.json()
            except Exception as e:
                return f"Error al obtener la cita para calcular schedule_at: {e}"

            # Prefer 'fecha' field (expected to be an ISO timestamp); fallback to combination
            cita_dt_str = cita.get('fecha') or cita.get('fecha_iso') or None
            if not cita_dt_str:
                # Try to build from fecha + hora_inicio if available
                fecha = cita.get('fecha')
                hora = cita.get('hora_inicio')
                if fecha and hora:
                    cita_dt_str = f"{fecha}T{hora}:00"

            if not cita_dt_str:
                return "Error: no se encontró la fecha de la cita para calcular 'schedule_at'."

            # Parse ISO datetime; fromisoformat supports offsets like +00:00
            try:
                cita_dt = datetime.fromisoformat(cita_dt_str)
            except Exception:
                # Last resort: try to parse common formats
                try:
                    cita_dt = datetime.strptime(cita_dt_str, "%Y-%m-%dT%H:%M:%S")
                except Exception as e:
                    return f"Error al parsear la fecha de la cita: {e}"

            schedule_dt = cita_dt - timedelta(minutes=int(minutos_antes))
            # Ensure an ISO-8601 string (UTC-ish). If cita_dt had tzinfo, keep it.
            schedule_at = schedule_dt.isoformat()

        payload = {
            "cita_object_id": cita_object_id,
            "message": mensaje,
            "channel": "in_app",
            "schedule_at": schedule_at,
            "reminder_offset": minutos_antes,
        }

        response = requests.post(f"{LOCAL_API_BASE}/data/notificaciones", json=payload, headers=headers)
        response.raise_for_status()
        return f"Notificación creada exitosamente. Detalles: {json.dumps(response.json())}"
    except Exception as e:
        return f"Error al crear la notificación: {e}. Informa al usuario que verifique los detalles."

def _list_notifications_impl(user_token: str, where_clause: str = None) -> str:
    """Lists notifications for the current user, with an optional filter."""
    try:
        headers = {'user-token': user_token}
        params = {'where': where_clause} if where_clause else None
        response = requests.get(f"{LOCAL_API_BASE}/data/notificaciones", params=params, headers=headers)
        response.raise_for_status()
        notifications = response.json()
        if not notifications:
            return "No se encontraron notificaciones que coincidan con la búsqueda."
        return f"Notificaciones encontradas: {json.dumps(notifications)}"
    except Exception as e:
        return f"Error al listar las notificaciones: {e}. Informa al usuario."

def _delete_notification_impl(object_id: str, user_token: str) -> str:
    """Deletes a notification by its object_id."""
    try:
        headers = {'user-token': user_token}
        response = requests.delete(f"{LOCAL_API_BASE}/data/notificaciones/{object_id}", headers=headers)
        response.raise_for_status()
        return f"Notificación con ID {object_id} eliminada exitosamente."
    except Exception as e:
        return f"Error al eliminar la notificación: {e}. Verifica que el ID sea correcto."

######### MIddleware to run the agent #########

def tool_error_handler_middleware():
    """Middleware to handle tool errors and let agent retry"""
    
    @wrap_tool_call
    def handle_tool_errors(request, handler):
        """Intercept tool calls and handle errors gracefully"""
        try:
            # Try to execute the tool
            result = handler(request)
            return result
        except Exception as e:
            error_msg = str(e)
            print(f"[TOOL ERROR] {request.tool_call['name']}: {error_msg}")
            
            # Return error as ToolMessage so agent sees it and can retry
            return ToolMessage(
                content=f"Tool error - {error_msg}. Please try again with corrected parameters.",
                tool_call_id=request.tool_call["id"],
                is_error=True
            )
    
    return handle_tool_errors



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
Este sistema maneja dos categor'ias: la gestión de citas y la gestión de notificaciones (recordatorios) para esas citas.

INSTRUCCIONES DE OPERACIÓN:
1.  **Conversa Naturalmente**: Sé amable y conversacional.
2.  **Usa las Herramientas**: Para cualquier acción relacionada con citas (crear, listar, etc.), DEBES usar una de las herramientas disponibles. Para cualquier acción relacionada con notificaciones (crear, listar, etc.) DEBES usar una de las herramientas disponibles.
3.  **Extrae Información**: Presta atención a los detalles en la conversación del usuario (título, fecha, hora, etc.) para usarlos como argumentos en las herramientas. La fecha actual se menciona al inicio de la entrada del usuario y te sirve de referencia para términos como "mañana" o "próximo martes".
4.  **Pide Clarificación**: Si te falta información crucial para usar una herramienta (ej. el título para crear una cita), pide amablemente al usuario que la proporcione.
5.  **Confirma Acciones**: Antes de realizar acciones destructivas como eliminar o modificar una cita, busca la cita primero con `list_appointments` para obtener su `object_id` y presenta la información al usuario para que confirme.
6.  **Formato de Respuesta**: Responde usando el formato ReAct, que incluye tu pensamiento, la acción a tomar y la observación del resultado de la herramienta. La respuesta final debe estar en texto plano, sin formato JSON ni markdown.

Si al usar las herramientas encuentras errores, como que el usuario no especific'o un rango de fechas, llama de nuevo a la herramienta con un rango de fechas adecuado y corto e informa al usuario sobre el rango de dias que le est'as mostrando.

Antes de crear una nueva cita revisa si existe ya una cita en la misma fecha y hora usando la herramienta de listar citas. Si existe una cita en el mismo horario, informa al usuario y pregunta si desea proceder de todas formas eliminando la cita anterior, conservando ambas o modificando la hora de alguna de las dos citas.

Si el usuario solicita crear una cita en el pasado ind'icale que esto no es posible y pídele que elija una fecha futura.

Si el usuario te solicita crear citas recurrentes, es decir que se repitan con cualquier preiodicidad, confirma la periodicidad y el rango de fechas en el cual crear las citas si el usuario no la ha especificado y llama varias veces a la herramienta de creacion de citas para crear cada una de las citas individuales.

Si el usuario te pide que realices una acción que no está relacionada con la gestión de citas, responde educadamente que solo puedes ayudar con la gestión de citas.\

En los campos de texto como título, descripción y lugar, usa siempre la primera letra mayúscula y el resto minúscula, a menos que el usuario especifique lo contrario.

Las notificaciones están siempre conectadas a citas existentes. Para crear una notificación, primero debes conocer el 'object_id' de la cita a la que se vinculará la notificación. Puedes obtener este 'object_id' usando la herramienta 'list_appointments' antes de crear la notificación.

Es importante que crees las notificaciones con todos los par'ametros, incluyendo el mensaje y cuántos minutos antes de la cita se debe enviar la notificación:
- channel: in_app
- message: Recordatorio: + el nombre de la cita original.
- schedule_at: Calculado restando 'minutos_antes' de la fecha y hora de la cita original.
- cita_object_id: El object_id de la cita a la que se vincula la notificación.
Revisa el schema de la base de notificaciones antes de crearla.

El user_token del usuario actual siempre está disponible para ti como una variable llamada 'user_token'. Usa este token en los headers de todas las llamadas a la API para autenticarte.

Ten en cuenta que las citas te llegaran con fecha en formato timestamp UTC. Y debes programarlas con timestamp UTC también.

No es necesario que le muestres al usuario las notificaciones, solo las citas, a menos que el usuario te lo pida explícitamente.

Al crear una nueva cita crea una notificación para esa cita a no ser que el usuario te pida lo contrario.

Ejemplos:
- Listar citas de diciembre 2025: where_clause="fecha >= '2025-12-01' AND fecha <= '2025-12-31'"
- Listar citas de una fecha específica: where_clause="fecha = '2025-12-15'"
- Listar por tipo: where_clause="titulo LIKE '%gimnasio%'"

IMPORTANT SQL QUERY RULES:
- Use double quotes for string values in SQL WHERE clauses
- Examples of correct format:
  * "fecha = \"2025-11-25\""
  * "fecha >= \"2025-11-01\" AND fecha <= \"2025-11-30\""
  * "titulo LIKE \"%dentista%\""
  * "status = \"confirmed\""
- Always use this format when filtering appointments

IMPORTANT - SELF-CORRECTION RULES:
If a tool call fails:
1. Don't ask the user for help
2. Analyze the error message
3. Adjust your parameters based on the error
4. Try the tool call again with corrected parameters

Examples of common fixes:
- If error mentions quotes: Use single quotes in WHERE clause
- If error mentions format: Check date is YYYY-MM-DD and time is HH:MM
- If error mentions field: Make sure field name exists in schema

Keep trying up to 3 times different approaches until the tool succeeds. If it doesnt succeed after 3 attempts, inform the user about the issue.

"""

schema_description = """

Schema de la base se datos - tabla 'citas':

table fields and names: descripcion (STRING Max Length: 250), duracion_minutos (DOUBLE), fecha (DATETIME), hora_inicio (STRING Max Length: 250), lugar (STRING Max Length: 250), timezone (STRING Max Length: 250), titulo (STRING Max Length: 250), usuario (STRING Max Length: 250), ownerId (STRING Max Length: 36), created (DATETIME), updated (DATETIME)

Las columnas 'object_id', 'created', 'updated', 'Cupdated' son gestionadas automáticamente y no deben ser modificadas directamente.

Schema de la base se datos - tabla 'notificaciones':

table fields and names: object_id (UUID or string), owner_id (string), cita_object_id (string), channel (string), schedule_at (timestamp with tz), reminder_offset (integer, nullable), message (text), repeat (json or string, nullable), sent (boolean, default false), sent_at (timestamp, nullable), attempts (integer, default 0), metadata (json, nullable), created (timestamp), updated (timestamp)

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
            system_prompt=SYSTEM_PROMPT+schema_description,
            checkpointer=checkpointer,
            middleware=[tool_error_handler_middleware()]
        )

    def invoke(self, text: str):
        current_time = datetime.now().strftime("%A, %Y-%m-%d %H:%M:%S")
        timezone = datetime.now().astimezone().tzinfo
        input_with_datetime = f"Fecha y hora actual: {current_time}\n\n{text} en timezone:{timezone}"
        
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

def transcription_service(audio):
    """Stub for transcription service"""
    client = Groq(api_key=GROQ_API_KEY)
    transcription = client.audio.transcriptions.create(

    file=audio, # Required audio file

    model="whisper-large-v3-turbo", # Required model to use for transcription

    prompt="Este es un audio de un usuario dándole instrucciones a un agente inteligente de organización de citas y cronogramas. Por favor transcribelo a texto en el idioma español.",  # Optional

    response_format="verbose_json",  # Optional

    timestamp_granularities = ["word", "segment"], # Optional (must set response_format to "json" to use and can specify "word", "segment" (default), or both)

    language="es",  # Optional

    temperature=0.0  # Optional

    )

    # To print only the transcription text, you'd use print(transcription.text) (here we're printing the entire transcription object to access timestamps)
    
    return transcription.text


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