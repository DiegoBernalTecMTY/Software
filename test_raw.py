import requests
import json

url = "http://localhost:5000/data/Comando"
headers = {"Content-Type": "application/json"}

payload = {"texto": "Agendar dentista manana a las 10am"}

resp = requests.post(url, json=payload, headers=headers)
result = resp.json()

print(json.dumps(result, indent=2))
