"""
Test OpenAI API key integration to verify it works for AI agent functionality.

This test makes actual calls to OpenAI to ensure the API key is valid and
the AI agent can process requests.

Run with: python backend/tests/test_openai_integration.py
"""

import os
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.risk_engine import callguard
from backend.models import RiskResponse


def test_openai_api_key_exists():
    """Test 1: Verify OPENAI_API_KEY environment variable is set."""
    print("\n[Test 1] Checking if OPENAI_API_KEY is set...")
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("[SKIP] OPENAI_API_KEY not set. Set it to test AI functionality.")
        print("       On Windows (PowerShell): $env:OPENAI_API_KEY='sk-...'")
        print("       On Windows (CMD): set OPENAI_API_KEY=sk-...")
        print("       On Linux/Mac: export OPENAI_API_KEY='sk-...'")
        return False
    
    if not api_key.startswith("sk-"):
        print(f"[WARN] API key doesn't start with 'sk-'. Got: {api_key[:10]}...")
        return False
    
    print(f"[PASS] OPENAI_API_KEY is set (length: {len(api_key)} chars)")
    return True


def test_openai_llm_initialization():
    """Test 2: Verify OpenAI LLM can be initialized."""
    print("\n[Test 2] Testing OpenAI LLM initialization...")
    
    # Check if API key is set first
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[SKIP] OPENAI_API_KEY not set, skipping LLM initialization test")
        return None
    
    try:
        llm = callguard._get_llm()
        if llm is None:
            print("[FAIL] LLM initialization returned None")
            print("       Check that OPENAI_API_KEY is valid and langchain-openai is installed")
            print("       Install with: pip install langchain-openai")
            return False
        
        print("[PASS] OpenAI LLM initialized successfully")
        model_name = getattr(llm, 'model_name', None) or getattr(llm, 'model', None) or 'unknown'
        print(f"       Model: {model_name}")
        return True
    except ImportError as e:
        print(f"[FAIL] Missing required package: {e}")
        print("       Install with: pip install langchain-openai")
        return False
    except Exception as e:
        print(f"[FAIL] LLM initialization failed: {e}")
        return False


def test_openai_simple_call():
    """Test 3: Make a simple OpenAI API call to verify the key works."""
    print("\n[Test 3] Making a simple OpenAI API call...")
    
    try:
        llm = callguard._get_llm()
        if llm is None:
            print("[SKIP] LLM not available, skipping API call test")
            return False
        
        # Make a simple test call
        from langchain_core.messages import HumanMessage
        
        test_message = HumanMessage(content="Say 'AI agent test successful' if you can read this.")
        response = llm.invoke([test_message])
        
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        if "successful" in response_text.lower() or len(response_text) > 0:
            print(f"[PASS] OpenAI API call successful!")
            print(f"       Response preview: {response_text[:100]}...")
            return True
        else:
            print(f"[FAIL] Unexpected response: {response_text[:100]}")
            return False
            
    except Exception as e:
        print(f"[FAIL] OpenAI API call failed: {e}")
        print("       This indicates the API key may be invalid or there's a connection issue")
        return False


def test_ai_agent_assessment():
    """Test 4: Test AI agent with actual risk assessment (demonstrates true AI capability)."""
    print("\n[Test 4] Testing AI agent with real risk assessment...")
    
    try:
        # Use a realistic scam scenario that requires AI understanding
        signals = [
            "bank_impersonation",
            "urgency",
            "verification_code_request"
        ]
        
        context = {
            "caller_id": "+1-800-555-0199",
            "transcript": "This is your bank's security department. We've detected suspicious activity on your account. We need you to verify your identity immediately by providing the code we just sent to your phone. This is urgent - your account will be frozen if you don't act now.",
            "duration": 180,
            "caller_name": "Bank Security",
            "call_direction": "inbound"
        }
        
        # Make assessment with AI enabled
        response = callguard.assess(signals, call_context=context, use_ai=True, use_crewai=False)
        
        if not isinstance(response, RiskResponse):
            print("[FAIL] Response is not a RiskResponse object")
            return False
        
        # Check that AI was actually used (not rule-based fallback)
        assessment_method = response.metadata.get("assessment_method", "")
        
        if "langchain" in assessment_method.lower() or "ai" in assessment_method.lower() or "crew" in assessment_method.lower():
            print(f"[PASS] AI agent successfully processed the assessment!")
            print(f"       Method: {assessment_method}")
            print(f"       Risk Score: {response.score}")
            print(f"       Risk Level: {response.level}")
            print(f"       Reasons: {len(response.reasons)} provided")
            
            # Verify AI provided meaningful analysis
            if response.score > 0 and len(response.reasons) > 0:
                print(f"       Sample reason: {response.reasons[0][:80]}...")
                return True
            else:
                print("[WARN] AI response seems incomplete")
                return False
        else:
            print(f"[FAIL] AI was not used - fell back to rule-based system")
            print(f"       Assessment method: {assessment_method}")
            print("       This suggests the API key may not be working or AI initialization failed")
            return False
            
    except Exception as e:
        print(f"[FAIL] AI agent assessment failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_ai_agent_context_understanding():
    """Test 5: Test AI agent's ability to understand context and provide nuanced analysis."""
    print("\n[Test 5] Testing AI agent's context understanding...")
    
    try:
        # Use a subtle scenario that requires AI to understand context
        signals = ["urgency"]  # Low-weight signal that needs context
        
        context = {
            "caller_id": "+1-800-555-0123",
            "transcript": "Hi, this is Microsoft Windows technical support. We've detected a virus on your computer that's sending out spam emails. We need to fix this immediately by accessing your computer remotely. Can you go to anydesk.com and download the software? This is very urgent - your computer could be permanently damaged if we don't act now.",
            "duration": 240,
            "call_direction": "inbound"
        }
        
        response = callguard.assess(signals, call_context=context, use_ai=True, use_crewai=False)
        
        if not isinstance(response, RiskResponse):
            print("[FAIL] Response is not a RiskResponse object")
            return False
        
        # AI should recognize this as a tech support scam despite only "urgency" signal
        assessment_method = response.metadata.get("assessment_method", "")
        
        if "langchain" in assessment_method.lower() or "ai" in assessment_method.lower():
            # AI should have identified this as high risk based on transcript analysis
            if response.score >= 50:
                print(f"[PASS] AI correctly identified high-risk scenario from context!")
                print(f"       Score: {response.score} (AI understood the tech support scam)")
                print(f"       Level: {response.level}")
                
                # Check if AI identified the scam type
                scam_type = response.metadata.get("scam_type", "")
                if scam_type and "tech" in scam_type.lower():
                    print(f"       Scam type identified: {scam_type}")
                
                return True
            else:
                print(f"[WARN] AI processed but score seems low ({response.score})")
                print("       AI may not have fully analyzed the context")
                return False
        else:
            print(f"[FAIL] AI was not used - method: {assessment_method}")
            return False
            
    except Exception as e:
        print(f"[FAIL] Context understanding test failed: {e}")
        return False


def run_all_tests():
    """Run all OpenAI integration tests."""
    print("=" * 70)
    print("OpenAI API Key Integration Test Suite")
    print("=" * 70)
    print("\nThis suite verifies that your OpenAI API key works and the AI agent")
    print("can successfully process requests. It makes actual API calls to OpenAI.\n")
    
    tests = [
        ("API Key Check", test_openai_api_key_exists),
        ("LLM Initialization", test_openai_llm_initialization),
        ("Simple API Call", test_openai_simple_call),
        ("AI Agent Assessment", test_ai_agent_assessment),
        ("Context Understanding", test_ai_agent_context_understanding),
    ]
    
    passed = 0
    failed = 0
    skipped = 0
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if result is True:
                passed += 1
            elif result is False:
                failed += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"[ERROR] {test_name} raised exception: {e}")
            failed += 1
    
    print("\n" + "=" * 70)
    print("Test Results Summary")
    print("=" * 70)
    print(f"[PASS] Passed: {passed}")
    print(f"[FAIL] Failed: {failed}")
    print(f"[SKIP] Skipped: {skipped}")
    print(f"[TOTAL] Total: {len(tests)}")
    print("=" * 70)
    
    if passed >= 3:  # At least API key check, initialization, and one AI call should pass
        print("\n[SUCCESS] Your OpenAI API key is working! The AI agent is functional.")
    elif passed > 0:
        print("\n[PARTIAL] Some tests passed, but AI functionality may be limited.")
        print("   Check your API key and ensure langchain-openai is installed.")
    else:
        print("\n[FAILED] OpenAI integration is not working.")
        print("   Please check:")
        print("   1. OPENAI_API_KEY environment variable is set")
        print("   2. API key is valid and has credits")
        print("   3. langchain-openai package is installed: pip install langchain-openai")
        print("   4. You have internet connectivity")
    
    return failed == 0 and passed >= 3


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

