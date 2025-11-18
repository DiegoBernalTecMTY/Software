import json
import importlib

import pytest

ai = importlib.import_module('ai_agent')


def test_run_text_agent_parses_fenced(monkeypatch):
    # simulate AGENT path and a model returning fenced JSON
    monkeypatch.setattr(ai, 'AGENT', True)
    monkeypatch.setattr(ai, '_invoke_agent_agent_style', lambda text: '```json\n{"action":"test","mensaje":"OK","resultado":null}\n```')
    res = ai.run_text_agent('dummy command', {})
    assert isinstance(res, dict)
    assert res.get('action') == 'test'
    assert res.get('mensaje') == 'OK'


def test_create_plan_events_parses_list_fenced(monkeypatch):
    monkeypatch.setattr(ai, 'AGENT', True)
    monkeypatch.setattr(ai, '_invoke_agent_agent_style', lambda text: '```json\n[{"titulo":"A","fecha":"2025-11-20","hora_inicio":"09:00","duracion_minutos":60}]\n```')
    res = ai.create_plan_events('Plan A', window={'start':'2025-11-20'}, preferences={})
    assert isinstance(res, list)
    assert len(res) == 1
    assert res[0].get('titulo') == 'A'


def test_strip_helper():
    s = "Here is the answer:\n```json\n{\"x\":1}\n```\nSome trailing text"
    cleaned = ai._strip_code_fences_and_extraneous(s)
    assert cleaned.strip().startswith('{')
    assert 'Some trailing' not in cleaned
