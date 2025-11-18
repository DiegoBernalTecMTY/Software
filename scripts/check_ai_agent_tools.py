import importlib.util
import sys
from pathlib import Path

module_path = Path(__file__).resolve().parent.parent / 'ai_agent.py'
spec = importlib.util.spec_from_file_location('ai_agent', str(module_path))
ai_agent = importlib.util.module_from_spec(spec)
sys.modules['ai_agent'] = ai_agent
spec.loader.exec_module(ai_agent)

TEST_TOKEN = 'FB70C5D6-9D03-4D02-823E-C2BE37E34D7E'

tools = ai_agent.create_tools(TEST_TOKEN)
print(f'Created {len(tools)} tools')
for t in tools:
    name = getattr(t, '__name__', repr(t))
    closure = getattr(t, '__closure__', None)
    print('\nTool:', name)
    if closure:
        print('  Closure values:')
        for i, cell in enumerate(closure):
            try:
                print(f'    cell[{i}]:', repr(cell.cell_contents))
            except Exception as e:
                print(f'    cell[{i}]: <unreadable: {e}>')
    else:
        print('  No closure')

for t in tools:
    try:
        print('\nFunction repr:', repr(t))
    except Exception:
        pass
