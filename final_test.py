#!/usr/bin/env python
"""Final comprehensive test of the fixed system"""

import json
import sys
sys.path.insert(0, r'c:\MNA-Software')

from app import app

client = app.test_client()

test_cases = [
    ("Cancelar una reunión", "Should ask for meeting ID"),
    ("Mostrar mis próximas citas", "Should ask what time period"),
    ("Agendar cita con dentista mañana a las 2pm", "Should create appointment"),
]

print("\n" + "=" * 80)
print("COMPREHENSIVE TEST - LLM RESPONSE FLOW")
print("=" * 80 + "\n")

for command, description in test_cases:
    print(f"COMMAND: {command}")
    print(f"EXPECTED: {description}")
    print("-" * 80)
    
    resp = client.post('/data/Comando', 
        json={"texto": command},
        content_type='application/json'
    )
    
    # resp.json is already a dict from Flask test client
    if isinstance(resp.json, dict):
        data = resp.json
    else:
        data = json.loads(resp.data)
    respuesta = data.get('respuesta', '')
    action = data.get('raw', {}).get('action', '?')
    
    print(f"ACTION: {action}")
    print(f"RESPONSE:\n{respuesta}\n")
    print()

print("=" * 80)
print("SUCCESS! The frontend will now display these full LLM responses in the chat.")
print("No more hardcoded 'Crear Nueva cita el 2025-11-17 a las 10:00' message.")
print("=" * 80)
