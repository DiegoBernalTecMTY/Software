#!/usr/bin/env python
"""Test run_text_agent directly"""

from ai_agent import run_text_agent

# Test the agent directly
print("Testing run_text_agent directly...")
print("=" * 60)

test_commands = [
    "Cancelar una reunión",
    "Mostrar mis próximas citas", 
    "Agendar cita con dentista mañana a las 2pm"
]

for cmd in test_commands:
    print(f"\nCommand: {cmd}")
    result = run_text_agent(cmd, {})
    print(f"Result type: {type(result)}")
    print(f"Result: {result}")
    if isinstance(result, dict):
        print(f"  action: {result.get('action')}")
        print(f"  mensaje: {result.get('mensaje')}")
        print(f"  resultado: {result.get('resultado')}")
