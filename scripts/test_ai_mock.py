"""Simple test script to validate `ai.process_command` parsing behavior
without calling the real external API. This script monkeypatches the
internal `_call_generative_api` function to return predictable outputs.

Run:
  python .\scripts\test_ai_mock.py
"""
import json
import sys
import pathlib
# Ensure repository root is on sys.path so we can import project modules
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import ai


def test_process_command_with_json_output():
    # Mock raw model output that contains a JSON object
    mock_json = json.dumps({
        "action": "create",
        "mensaje": "Crear cita con dentista el martes a las 16:00",
        "resultado": {
            "titulo": "Dentista",
            "fecha": "2025-11-18",
            "hora_inicio": "16:00",
            "lugar": "Clínica Sonrisa",
            "descripcion": "Revisión anual"
        }
    }, ensure_ascii=False)

    # Monkeypatch the internal call
    ai._call_generative_api = lambda prompt, max_tokens=512, temperature=0.0: mock_json

    out = ai.process_command('Agendar cita con el dentista el martes a las 4pm')
    print('Processed output:')
    print(json.dumps(out, indent=2, ensure_ascii=False))


def test_process_command_fails_to_parse():
    ai._call_generative_api = lambda prompt, max_tokens=512, temperature=0.0: "I could not parse that"
    out = ai.process_command('')
    print('Empty command output:')
    print(json.dumps(out, indent=2, ensure_ascii=False))


def test_update_parsing():
    mock_json = json.dumps({
        "action": "update",
        "mensaje": "Actualizar fecha de la cita del dentista",
        "target_id": "abc123",
        "updates": {"fecha": "2025-11-20", "hora_inicio": "16:00"}
    }, ensure_ascii=False)
    ai._call_generative_api = lambda prompt, max_tokens=512, temperature=0.0: mock_json
    out = ai.process_command('Cambiar la cita del dentista al 20 de noviembre a las 16:00')
    print('\nUpdate parsing output:')
    print(json.dumps(out, indent=2, ensure_ascii=False))


def test_app_update_flow_with_candidate_search():
    # This test exercises the Flask endpoint behavior when AI returns an update
    # without a target_id but with a query. We monkeypatch requests.get used by
    # the app._search_citas_by_query helper to return fake records.
    import app as server_app

    # Mock AI to return an update with a query but no target_id
    mock_ai = json.dumps({
        "action": "update",
        "mensaje": "Actualizar cita del dentista",
        "query": "dentista jueves 4pm",
        "updates": {"hora_inicio": "16:00"}
    }, ensure_ascii=False)
    ai._call_generative_api = lambda prompt, max_tokens=512, temperature=0.0: mock_ai

    # Monkeypatch requests.get used inside the server search helper
    class MockResp:
        def __init__(self, data):
            self._data = data
        def raise_for_status(self):
            return None
        def json(self):
            return self._data

    def fake_requests_get(url, headers=None, params=None, timeout=None):
        # Return two fake cita records
        return MockResp([
            {"objectId": "abc123", "titulo": "Dentista", "fecha": "2025-11-13", "hora_inicio": "16:00"},
            {"objectId": "def456", "titulo": "Dentista revisión", "fecha": "2025-11-20", "hora_inicio": "10:00"}
        ])

    import requests as real_requests
    orig_get = real_requests.get
    real_requests.get = fake_requests_get

    try:
        client = server_app.app.test_client()
        resp = client.post('/data/Comando', json={'texto': 'Actualizar mi cita del dentista', 'confirm': True})
        print('\nServer response for update-without-target (should include candidates):')
        print(resp.status_code)
        print(resp.get_data(as_text=True))
    finally:
        real_requests.get = orig_get


if __name__ == '__main__':
    print('Running test_process_command_with_json_output')
    test_process_command_with_json_output()
    print('\nRunning test_process_command_fails_to_parse')
    test_process_command_fails_to_parse()
    print('\nRunning test_update_parsing')
    test_update_parsing()
    print('\nRunning test_app_update_flow_with_candidate_search')
    test_app_update_flow_with_candidate_search()
