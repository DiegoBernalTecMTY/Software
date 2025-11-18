#!/usr/bin/env python
"""Run app and test simultaneously"""

import subprocess
import time
import requests
import json
import sys
import threading

# Start the Flask app in a thread
def run_flask():
    subprocess.run([sys.executable, "app.py"], cwd=r"c:\MNA-Software")

flask_thread = threading.Thread(target=run_flask, daemon=True)
flask_thread.start()

# Wait for it to start
print("Waiting for Flask to start...")
time.sleep(4)

# Now test
print("Testing...")
try:
    resp = requests.post("http://localhost:5000/data/Comando", json={"texto": "Mostrar mis próximas citas"}, timeout=5)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
