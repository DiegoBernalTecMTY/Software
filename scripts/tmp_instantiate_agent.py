import traceback
try:
    import ai_agent
    print('Imported ai_agent')
    ai_agent.Agente_de_Citas(session_id='test', user_token='tok')
    print('Instantiated')
except Exception:
    traceback.print_exc()
