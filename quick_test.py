#!/usr/bin/env python
import requests
import json

url = "http://localhost:5000/data/Comando"
payload = {"texto": "Agendar dentista manana a las 10am"}

resp = requests.post(url, json=payload)
result = resp.json()

print(f"Fecha: {result.get('resultado', {}).get('fecha')}")
print(f"Esperado: 2025-11-18")
print(f"Coincide: {result.get('resultado', {}).get('fecha') == '2025-11-18'}")
