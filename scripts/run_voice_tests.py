import json
import requests
import mimetypes
import os

TEST_FILE = os.path.join(os.path.dirname(__file__), '..', 'tests', 'tests_voice', 'tests_voice.json')
API_URL = os.environ.get('LOCAL_API_BASE', 'http://localhost:5000') + '/api/ai/voice'


def normalize(s: str) -> str:
    if s is None:
        return ''
    # lowercase, remove extra whitespace
    return ' '.join(s.strip().lower().split())


if __name__ == '__main__':
    with open(TEST_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    tests = data.get('tests', [])
    passed = 0
    total = min(len(tests), 3)
    for i, t in enumerate(tests[:3], start=1):
        name = t.get('name')
        audio_file = t.get('audio_file')
        expected = t.get('transcription')
        print(f"\nTest {i}: {name}\n  audio: {audio_file}\n  expected: {expected}\n")
        if not os.path.exists(audio_file):
            print(f"  SKIP: audio file not found: {audio_file}")
            continue
        mime, _ = mimetypes.guess_type(audio_file)
        mime = mime or 'audio/wav'
        with open(audio_file, 'rb') as fh:
            files = {'audio': (os.path.basename(audio_file), fh, mime)}
            try:
                resp = requests.post(API_URL, files=files, timeout=120)
                status = resp.status_code
                text = resp.text
                if status != 200:
                    print(f"  ERROR calling transcription endpoint: {status} {text}")
                    continue
                j = resp.json()
            except Exception as e:
                print(f"  ERROR calling transcription endpoint: {e}")
                continue
        transcript = j.get('transcript') or j.get('text') or ''
        norm_expected = normalize(expected)
        norm_trans = normalize(transcript)
        print(f"  transcript: {transcript}\n")
        if norm_expected == norm_trans:
            print("  PASS")
            passed += 1
        else:
            print("  FAIL")
            print(f"    expected(normalized): {norm_expected}")
            print(f"    got(normalized):      {norm_trans}")
    print(f"\nSummary: {passed}/{total} passed")
