"""
Simple, quick tests for CallGuard that can be run without pytest.

Run with: python backend/tests/test_callguard_simple.py
"""

import sys
from pathlib import Path

# Add project root to path
# test_callguard_simple.py is in backend/tests/
# So we need to go up 2 levels to get to project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.risk_engine import callguard

from backend.models import RiskResponse


def test_basic_assessment():
    """Test 1: Basic risk assessment with high-risk signals."""
    print("\n[Test 1] Testing basic assessment with verification code request...")
    signals = ["verification_code_request", "urgency"]
    response = callguard.assess(signals, use_ai=False)
    
    assert isinstance(response, RiskResponse), "Response should be RiskResponse"
    assert response.score >= 35, f"Expected score >= 35, got {response.score}"
    assert response.level in ["medium", "high"], f"Expected medium/high, got {response.level}"
    print(f"[PASS] Score={response.score}, Level={response.level}")


def test_empty_signals():
    """Test 2: Empty signals list."""
    print("\n[Test 2] Testing with empty signals...")
    response = callguard.assess([], use_ai=False)
    
    assert isinstance(response, RiskResponse), "Response should be RiskResponse"
    assert response.score == 0, f"Expected score 0, got {response.score}"
    assert response.level == "low", f"Expected low, got {response.level}"
    print(f"[PASS] Score={response.score}, Level={response.level}")


def test_multiple_signals():
    """Test 3: Multiple high-risk signals."""
    print("\n[Test 3] Testing multiple high-risk signals...")
    signals = [
        "verification_code_request",  # 35
        "remote_access_request",      # 30
        "bank_impersonation"         # 25
    ]
    response = callguard.assess(signals, use_ai=False)
    
    assert response.score >= 70, f"Expected score >= 70, got {response.score}"
    assert response.level == "high", f"Expected high, got {response.level}"
    assert len(response.reasons) >= 3, f"Expected at least 3 reasons, got {len(response.reasons)}"
    print(f"[PASS] Score={response.score}, Reasons={len(response.reasons)}")


def test_safe_script():
    """Test 4: Safe script generation."""
    print("\n[Test 4] Testing safe script generation...")
    signals = ["bank_impersonation"]
    response = callguard.assess(signals, use_ai=False)
    
    assert response.safe_script is not None, "Safe script should be provided"
    assert len(response.safe_script.say_this) > 0, "Safe script should have content"
    assert len(response.safe_script.if_they_push_back) > 0, "Pushback script should have content"
    print(f"[PASS] Safe script provided with {len(response.safe_script.say_this)} chars")


def test_call_context():
    """Test 5: Call context handling."""
    print("\n[Test 5] Testing call context...")
    context = {
        "caller_id": "+1234567890",
        "transcript": "This is a test call transcript.",
        "duration": 120
    }
    response = callguard.assess(["urgency"], call_context=context, use_ai=False)
    
    assert isinstance(response, RiskResponse), "Response should be RiskResponse"
    assert "rule_based" in response.metadata.get("assessment_method", ""), "Should use rule-based"
    print(f"[PASS] Context processed, method={response.metadata.get('assessment_method')}")


def test_recommended_actions():
    """Test 6: Recommended actions."""
    print("\n[Test 6] Testing recommended actions...")
    response = callguard.assess(["urgency"], use_ai=False)
    
    assert len(response.recommended_actions) >= 2, "Should have at least 2 actions"
    action_ids = [action.id for action in response.recommended_actions]
    assert "pause-call" in action_ids, "Should have pause-call action"
    assert "hang-up" in action_ids, "Should have hang-up action"
    print(f"[PASS] {len(response.recommended_actions)} actions provided")


def test_input_validation():
    """Test 7: Input validation with invalid signals."""
    print("\n[Test 7] Testing input validation...")
    signals = ["valid_signal", 123, None, "", "  ", "another_valid"]  # type: ignore
    response = callguard.assess(signals, use_ai=False)  # type: ignore
    
    assert isinstance(response, RiskResponse), "Should handle invalid inputs gracefully"
    assert response.score >= 0, "Score should be non-negative"
    print(f"[PASS] Handled invalid inputs, score={response.score}")


def test_score_clamping():
    """Test 8: Score clamping to 0-100."""
    print("\n[Test 8] Testing score clamping...")
    # Use many high-risk signals
    signals = [
        "verification_code_request",  # 35
        "remote_access_request",      # 30
        "gift_cards",                 # 30
        "crypto_payment",             # 30
        "bank_impersonation",         # 25
        "government_impersonation",    # 25
        "threats_or_arrest"           # 25
    ]
    response = callguard.assess(signals, use_ai=False)
    
    assert 0 <= response.score <= 100, f"Score should be 0-100, got {response.score}"
    print(f"[PASS] Score clamped to {response.score}")


def test_bank_scam_scenario():
    """Test 9: Real-world bank scam scenario."""
    print("\n[Test 9] Testing bank scam scenario...")
    signals = [
        "bank_impersonation",
        "urgency",
        "verification_code_request",
        "asks_to_keep_secret"
    ]
    context = {
        "caller_id": "+1-800-FAKE-BANK",
        "transcript": "This is your bank calling. We need to verify your account immediately.",
        "duration": 180
    }
    response = callguard.assess(signals, call_context=context, use_ai=False)
    
    assert response.score >= 60, f"Bank scam should be high risk, got {response.score}"
    assert response.level in ["medium", "high"], f"Expected medium/high, got {response.level}"
    assert response.safe_script is not None, "Should provide safe script for bank scam"
    print(f"[PASS] Bank scam detected, score={response.score}, level={response.level}")


def test_low_risk_scenario():
    """Test 10: Low-risk legitimate call."""
    print("\n[Test 10] Testing low-risk scenario...")
    signals = ["urgency"]  # Low weight signal
    response = callguard.assess(signals, use_ai=False)
    
    assert response.score < 35, f"Low risk should be < 35, got {response.score}"
    assert response.level == "low", f"Expected low, got {response.level}"
    print(f"[PASS] Low risk correctly identified, score={response.score}")


def run_all_tests():
    """Run all tests and report results."""
    print("=" * 60)
    print("CallGuard Test Suite")
    print("=" * 60)
    
    tests = [
        test_basic_assessment,
        test_empty_signals,
        test_multiple_signals,
        test_safe_script,
        test_call_context,
        test_recommended_actions,
        test_input_validation,
        test_score_clamping,
        test_bank_scam_scenario,
        test_low_risk_scenario,
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"[FAIL] {e}")
            failed += 1
        except Exception as e:
            print(f"[ERROR] {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Results: {passed} passed, {failed} failed out of {len(tests)} tests")
    print("=" * 60)
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

