"""
Comprehensive test suite for CallGuard risk assessment system.

This test suite covers:
- Rule-based assessment (fallback system)
- Input validation and edge cases
- Helper functions
- Error handling
- Integration scenarios
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any

from backend.risk_engine import callguard
from backend.models import RiskResponse, SafeScript, RecommendedAction


class TestRuleBasedAssessment:
    """Tests for the rule-based fallback assessment system."""
    
    def test_high_risk_verification_code_request(self):
        """Test that verification_code_request triggers high risk."""
        signals = ["verification_code_request"]
        response = callguard.assess(signals, use_ai=False)
        
        assert isinstance(response, RiskResponse)
        assert response.score >= 35  # verification_code_request weight is 35
        assert response.level in ["medium", "high"]
        assert len(response.reasons) > 0
        assert "verification code" in " ".join(response.reasons).lower()
    
    def test_multiple_high_risk_signals(self):
        """Test cumulative scoring with multiple signals."""
        signals = [
            "verification_code_request",  # 35
            "remote_access_request",      # 30
            "bank_impersonation"         # 25
        ]
        response = callguard.assess(signals, use_ai=False)
        
        assert response.score >= 70  # Should be high risk
        assert response.level == "high"
        assert len(response.reasons) == 3
    
    def test_low_risk_signals(self):
        """Test that low-weight signals result in low risk."""
        signals = ["urgency", "too_good_to_be_true"]
        response = callguard.assess(signals, use_ai=False)
        
        assert response.score < 35
        assert response.level == "low"
    
    def test_no_signals(self):
        """Test behavior with no signals."""
        response = callguard.assess([], use_ai=False)
        
        assert isinstance(response, RiskResponse)
        assert response.score == 0
        assert response.level == "low"
        assert "No high-risk signals detected" in response.reasons[0]
    
    def test_unknown_signal_ignored(self):
        """Test that unknown signals are ignored."""
        signals = ["unknown_signal_xyz", "urgency"]
        response = callguard.assess(signals, use_ai=False)
        
        # Should only count urgency (weight 10)
        assert response.score == 10
        assert len(response.reasons) == 1
    
    def test_safe_script_for_bank_impersonation(self):
        """Test that bank impersonation gets a safe script."""
        signals = ["bank_impersonation"]
        response = callguard.assess(signals, use_ai=False)
        
        assert response.safe_script is not None
        assert isinstance(response.safe_script, SafeScript)
        assert len(response.safe_script.say_this) > 0
        assert len(response.safe_script.if_they_push_back) > 0
        assert "bank" in response.safe_script.say_this.lower()
    
    def test_recommended_actions_always_present(self):
        """Test that recommended actions are always provided."""
        response = callguard.assess(["urgency"], use_ai=False)
        
        assert len(response.recommended_actions) >= 2
        assert all(isinstance(action, RecommendedAction) for action in response.recommended_actions)
        action_ids = [action.id for action in response.recommended_actions]
        assert "pause-call" in action_ids
        assert "hang-up" in action_ids


class TestInputValidation:
    """Tests for input validation and edge cases."""
    
    def test_empty_signals_list(self):
        """Test with empty signals list."""
        response = callguard.assess([])
        assert isinstance(response, RiskResponse)
        assert response.score >= 0
    
    def test_none_signals(self):
        """Test with None signals (should be converted to empty list)."""
        # This should not raise an error
        response = callguard.assess(None)  # type: ignore
        assert isinstance(response, RiskResponse)
    
    def test_invalid_signal_types(self):
        """Test that non-string signals are filtered out."""
        signals = ["valid_signal", 123, None, "", "  ", "another_valid"]
        response = callguard.assess(signals, use_ai=False)  # type: ignore
        
        # Should only process valid string signals
        assert isinstance(response, RiskResponse)
        # Should have processed at least the valid signals
        assert response.score >= 0
    
    def test_call_context_with_all_fields(self):
        """Test with complete call context."""
        context = {
            "caller_id": "+1234567890",
            "transcript": "This is a test transcript of a suspicious call.",
            "duration": 120,
            "caller_name": "John Doe",
            "call_direction": "inbound"
        }
        response = callguard.assess(["urgency"], call_context=context, use_ai=False)
        
        assert isinstance(response, RiskResponse)
        assert "rule_based" in response.metadata.get("assessment_method", "")
    
    def test_call_context_partial(self):
        """Test with partial call context."""
        context = {"caller_id": "+1234567890"}
        response = callguard.assess(["urgency"], call_context=context, use_ai=False)
        
        assert isinstance(response, RiskResponse)
    
    def test_call_context_empty(self):
        """Test with empty call context."""
        context = {}
        response = callguard.assess(["urgency"], call_context=context, use_ai=False)
        
        assert isinstance(response, RiskResponse)
    
    def test_call_context_none(self):
        """Test with None call context."""
        response = callguard.assess(["urgency"], call_context=None, use_ai=False)
        
        assert isinstance(response, RiskResponse)


class TestHelperFunctions:
    """Tests for internal helper functions."""
    
    def test_build_call_context_text_complete(self):
        """Test context building with all fields."""
        context = {
            "caller_id": "+1234567890",
            "transcript": "Test transcript",
            "duration": 60,
            "caller_name": "Test Name"
        }
        result = callguard._build_call_context_text(context)
        
        assert "Caller ID" in result
        assert "Call transcript" in result
        assert "Call duration" in result
        assert "caller_name" in result.lower()
    
    def test_build_call_context_text_empty(self):
        """Test context building with empty context."""
        result = callguard._build_call_context_text(None)
        assert result == ""
        
        result = callguard._build_call_context_text({})
        assert result == ""
    
    def test_format_signals_text(self):
        """Test signal formatting."""
        signals = ["signal1", "signal2", "signal3"]
        result = callguard._format_signals_text(signals)
        
        assert result == "signal1, signal2, signal3"
        assert "signal1" in result
    
    def test_format_signals_text_empty(self):
        """Test signal formatting with empty list."""
        result = callguard._format_signals_text([])
        assert "No specific signals detected" in result
    
    def test_parse_json_from_text_valid(self):
        """Test JSON parsing from text with valid JSON."""
        text = 'Some text before {"risk_score": 75, "reasons": ["test"]} some after'
        result = callguard._parse_json_from_text(text)
        
        assert result["risk_score"] == 75
        assert "test" in result["reasons"]
    
    def test_parse_json_from_text_invalid(self):
        """Test JSON parsing with invalid JSON."""
        text = "This is not JSON at all"
        result = callguard._parse_json_from_text(text)
        
        assert "risk_score" in result
        assert result["risk_score"] == callguard.DEFAULT_RISK_SCORE
    
    def test_get_default_recommended_actions(self):
        """Test default recommended actions."""
        actions = callguard._get_default_recommended_actions()
        
        assert len(actions) == 2
        assert all(isinstance(action, RecommendedAction) for action in actions)
        assert actions[0].id == "pause-call"
        assert actions[1].id == "hang-up"
    
    def test_create_safe_script_from_data_valid(self):
        """Test safe script creation with valid data."""
        data = {
            "say_this": "Test response",
            "if_they_push_back": "Test pushback"
        }
        script = callguard._create_safe_script_from_data(data)
        
        assert script is not None
        assert isinstance(script, SafeScript)
        assert script.say_this == "Test response"
        assert script.if_they_push_back == "Test pushback"
    
    def test_create_safe_script_from_data_invalid(self):
        """Test safe script creation with invalid data."""
        # Missing say_this
        assert callguard._create_safe_script_from_data({}) is None
        assert callguard._create_safe_script_from_data({"say_this": ""}) is None
        assert callguard._create_safe_script_from_data(None) is None
    
    def test_convert_actions_to_recommended_actions(self):
        """Test action conversion."""
        ai_actions = [
            {"id": "test1", "title": "Title 1", "detail": "Detail 1"},
            {"id": "test2", "title": "Title 2", "detail": "Detail 2"}
        ]
        result = callguard._convert_actions_to_recommended_actions(ai_actions)
        
        assert len(result) >= 2
        assert all(isinstance(action, RecommendedAction) for action in result)
        assert result[0].id == "test1"
        assert result[1].id == "test2"


class TestErrorHandling:
    """Tests for error handling and graceful degradation."""
    
    def test_assess_with_ai_disabled(self):
        """Test that AI can be disabled explicitly."""
        response = callguard.assess(["urgency"], use_ai=False)
        
        assert isinstance(response, RiskResponse)
        assert "rule_based" in response.metadata.get("assessment_method", "")
    
    def test_assess_with_crewai_disabled(self):
        """Test that CrewAI can be disabled."""
        response = callguard.assess(["urgency"], use_crewai=False, use_ai=True)
        
        assert isinstance(response, RiskResponse)
        # Should use LangChain or fall back to rule-based
    
    @patch('backend.risk_engine.callguard._get_llm')
    def test_langchain_fallback_on_error(self, mock_get_llm):
        """Test that errors in LangChain fall back to rule-based."""
        mock_get_llm.return_value = None
        
        response = callguard.assess(["urgency"], use_ai=True, use_crewai=False)
        
        assert isinstance(response, RiskResponse)
        # Should fall back to rule-based
        assert response.score >= 0
    
    def test_rule_based_always_works(self):
        """Test that rule-based system always returns a valid response."""
        response = callguard._rule_based_assess(["urgency"])
        
        assert isinstance(response, RiskResponse)
        assert 0 <= response.score <= 100
        assert response.level in ["low", "medium", "high"]
        assert len(response.reasons) > 0
        assert len(response.recommended_actions) > 0


class TestResponseStructure:
    """Tests for response structure and data integrity."""
    
    def test_response_has_all_required_fields(self):
        """Test that response has all required fields."""
        response = callguard.assess(["urgency"], use_ai=False)
        
        assert hasattr(response, "score")
        assert hasattr(response, "level")
        assert hasattr(response, "reasons")
        assert hasattr(response, "next_action")
        assert hasattr(response, "recommended_actions")
        assert hasattr(response, "metadata")
    
    def test_score_is_clamped(self):
        """Test that risk scores are clamped to 0-100."""
        # Use multiple high-risk signals to potentially exceed 100
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
        
        assert 0 <= response.score <= 100
    
    def test_metadata_structure(self):
        """Test that metadata has expected structure."""
        response = callguard.assess(["urgency"], use_ai=False)
        
        assert isinstance(response.metadata, dict)
        assert "assessment_method" in response.metadata
        assert "primary_signal" in response.metadata
        assert "signals_count" in response.metadata
    
    def test_reasons_not_empty(self):
        """Test that reasons list is never empty."""
        response = callguard.assess(["urgency"], use_ai=False)
        
        assert len(response.reasons) > 0
        assert all(isinstance(reason, str) for reason in response.reasons)
        assert all(len(reason) > 0 for reason in response.reasons)


class TestSignalWeights:
    """Tests for signal weight calculations."""
    
    def test_all_known_signals_have_weights(self):
        """Test that all signals in SIGNAL_WEIGHTS are recognized."""
        for signal in callguard.SIGNAL_WEIGHTS.keys():
            response = callguard.assess([signal], use_ai=False)
            assert response.score > 0
    
    def test_signal_weight_accumulation(self):
        """Test that signal weights accumulate correctly."""
        # Single signal
        single = callguard.assess(["urgency"], use_ai=False)
        single_score = single.score
        
        # Multiple of same signal (should only count once)
        multiple = callguard.assess(["urgency", "urgency", "urgency"], use_ai=False)
        multiple_score = multiple.score
        
        # Should be same (signals are deduplicated in processing)
        assert single_score == multiple_score
    
    def test_highest_signal_determination(self):
        """Test that highest weighted signal is identified."""
        signals = ["urgency", "verification_code_request"]  # 10 vs 35
        response = callguard.assess(signals, use_ai=False)
        
        # Should identify verification_code_request as primary
        primary = response.metadata.get("primary_signal", "")
        assert primary == "verification_code_request"


class TestIntegrationScenarios:
    """Integration tests for real-world scenarios."""
    
    def test_bank_scam_scenario(self):
        """Test a typical bank impersonation scam."""
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
        
        assert response.score >= 60
        assert response.level in ["medium", "high"]
        assert response.safe_script is not None
        assert "bank" in response.safe_script.say_this.lower()
    
    def test_tech_support_scam_scenario(self):
        """Test a typical tech support scam."""
        signals = [
            "tech_support",
            "remote_access_request",
            "urgency"
        ]
        response = callguard.assess(signals, use_ai=False)
        
        assert response.score >= 50
        assert response.safe_script is not None
        assert "remote" in response.safe_script.say_this.lower() or \
               "access" in response.safe_script.say_this.lower()
    
    def test_gift_card_scam_scenario(self):
        """Test a gift card payment scam."""
        signals = ["gift_cards", "urgency", "too_good_to_be_true"]
        response = callguard.assess(signals, use_ai=False)
        
        assert response.score >= 40
        assert response.safe_script is not None
        assert "gift" in response.safe_script.say_this.lower() or \
               "card" in response.safe_script.say_this.lower()
    
    def test_low_risk_legitimate_call(self):
        """Test a low-risk legitimate call scenario."""
        signals = []  # No suspicious signals
        context = {
            "caller_id": "+1-555-123-4567",
            "caller_name": "John Doe",
            "duration": 30
        }
        response = callguard.assess(signals, call_context=context, use_ai=False)
        
        assert response.score < 35
        assert response.level == "low"


class TestConstants:
    """Tests for module constants."""
    
    def test_constants_are_defined(self):
        """Test that all constants are properly defined."""
        assert hasattr(callguard, "DEFAULT_MODEL")
        assert hasattr(callguard, "DEFAULT_TEMPERATURE")
        assert hasattr(callguard, "MAX_TRANSCRIPT_LENGTH")
        assert hasattr(callguard, "MAX_RECOMMENDED_ACTIONS")
        assert hasattr(callguard, "DEFAULT_RISK_SCORE")
    
    def test_constants_have_reasonable_values(self):
        """Test that constants have reasonable values."""
        assert callguard.DEFAULT_TEMPERATURE >= 0
        assert callguard.DEFAULT_TEMPERATURE <= 1
        assert callguard.MAX_TRANSCRIPT_LENGTH > 0
        assert callguard.MAX_RECOMMENDED_ACTIONS > 0
        assert 0 <= callguard.DEFAULT_RISK_SCORE <= 100


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])

