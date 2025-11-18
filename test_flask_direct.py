#!/usr/bin/env python
"""Direct test of the Flask app routes"""

import json
import sys
sys.path.insert(0, r'c:\MNA-Software')

from app import app

# Create test client
client = app.test_client()

# Test 1: Cancel command
print("TEST 1: Cancel a meeting")
print("=" * 60)
resp = client.post('/data/Comando', 
    json={"texto": "Cancelar una reunión"},
    content_type='application/json'
)
print(f"Status: {resp.status_code}")
data = json.loads(resp.data)
print(json.dumps(data, indent=2, ensure_ascii=False))
print(f"\nrespuesta: {data.get('respuesta')}\n")

# Test 2: Show citas
print("TEST 2: Show my upcoming appointments")
print("=" * 60)
resp = client.post('/data/Comando',
    json={"texto": "Mostrar mis próximas citas"},
    content_type='application/json'
)
print(f"Status: {resp.status_code}")
data = json.loads(resp.data)
print(json.dumps(data, indent=2, ensure_ascii=False))
print(f"\nrespuesta: {data.get('respuesta')}\n")

print("=" * 60)
print("If respuesta shows the REAL LLM responses, the fix is WORKING!")
print("=" * 60)
