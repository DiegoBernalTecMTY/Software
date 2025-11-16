"""AI agent abstraction for the app.

Provides three entry points:
- run_text_agent(text, user_context)
- run_voice_agent(transcript, user_context)
- create_plan_events(goal, window, preferences)

This module prefers a LangChain + Groq integration via `langchain_groq.ChatGroq`.
If available it creates an agent with tools that call the application's own
HTTP API to create, query and delete `cita` records. When unavailable it
falls back to LangChain `ChatOpenAI` or a direct OpenAI-compatible client.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

# Load .env if present
load_dotenv()

import requests

# LangChain/Groq imports (optional)
try:
    from langchain_groq import ChatGroq
    CHATGROQ_AVAILABLE = True
except Exception:
    CHATGROQ_AVAILABLE = False

try:
    from langchain.agents import create_agent
    AGENT_FACTORY_AVAILABLE = True
except Exception:
    AGENT_FACTORY_AVAILABLE = False

try:
    from langchain.chat_models import ChatOpenAI
    from langchain.prompts import PromptTemplate
    from langchain.chains import LLMChain
    LANGCHAIN_AVAILABLE = True
except Exception:
    LANGCHAIN_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_CLIENT_AVAILABLE = True
except Exception:
    OPENAI_CLIENT_AVAILABLE = False

try:
    from langchain.tools import tool as _lc_tool_decorator
    HAVE_LC_TOOL = True
except Exception:
    _lc_tool_decorator = None
    HAVE_LC_TOOL = False

# Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
LANGCHAIN_API_KEY = os.environ.get("LANGCHAIN_API_KEY") or os.environ.get("LANGSMITH_API_KEY")
GROQ_BASE_URL = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
DEFAULT_MODEL = os.environ.get("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile")

# Base URL for our local Flask API; tools call these endpoints
LOCAL_API_BASE = os.environ.get("LOCAL_API_BASE", "http://localhost:5000")


def _load_api_keys_from_file(path: Optional[str] = None) -> Dict[str, str]:
    keys: Dict[str, str] = {}
    if not path:
        path = Path(__file__).resolve().parent.joinpath("API keys.txt")
    p = Path(path)
    if not p.exists():
        return keys
    try:
        text = p.read_text(encoding="utf-8")
    except Exception:
        return keys
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
        elif ":" in line:
            k, v = line.split(":", 1)
        else:
            parts = line.split()
            if len(parts) >= 2:
                k, v = parts[0], " ".join(parts[1:])
            else:
                continue
        keys[k.strip()] = v.strip()
    return keys


def ensure_api_keys_loaded() -> None:
    global GROQ_API_KEY, LANGCHAIN_API_KEY
    if GROQ_API_KEY and LANGCHAIN_API_KEY:
        return
    file_keys = _load_api_keys_from_file()
    if not GROQ_API_KEY:
        GROQ_API_KEY = file_keys.get("GROQ_API_KEY") or file_keys.get("GROQ")
        if GROQ_API_KEY:
            os.environ.setdefault("GROQ_API_KEY", GROQ_API_KEY)
            os.environ.setdefault("OPENAI_API_KEY", GROQ_API_KEY)
    if not LANGCHAIN_API_KEY:
        LANGCHAIN_API_KEY = file_keys.get("LANGCHAIN_API_KEY") or file_keys.get("LANGSMITH_API_KEY")
        if LANGCHAIN_API_KEY:
            os.environ.setdefault("LANGCHAIN_API_KEY", LANGCHAIN_API_KEY)


def _ensure_openai_env() -> None:
    if GROQ_API_KEY:
        os.environ.setdefault("OPENAI_API_KEY", GROQ_API_KEY)
    if GROQ_BASE_URL:
        os.environ.setdefault("OPENAI_API_BASE", GROQ_BASE_URL)


def _call_text_model_openai(prompt: str, model: Optional[str] = None) -> str:
    if not OPENAI_CLIENT_AVAILABLE:
        raise RuntimeError("OpenAI client not available")
    client = OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)
    model_name = model or DEFAULT_MODEL
    resp = client.responses.create(model=model_name, input=prompt)
    try:
        return resp.output_text
    except Exception:
        return json.dumps(resp, default=lambda o: getattr(o, '__dict__', str(o)), ensure_ascii=False)


# System prompt for calendar agent
SYSTEM_PROMPT = os.environ.get(
    "GROQ_SYSTEM_PROMPT",
    (
        "Eres un asistente especializado en calendario y planificación. "
        "Soportas: crear, reagendar, cancelar, consultar disponibilidad, crear eventos recurrentes, y generar planes bloqueantes. "
        "Cuando se requiera una salida estructurada para acciones (por ejemplo: crear evento, modificar, buscar), responde con JSON puro. "
        "Para planes devuelve una lista JSON de eventos con campos: titulo, fecha (YYYY-MM-DD), hora_inicio (HH:MM, 24h), duracion_minutos, descripcion, recurrence (opcional, en RRULE), reminders (opcional, lista de minutos antes), timezone. "
        "Siempre solicita confirmación explícita antes de ejecutar cambios que modifiquen calendarios, a menos que el campo `execute:true` esté presente en la solicitud. "
        "Devuelve las fechas siempre en ISO (YYYY-MM-DD) y horas en HH:MM. Usa la zona horaria del usuario si está disponible."
    ),
)


# Build agent and attach tools that call our API
AGENT: Optional[Any] = None
if CHATGROQ_AVAILABLE and AGENT_FACTORY_AVAILABLE:
    try:
        ensure_api_keys_loaded()
        _ensure_openai_env()
        model = ChatGroq(model=os.environ.get("GROQ_TEXT_MODEL", DEFAULT_MODEL))

        # Tool helpers
        def _format_json_input(inp: str) -> Optional[Dict[str, Any]]:
            try:
                return json.loads(inp)
            except Exception:
                return None

        def create_cita_tool(input_text: str) -> str:
            # Accept either a raw JSON body string, or a wrapper {"body":..., "user_token":...}
            parsed = _format_json_input(input_text)
            token = None
            if isinstance(parsed, dict):
                if 'body' in parsed:
                    payload = parsed.get('body')
                    token = parsed.get('user_token') or parsed.get('user-token')
                else:
                    payload = parsed
            else:
                return "ERROR: create_cita expects a JSON body as input"

            try:
                url = LOCAL_API_BASE.rstrip('/') + '/data/Cita'
                headers = {'Content-Type': 'application/json'}
                if token:
                    headers['user-token'] = token
                r = requests.post(url, json=payload, headers=headers, timeout=10)
                r.raise_for_status()
                return json.dumps(r.json(), ensure_ascii=False)
            except Exception as e:
                return f"ERROR creating cita: {str(e)}"

        def get_cita_tool(input_text: str) -> str:
            # Allow either raw id string or JSON wrapper {"id": "...", "user_token": "..."}
            parsed = _format_json_input(input_text)
            token = None
            if isinstance(parsed, dict):
                cid = str(parsed.get('id') or parsed.get('cid') or parsed.get('target_id') or '').strip()
                token = parsed.get('user_token') or parsed.get('user-token')
            else:
                cid = input_text.strip()

            if not cid:
                return "ERROR: get_cita expects an id as input"
            try:
                url = LOCAL_API_BASE.rstrip('/') + f'/data/Cita/{cid}'
                headers = {}
                if token:
                    headers['user-token'] = token
                r = requests.get(url, headers=headers or None, timeout=10)
                r.raise_for_status()
                return json.dumps(r.json(), ensure_ascii=False)
            except Exception as e:
                return f"ERROR getting cita: {str(e)}"

        def delete_cita_tool(input_text: str) -> str:
            parsed = _format_json_input(input_text)
            token = None
            if isinstance(parsed, dict):
                cid = str(parsed.get('id') or parsed.get('cid') or parsed.get('target_id') or '').strip()
                token = parsed.get('user_token') or parsed.get('user-token')
            else:
                cid = input_text.strip()

            if not cid:
                return "ERROR: delete_cita expects an id as input"
            try:
                url = LOCAL_API_BASE.rstrip('/') + f'/data/Cita/{cid}'
                headers = {}
                if token:
                    headers['user-token'] = token
                r = requests.delete(url, headers=headers or None, timeout=10)
                r.raise_for_status()
                return json.dumps({"status": "deleted", "id": cid}, ensure_ascii=False)
            except Exception as e:
                return f"ERROR deleting cita: {str(e)}"

        def find_citas_tool(input_text: str) -> str:
            # Accept either raw query string or JSON {"query": "...", "user_token": "..."}
            parsed = _format_json_input(input_text)
            token = None
            if isinstance(parsed, dict):
                q = str(parsed.get('query') or parsed.get('q') or '')
                token = parsed.get('user_token') or parsed.get('user-token')
            else:
                q = input_text or ""

            try:
                url = LOCAL_API_BASE.rstrip('/') + '/data/Cita'
                headers = {}
                if token:
                    headers['user-token'] = token
                r = requests.get(url, headers=headers or None, timeout=10)
                r.raise_for_status()
                items = r.json() or []
                qlow = q.lower()
                candidates = [it for it in items if qlow in (str(it.get('titulo','')).lower() + ' ' + str(it.get('descripcion','')).lower())]
                return json.dumps(candidates[:10], ensure_ascii=False)
            except Exception as e:
                return f"ERROR finding citas: {str(e)}"

        # Wrap tools for LangChain
        tools: List[Any] = []
        if HAVE_LC_TOOL and _lc_tool_decorator is not None:
            create_cita_wrapped = _lc_tool_decorator(name="create_cita", description="Create a new cita by providing a JSON body.")(create_cita_tool)
            get_cita_wrapped = _lc_tool_decorator(name="get_cita", description="Get cita details by id.")(get_cita_tool)
            delete_cita_wrapped = _lc_tool_decorator(name="delete_cita", description="Delete a cita by id.")(delete_cita_tool)
            find_citas_wrapped = _lc_tool_decorator(name="find_citas", description="Find citas matching a query.")(find_citas_tool)
            tools = [create_cita_wrapped, get_cita_wrapped, delete_cita_wrapped, find_citas_wrapped]
        else:
            # create_agent can often accept tuples (name, callable, description)
            tools = [
                ("create_cita", create_cita_tool, "Create a new cita by providing a JSON body."),
                ("get_cita", get_cita_tool, "Get cita details by id."),
                ("delete_cita", delete_cita_tool, "Delete a cita by id."),
                ("find_citas", find_citas_tool, "Find citas matching a query."),
            ]

        AGENT = create_agent(model=model, tools=tools, system_prompt=SYSTEM_PROMPT)
    except Exception:
        AGENT = None


def _invoke_agent_agent_style(user_text: str) -> str:
    if not AGENT:
        raise RuntimeError("LangChain ChatGroq agent not available")
    resp = AGENT.invoke({"messages": [{"role": "user", "content": user_text}]})
    if isinstance(resp, dict):
        for key in ("output", "content", "text", "result"):
            if key in resp:
                return resp[key]
        return json.dumps(resp, ensure_ascii=False)
    return str(resp)


def run_text_agent(text: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not text:
        return {"action": "none", "mensaje": "Comando vacío", "resultado": None}
    user_ctx = user_context or {}
    prompt_template = (
        "Convierte el comando del usuario en un único objeto JSON con campos: action, mensaje, resultado, updates, target_id, query, candidates, clarify_questions. "
        "Devuelve fechas en YYYY-MM-DD y horas en HH:MM 24h.\n\nContexto: {context}\nComando: {command}"
    )
    raw = ""
    # 1) Agent
    if AGENT:
        try:
            raw = _invoke_agent_agent_style(text)
        except Exception:
            raw = ""
    # 2) LangChain ChatOpenAI
    if not raw and LANGCHAIN_AVAILABLE:
        try:
            ensure_api_keys_loaded()
            _ensure_openai_env()
            prompt = PromptTemplate(input_variables=["context", "command"], template=prompt_template)
            llm = ChatOpenAI(model=DEFAULT_MODEL, temperature=0.0)
            chain = LLMChain(llm=llm, prompt=prompt)
            raw = chain.run({"context": json.dumps(user_ctx, ensure_ascii=False), "command": text})
        except Exception:
            raw = ""
    # 3) OpenAI client fallback
    if not raw and OPENAI_CLIENT_AVAILABLE:
        try:
            ensure_api_keys_loaded()
            _ensure_openai_env()
            raw = _call_text_model_openai(prompt_template.format(context=json.dumps(user_ctx), command=text))
        except Exception as e:
            raw = str(e)
    start = raw.find("{")
    if start != -1:
        try:
            obj = json.loads(raw[start:])
            return obj
        except Exception:
            pass
    return {"action": "none", "mensaje": f"No se pudo interpretar el comando. Respuesta del modelo: {raw}", "resultado": None}


def run_voice_agent(transcript: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return run_text_agent(transcript, user_context=user_context)


def create_plan_events(goal: str, window: Optional[Dict[str, Any]] = None, preferences: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    prompt = (
        "Eres un planificador que genera un plan bloqueante: devuelve un array JSON de eventos con campos: titulo, fecha (YYYY-MM-DD), hora_inicio (HH:MM), duracion_minutos, descripcion, recurrence (opcional RRULE), reminders (opcional, minutos), timezone. "
        f"Objetivo: {goal}\nVentana: {json.dumps(window or {})}\nPreferencias: {json.dumps(preferences or {})}"
    )
    raw = ""
    if AGENT:
        try:
            raw = _invoke_agent_agent_style(prompt)
        except Exception:
            raw = ""
    if not raw and LANGCHAIN_AVAILABLE:
        try:
            ensure_api_keys_loaded()
            _ensure_openai_env()
            prompt_obj = PromptTemplate(input_variables=["body"], template="{body}")
            llm = ChatOpenAI(model=DEFAULT_MODEL, temperature=0.0)
            chain = LLMChain(llm=llm, prompt=prompt_obj)
            raw = chain.run({"body": prompt})
        except Exception:
            raw = ""
    if not raw and OPENAI_CLIENT_AVAILABLE:
        raw = _call_text_model_openai(prompt)
    start = raw.find("[")
    if start != -1:
        try:
            arr = json.loads(raw[start:])
            if isinstance(arr, list):
                return arr
        except Exception:
            pass
    return [{
        "titulo": f"Tarea inicial: {goal}",
        "fecha": window.get("start") if window and window.get("start") else "2025-11-17",
        "hora_inicio": "09:00",
        "duracion_minutos": 120,
        "descripcion": "Bloque inicial para comenzar el plan"
    }]


if __name__ == "__main__":
    ensure_api_keys_loaded()
    print(run_text_agent("Agendar una cita con el dentista mañana a las 10am", {}))

