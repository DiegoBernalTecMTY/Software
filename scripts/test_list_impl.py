import importlib.util
import sys
from pathlib import Path

module_path = Path(__file__).resolve().parent.parent / 'ai_agent.py'
spec = importlib.util.spec_from_file_location('ai_agent', str(module_path))
ai_agent = importlib.util.module_from_spec(spec)
sys.modules['ai_agent'] = ai_agent
spec.loader.exec_module(ai_agent)

# Test the list implementation with a likely-invalid token to see the new behavior
TEST_TOKEN = 'mi_usuario'  # simulate the bad value seen in logs
where = "fecha >= '2025-11-18' AND fecha <= '2025-11-25'"
print('Calling _list_appointments_impl with token:', TEST_TOKEN)
res = ai_agent._list_appointments_impl(TEST_TOKEN, where)
print('Result:', res)
