import requests
where = "fecha >= '2025-11-18' AND fecha <= '2025-11-25'"
print('WHERE:', where)
r = requests.get('http://localhost:5000/data/Cita', params={'where': where}, timeout=20)
print('STATUS', r.status_code)
try:
    data = r.json()
    print('TYPE', type(data), 'LEN', len(data) if isinstance(data, list) else 'N/A')
    if isinstance(data, list):
        print(data[:3])
    else:
        print(data)
except Exception as e:
    print('ERROR', e)
    print(r.text)
