import sys
import pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import ai
import traceback

print('_GENAI_CLIENT =', ai._GENAI_CLIENT)
try:
    if ai._GENAI_CLIENT is None:
        print('No genai client available')
    else:
        print('Attempting to list models...')
        m = ai._GENAI_CLIENT.models.list()
        print('Models list object:', m)
        try:
            models = getattr(m, 'models', None)
            print('Number of models:', len(models) if models is not None else 'N/A')
        except Exception as e:
            print('Could not get models length:', e)
except Exception:
    traceback.print_exc()
