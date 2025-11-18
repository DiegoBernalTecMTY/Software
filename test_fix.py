#!/usr/bin/env python
"""Test the fixed /data/Comando endpoint"""

import requests
import json

API_URL = "http://localhost:5000/data/Comando"

# Test 1: Cancel command
print("=" * 60)
print("TEST 1: Cancel a meeting")
print("=" * 60)
resp = requests.post(API_URL, json={"texto": "Cancelar una reunión"})
print(f"Status: {resp.status_code}")
data = resp.json()
print(json.dumps(data, indent=2, ensure_ascii=False))
print(f"\nrespuesta field: {data.get('respuesta')}\n")

# Test 2: Show citas
print("=" * 60)
print("TEST 2: Show my upcoming appointments")
print("=" * 60)
resp = requests.post(API_URL, json={"texto": "Mostrar mis próximas citas"})
print(f"Status: {resp.status_code}")
data = resp.json()
print(json.dumps(data, indent=2, ensure_ascii=False))
print(f"\nrespuesta field: {data.get('respuesta')}\n")

# Test 3: Create appointment  
print("=" * 60)
print("TEST 3: Create appointment")
print("=" * 60)
resp = requests.post(API_URL, json={"texto": "Agendar cita con dentista mañana a las 2pm"})
print(f"Status: {resp.status_code}")
data = resp.json()
print(json.dumps(data, indent=2, ensure_ascii=False))
print(f"\nrespuesta field: {data.get('respuesta')}")
print(f"resultado field: {data.get('resultado')}\n")

print("=" * 60)
print("If respuesta shows the actual LLM text and NOT hardcoded 'Crear Nueva cita'")
print("then the fix is WORKING!")
print("=" * 60)
