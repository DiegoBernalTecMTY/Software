import requests
import json

url = "http://localhost:5000/data/Comando"
payload = {"texto": "Agendar dentista manana a las 10am"}

try:
    resp = requests.post(url, json=payload)
    print("Status:", resp.status_code)
    result = resp.json()
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
