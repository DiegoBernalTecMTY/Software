import requests
import json

url = "http://localhost:5000/data/Comando"
headers = {"Content-Type": "application/json"}

commands = [
    "Agendar dentista manana a las 10am",
    "Qué tengo para hoy?",
    "Mueve mi reunión a las 3",
]

for cmd in commands:
    print(f"\n{'='*60}")
    print(f"Command: {cmd}")
    print(f"{'='*60}")
    
    payload = {"texto": cmd}
    
    try:
        resp = requests.post(url, json=payload, headers=headers)
        result = resp.json()
        print(f"Status: {resp.status_code}")
        print(f"Result action: {result.get('resultado', {}).get('titulo') or result.get('mensaje')}")
        if result.get('resultado'):
            print(f"Fecha: {result['resultado'].get('fecha')}")
            print(f"Hora: {result['resultado'].get('hora_inicio')}")
    except Exception as e:
        print(f"Error: {e}")
