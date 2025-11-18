import requests
r = requests.post('http://127.0.0.1:5000/data/Comando', json={'texto':'Agendar cita con el dentista mañana a las 10am'})
print(r.status_code)
print(r.text)
