# Quick Reference: Session Management

## What Changed?

### Before (❌ Broken)
```
User: "¿Qué tengo para mañana?"
Agent: "Necesito buscar en la base de datos..."

User: "Muéstrame todos los eventos"
Agent: "¿Para cuál período?" ← OOPS! Lost context
```

### After (✅ Fixed)
```
User: "¿Qué tengo para mañana?"
Agent: "Estos son tus eventos para mañana..."
Session ID stored → 63764d59-a32b-490a-a93d-cf11f147a544

User: "Muéstrame todos los eventos"
Agent: Uses previous context! "Aquí están todos los eventos de mañana..."
Same session ID used → 63764d59-a32b-490a-a93d-cf11f147a544
```

---

## How It Works

### Frontend (Automatic)
```typescript
// When you first use the app:
1. App checks localStorage for 'mna_session_id'
2. If none found, creates new session
3. Stores session_id in localStorage
4. All API calls automatically include session_id

// When you send a message:
5. Frontend gets session_id from storage
6. Sends: { text: "your message", session_id: "..." }
7. Receives response with session_id
8. Continues using same session_id for next message
```

### Backend (Automatic)
```python
# When request arrives with session_id:
1. Backend retrieves session from memory
2. Gets full conversation history
3. Includes history in LLM prompt
4. LLM now understands previous context
5. Response is context-aware (no redundant questions)
6. Adds new message to history
7. Returns same session_id to client
```

---

## API Reference

### Send a Message (Automatic Session)
```typescript
const response = await api.command.process("¿Qué tengo para mañana?");
// Response includes: { session_id, mensaje, action, ... }
// Session ID automatically stored and reused
```

### Create New Session (Optional)
```typescript
const { session_id } = await api.command.createSession();
// If you want to start fresh conversation
```

### Get Session Info
```typescript
const sessionId = api.getSessionId();
const session = await api.command.getSession(sessionId);
// Returns: { session_id, created_at, last_activity, history_count, context }
```

### Get Conversation History
```typescript
const sessionId = api.getSessionId();
const { history } = await api.command.getHistory(sessionId);
// history = [
//   { role: "user", content: "¿Qué tengo para mañana?", timestamp: "..." },
//   { role: "assistant", content: "Estos son tus eventos...", timestamp: "..." },
//   ...
// ]
```

---

## Environment Variables

### For LangSmith Tracing
```bash
export LANGSMITH_API_KEY=your_api_key
export LANGSMITH_PROJECT=your_project_name
export LANGSMITH_ENDPOINT=https://api.smith.langchain.com
export LANGCHAIN_TRACING_V2=true
```

### Verify LangSmith is working
```bash
curl http://localhost:5000/api/session/create
# Should return: { session_id: "..." }
```

---

## Common Issues

### Issue: Session lost after page refresh
**Solution**: Session ID is saved in localStorage. If lost:
```typescript
// Manually check
const sessionId = api.getSessionId();
console.log("Current session:", sessionId);

// Or create new
await api.command.createSession();
```

### Issue: Agent still asks for clarification
**Solution**: Make sure you're sending complete messages
```typescript
// ❌ Too vague
"Muéstrame todo"

// ✅ Better
"Muéstrame todos mis eventos para mañana"
```

### Issue: LangSmith not showing runs
**Solution**: Verify environment variables
```bash
# Check if set
echo $LANGSMITH_API_KEY
echo $LANGSMITH_PROJECT

# Test connection
python -c "from langsmith import Client; c = Client(); print('Connected!')"
```

---

## Testing Session Flow

```bash
# Run the test
cd c:\MNA-Software
python test_session_flow.py

# Expected output:
# ✓ Session created: [UUID]
# ✓ First message added to history
# ✓ Second message added to history
# ✓ Session history maintains context
# ✓ SESSION MANAGEMENT TEST PASSED
```

---

## Architecture Diagram

```
┌─────────────────────────────────┐
│  Frontend (Browser)             │
│  ┌───────────────────────────┐ │
│  │ localStorage              │ │
│  │ mna_session_id: "abc-123" │ │
│  └───────────────────────────┘ │
│         ↓ ↑                     │
│  Send message + session_id      │
│  Receive response + session_id  │
└─────────────────────────────────┘
          ↓ ↑
    HTTP POST/GET
          ↓ ↑
┌─────────────────────────────────┐
│  Backend (Flask)                │
│  ┌───────────────────────────┐ │
│  │ _SESSION_STORAGE          │ │
│  │ {                         │ │
│  │   "abc-123": {            │ │
│  │     history: [            │ │
│  │       {user msg 1},       │ │
│  │       {assistant msg 1},  │ │
│  │       {user msg 2},       │ │
│  │       ...                 │ │
│  │     ],                    │ │
│  │     created_at: "...",    │ │
│  │     context: {}           │ │
│  │   }                       │ │
│  │ }                         │ │
│  └───────────────────────────┘ │
│         ↓                       │
│  ┌───────────────────────────┐ │
│  │ LLM Prompt                │ │
│  │ (includes history)        │ │
│  └───────────────────────────┘ │
│         ↓                       │
│  ┌───────────────────────────┐ │
│  │ Groq/OpenAI API           │ │
│  │ (contextual response)     │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `ai_agent.py` | Session storage, history tracking, context-aware prompts |
| `app.py` | `/api/session/*` endpoints, session-aware `/api/ai/text` |
| `frontend/src/utils/api.ts` | `setSessionId()`, `getSessionId()`, session API calls |
| `frontend/src/App.tsx` | Initialize session on app load |
| `test_session_flow.py` | Test multi-turn conversations |

---

## Next Steps

1. ✅ **Session management is working**
   - Conversations maintain context across turns
   - Session ID persists across page reloads

2. ✅ **Direct query responses**
   - Agent doesn't ask for clarification when date is explicit
   - Uses conversation history to infer context

3. ✅ **LangSmith tracing**
   - Properly initialized when env vars are set
   - Ready for production monitoring

---

## Support

If you encounter issues:

1. Check browser console (F12 → Console)
2. Check server logs (Flask terminal)
3. Run `test_session_flow.py` to verify backend
4. Verify environment variables are set
5. Check localStorage: `localStorage.getItem('mna_session_id')`
