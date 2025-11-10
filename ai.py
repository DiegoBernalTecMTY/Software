"""AI helpers for natural language command processing.

This module provides a small wrapper around the Google Generative API (Gemini/text-bison)
to interpret a user's natural language command into a structured JSON object the app
can act upon. It attempts to be LangChain/LangGraph-friendly in the future by exposing
an abstraction, but currently uses a direct REST call as a reliable fallback.

Output contract (returned dict):
{
  "action": "create"|"update"|"delete"|"list"|"none",
  "mensaje": "Human readable interpretation in Spanish",
  "resultado": { ... } // for create/update: a `Cita`-like object with titulo, fecha (YYYY-MM-DD), hora_inicio (HH:MM), lugar, descripcion
  "target_id": "..." // optional when update/delete refers to an id
  "query": "..." // optional when action is list, contains where clause or human query
}

The module reads the GEMINI_API_KEY environment variable. For quick testing a sample
API key is left in the repository README (only for dev/testing). In production, set
GEMINI_API_KEY in the environment and do NOT check it into source control.
"""
from __future__ import annotations

import os
import json
import re
from typing import Any, Dict, Optional
from pydantic import BaseModel
from models import CommandOutput
from datetime import datetime, date, timedelta

# Spanish weekday names mapping to Python weekday ints (Monday=0)
SPANISH_WEEKDAYS = {
    'lunes': 0,
    'martes': 1,
    'miercoles': 2,
    'miércoles': 2,
    'jueves': 3,
    'viernes': 4,
    'sabado': 5,
    'sábado': 5,
    'domingo': 6,
}
import requests
import traceback

import importlib

# Detect presence of LangChain package. We won't hard-fail if import paths differ
# between LangChain major versions; presence is enough for now and we'll continue
# to use our genai client / REST fallback. If you want a full LangChain runnable
# integration we can add it after you confirm which LangChain API surface to use.
LANGCHAIN_AVAILABLE = importlib.util.find_spec('langchain') is not None
# Detect langchain_core runnable support (modern LangChain runnables API)
try:
    from langchain_core.runnables.base import Runnable
    LANGCHAIN_CORE_AVAILABLE = True
except Exception:
    LANGCHAIN_CORE_AVAILABLE = False

# Config: model to call. You can experiment with Gemini/chat or text models.
# For simple structured-output tasks text-bison-001 is stable; change if you have
# specific Gemini model names.
GEN_MODEL = os.environ.get('GEN_MODEL', 'text-bison-001')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')

# Prefer the new Google GenAI SDK when available (per docs in docs/gemini_api_migration.md)
try:
    from google import genai
    from google.genai import types as genai_types
    GENAI_AVAILABLE = True
    # Create a client; it will pick up GEMINI_API_KEY env var if present.
    # Prefer explicit api_key initialization if a GEMINI_API_KEY is provided.
    try:
        if GEMINI_API_KEY:
            _GENAI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)
        else:
            _GENAI_CLIENT = genai.Client()
    except Exception:
        print('[WARN] genai.Client(...) failed during initialization:')
        traceback.print_exc()
        _GENAI_CLIENT = None
except Exception:
    GENAI_AVAILABLE = False
    _GENAI_CLIENT = None


def _call_generative_api(prompt: str, max_tokens: int = 512, temperature: float = 0.0) -> str:
    """Call Google Generative REST endpoint and return the text output.

    This implementation uses the v1beta2 REST endpoint.
    """
    # If the official GenAI SDK is available, use it (preferred per migration doc).
    if GENAI_AVAILABLE and _GENAI_CLIENT is not None:
        try:
            # Build a simple config; request plain text/json output by default.
            # NOTE: do NOT pass a Pydantic class as response_schema here because
            # the SDK can reject certain generated schema fields (e.g. additional_properties)
            # leading to InvalidArgument errors. We'll parse the returned text ourselves.
            cfg = genai_types.GenerateContentConfig(
                max_output_tokens=max_tokens,
                temperature=float(temperature),
                response_mime_type='application/json',
            )
            resp = _GENAI_CLIENT.models.generate_content(
                model=GEN_MODEL,
                contents=prompt,
                config=cfg,
            )
            # Try common properties for textual output
            text = getattr(resp, 'text', None)
            if not text:
                # newer SDKs may provide candidates/content structure
                try:
                    # attempt to access a JSON-dumped representation
                    return json.dumps(resp, default=lambda o: getattr(o, '__dict__', str(o)), ensure_ascii=False)
                except Exception:
                    text = str(resp)
            else:
                return text
        except Exception:
            # Log full traceback to help debugging and fall through to REST fallback
            print("[WARN] genai client call failed, falling back to REST:")
            traceback.print_exc()

    # Fallback: direct REST call to generativelanguage.googleapis.com (legacy / reliable)
    if not GEMINI_API_KEY:
        raise RuntimeError('GEMINI_API_KEY environment variable is not set')

    # The REST endpoint expects the model path to be prefixed with 'models/'
    model_path = GEN_MODEL if GEN_MODEL.startswith('models/') else f"models/{GEN_MODEL}"
    url = f"https://generativelanguage.googleapis.com/v1beta2/{model_path}:generate?key={GEMINI_API_KEY}"
    payload = {
        "prompt": {"text": prompt},
        "temperature": temperature,
        "maxOutputTokens": max_tokens,
    }
    headers = {"Content-Type": "application/json"}
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    # Expected keys: 'candidates' -> list -> first -> 'output'
    # There is some variability between model families; try a few fallbacks.
    text = None
    if isinstance(data.get('candidates'), list) and data['candidates']:
        # Newer APIs return candidates[].content.parts[].text or candidates[].content or candidates[].output
        candidate = data['candidates'][0]
        text = candidate.get('output') or candidate.get('content')
        if not text and isinstance(candidate.get('content'), dict):
            # try nested parts
            try:
                parts = candidate['content'].get('parts') or []
                text = ''.join(p.get('text', '') for p in parts if isinstance(p, dict))
            except Exception:
                text = None
    if not text:
        # older responses might have 'output' at top level
        text = data.get('output') or data.get('content')
    if not text:
        # as last resort, stringify entire response
        text = json.dumps(data)
    return text


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Try to extract the first JSON object from text.

    Returns a dict or None if extraction/parsing fails.
    """
    # Find the first {...} block by scanning for balanced braces (Python's re
    # does not support recursive patterns reliably across versions).
    if not text or '{' not in text:
        try:
            return json.loads(text.strip())
        except Exception:
            return None

    start = text.find('{')
    stack = 0
    end = None
    for i in range(start, len(text)):
        ch = text[i]
        if ch == '{':
            stack += 1
        elif ch == '}':
            stack -= 1
            if stack == 0:
                end = i
                break
    if end is None:
        # no balanced JSON object found
        try:
            return json.loads(text.strip())
        except Exception:
            return None
    candidate = text[start:end+1]
    try:
        return json.loads(candidate)
    except Exception:
        # Try to repair common issues (trailing commas)
        repaired = re.sub(r",\s*([}\]])", r"\1", candidate)
        try:
            return json.loads(repaired)
        except Exception:
            return None


def build_prompt(spanish_command: str) -> str:
    """Construct a prompt that asks the model to return strictly parseable JSON.

    The prompt enforces Spanish language output and a fixed JSON contract.
    """
    system = (
        "Eres un asistente que convierte comandos en lenguaje natural a un JSON estructurado\n"
        "Solo responde con JSON válido (UN SOLO OBJETO JSON). No añadas explicaciones ni texto adicional.\n"
        "Campos esperados:\n"
        "- action: 'create'|'update'|'delete'|'list'|'none'\n"
        "- action: 'create'|'update'|'delete'|'list'|'clarify'|'none'\n"
        "- mensaje: una interpretación en español (corta)\n"
        "- resultado: para 'create' o 'update', un objeto con campos de cita: titulo, fecha (YYYY-MM-DD), hora_inicio (HH:MM) opcional, lugar opcional, descripcion opcional\n"
        "- updates: para 'update', un objeto con sólo los campos a cambiar (p.ej. {\"fecha\":\"2025-11-20\"})\n"
        "- target_id: opcional, cuando update/delete refiere a un id concreto\n"
        "- query: opcional, texto libre para 'list' consultas\n"
        "- candidates: opcional, una lista de coincidencias cuando no hay target_id\n"
        "- clarify_questions: opcional, lista de preguntas para pedir aclaración al usuario\n"
        "Ejemplo de salida válida:\n"
        "{\n"
        "  \"action\": \"create\",\n"
        "  \"mensaje\": \"Crear cita con dentista el martes a las 16:00\",\n"
        "  \"resultado\": {\n"
        "    \"titulo\": \"Dentista\",\n"
        "    \"fecha\": \"2025-11-18\",\n"
        "    \"hora_inicio\": \"16:00\",\n"
        "    \"lugar\": \"Clínica Dental\",\n"
        "    \"descripcion\": \"Revisión anual\"\n"
        "  }\n"
        "}\n"
    )
    # Provide current date context so the model interprets relative dates
    today_iso = datetime.utcnow().date().isoformat()
    prompt = (
        f"{system}\n" 
        f"Fecha actual (UTC): {today_iso}\n"
        f"Regla importante: si el usuario indica un día de la semana (por ejemplo 'jueves'), devuelve la próxima fecha futura correspondiente a ese día de la semana, no una fecha pasada.\n"
        f"Siempre devuelve la fecha en formato YYYY-MM-DD y la hora en HH:MM cuando sea posible.\n"
        f"Si la acción es 'update', devuelve preferentemente un campo 'updates' con sólo los campos a cambiar. Si el objetivo no es claro, devuelve 'action':'clarify' con 'query' y 'candidates' (lista de coincidencias) o 'clarify_questions' para pedir información adicional.\n"
        f"Analiza el siguiente comando en español y responde con el JSON: \n{spanish_command}\n"
    )
    return prompt


def process_command(texto: str) -> Dict[str, Any]:
    """Main entry point: convert user text to structured JSON according to contract.

    Throws RuntimeError on missing API key or requests problems.
    """
    if not texto or not texto.strip():
        return {"action": "none", "mensaje": "Comando vacío", "resultado": None}

    prompt = build_prompt(texto)

    # If modern LangChain runnables are available, use them to run the prompt
    # through a small Runnable adapter that delegates to our GenAI client / REST
    # helper. This gives you a proper LangChain integration point (graphing,
    # composition) while using the official GenAI SDK under the hood.
    if LANGCHAIN_CORE_AVAILABLE:
        try:
            # Define a small Runnable wrapper around our REST/GenAI call
            class GenAIRunnable(Runnable):
                def __init__(self, model: str = GEN_MODEL, temperature: float = 0.0, max_tokens: int = 512):
                    self.model = model
                    self.temperature = temperature
                    self.max_tokens = max_tokens

                def invoke(self, input: str, **kwargs) -> str:
                    # Delegate to our existing helper which prefers the new SDK
                    return _call_generative_api(input, max_tokens=self.max_tokens, temperature=self.temperature)

            runnable = GenAIRunnable(model=GEN_MODEL, temperature=0.0, max_tokens=512)
            raw = runnable.invoke(prompt)
        except Exception as e:
            # If runnable fails for any reason, fall back to direct call
            try:
                raw = _call_generative_api(prompt, max_tokens=512, temperature=0.0)
            except Exception as e2:
                raise RuntimeError(f"AI request failed (runnable fallback): {e2} (runnable error: {e})")
    else:
        try:
            raw = _call_generative_api(prompt, max_tokens=512, temperature=0.0)
        except Exception as e:
            raise RuntimeError(f"AI request failed: {e}")

    # Try to parse JSON from the model output
    parsed = _extract_json(raw)
    if not parsed:
        # As fallback, return a safe echo so frontend can show the model text
        return {"action": "none", "mensaje": f"No se pudo interpretar el comando. Respuesta del modelo: {raw}", "resultado": None}

    # Normalize keys to expected names (lowercase 'action', 'mensaje', 'resultado')
    result = {
        'action': parsed.get('action', 'none'),
        'mensaje': parsed.get('mensaje') or parsed.get('message') or 'Interpretación disponible',
        'resultado': parsed.get('resultado') or parsed.get('result') or None,
        'updates': parsed.get('updates') or parsed.get('changes') or None,
        'target_id': parsed.get('target_id') or parsed.get('id') or None,
        'query': parsed.get('query') or None,
        'candidates': parsed.get('candidates') or None,
        'clarify_questions': parsed.get('clarify_questions') or parsed.get('questions') or None,
    }

    # Post-process fecha: if model returned a past date but the user's command
    # referenced a weekday, shift to the next matching weekday in the future.
    try:
        texto = texto or ''
        if result.get('resultado') and isinstance(result['resultado'], dict):
            fecha = result['resultado'].get('fecha')
            if fecha:
                # Try parsing fecha
                try:
                    parsed_date = datetime.fromisoformat(fecha).date()
                except Exception:
                    # If not ISO, attempt YYYY-MM-DD fallback
                    try:
                        parsed_date = date.fromisoformat(fecha)
                    except Exception:
                        parsed_date = None

                if parsed_date:
                    today = datetime.utcnow().date()
                    # If date is in the past and command mentions a weekday, shift forward
                    if parsed_date < today:
                        lower = texto.lower()
                        for wd_name, wd_idx in SPANISH_WEEKDAYS.items():
                            if wd_name in lower:
                                # compute next date for wd_idx
                                days_ahead = (wd_idx - today.weekday() + 7) % 7
                                if days_ahead == 0:
                                    days_ahead = 7
                                next_date = today + timedelta(days=days_ahead)
                                result['resultado']['fecha'] = next_date.isoformat()
                                break
    except Exception:
        # don't fail the whole request if post-processing has an issue
        pass
    return result


if __name__ == '__main__':
    # Quick local test helper
    sample = 'Agendar cita con el dentista el martes que viene a las 4pm en la Clínica Sonrisa. Recordatorio 30 minutos antes.'
    try:
        out = process_command(sample)
        print(json.dumps(out, indent=2, ensure_ascii=False))
    except Exception as e:
        print('Error:', e)
