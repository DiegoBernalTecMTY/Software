import os, json, time, sys
# Ensure repo root is on sys.path so imports of ai_agent work when running from scripts/
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
import ai_agent

print('TIMESTAMP:', time.strftime('%Y-%m-%d %H:%M:%S'))
print('AGENT_PRESENT:', bool(getattr(ai_agent, 'AGENT', None)))
print('AGENT_CREATION_ERROR:', getattr(ai_agent, 'AGENT_CREATION_ERROR', None))
print('LANGSMITH_API_KEY present:', bool(os.environ.get('LANGSMITH_API_KEY')))
print('LANGSMITH_PROJECT:', os.environ.get('LANGSMITH_PROJECT'))
print('LANGSMITH_TRACING:', os.environ.get('LANGSMITH_TRACING'))

tests = [
    'Agenda una cita con el dentista mañana a las 10:00',
    'Cancela mi cita con el podólogo el viernes'
]

for t in tests:
    print('\n---')
    print('INPUT:', t)
    try:
        out = ai_agent.run_text_agent(t, {})
        print('OUTPUT:', json.dumps(out, ensure_ascii=False))
    except Exception as e:
        print('ERROR calling run_text_agent:', e)

print('\n---\nPLAN TEST')
try:
    plan = ai_agent.create_plan_events('Organizar trabajo semanal', {'start': '2025-11-17', 'end': '2025-11-24'}, {'max_daily_minutes': 240})
    print('PLAN:', json.dumps(plan, ensure_ascii=False))
except Exception as e:
    print('PLAN ERROR:', e)

print('\nDone')
