from ai_agent import run_text_agent
res = run_text_agent('Muéstrame las citas de la próxima semana', {})
import json
print(json.dumps(res, indent=2, ensure_ascii=False))
