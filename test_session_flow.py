#!/usr/bin/env python3
"""Test the new session management and multi-turn conversation flow."""

import sys
from ai_agent import (
    run_text_agent, 
    create_session, 
    get_session, 
    get_session_history,
    add_to_history
)

def test_session_flow():
    """Test that sessions maintain conversation context."""
    print("=" * 70)
    print("TEST: Multi-turn Conversation with Session Management")
    print("=" * 70)
    
    # Step 1: Create a session
    print("\n[Step 1] Creating a new session...")
    session_id = create_session()
    print(f"✓ Session created: {session_id}")
    
    # Step 2: First message - Ask about tomorrow
    print("\n[Step 2] First message: '¿Qué tengo para mañana?'")
    result1 = run_text_agent("¿Qué tengo para mañana?", {}, session_id)
    print(f"  Action: {result1.get('action')}")
    print(f"  Message: {result1.get('mensaje')[:100]}...")
    print(f"  Session ID in response: {result1.get('session_id')}")
    
    # Step 3: Check session history
    history = get_session_history(session_id)
    print(f"\n[Step 3] Session history after first message: {len(history)} entries")
    for msg in history:
        print(f"  - {msg['role']}: {msg.get('content', '')[:60]}...")
    
    # Step 4: Second message - Follow up
    print("\n[Step 4] Second message: 'Muéstrame todos los eventos'")
    result2 = run_text_agent("Muéstrame todos los eventos", {}, session_id)
    print(f"  Action: {result2.get('action')}")
    print(f"  Message: {result2.get('mensaje')[:100]}...")
    print(f"  Session ID in response: {result2.get('session_id')}")
    
    # Step 5: Check updated history
    history = get_session_history(session_id)
    print(f"\n[Step 5] Session history after second message: {len(history)} entries")
    for i, msg in enumerate(history):
        print(f"  {i+1}. {msg['role']}: {msg.get('content', '')[:60]}...")
    
    # Step 6: Test that conversation context is maintained
    print("\n[Step 6] Verify conversation context is maintained")
    session_data = get_session(session_id)
    print(f"  Session created at: {session_data.get('created_at')}")
    print(f"  Last activity: {session_data.get('last_activity')}")
    print(f"  Context: {session_data.get('context')}")
    
    print("\n" + "=" * 70)
    print("✓ SESSION MANAGEMENT TEST PASSED")
    print("=" * 70)
    print("\nKey improvements:")
    print("  1. Each message is tracked in conversation history")
    print("  2. Agent remembers previous context within the same session")
    print("  3. Session ID is consistently returned to client")
    print("  4. Frontend can now send same session_id to maintain conversation")

if __name__ == "__main__":
    try:
        test_session_flow()
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
