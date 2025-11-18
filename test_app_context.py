from app import app, run_text_agent
print("run_text_agent from app:", run_text_agent)

# Simulate what Flask does
with app.app_context():
    result = run_text_agent("Agendar dentista mañana a las 10am", "test_session")
    import json
    print(json.dumps(result, indent=2))
