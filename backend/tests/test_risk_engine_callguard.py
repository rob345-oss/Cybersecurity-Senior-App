"""
Comprehensive unit tests for risk_engine/callguard.py module.

Tests assess function with rule-based fallback, and mocks for AI components.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from backend.risk_engine import callguard
from backend.models import RiskResponse


class TestCallGuardRuleBased:
    """Test CallGuard rule-based assessment (fallback system)."""
    
    def test_no_signals(self):
        """Test with no signals."""
        risk = callguard.assess([], use_ai=False)
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 0
        assert risk.level == "low"
        assert "No high-risk signals detected" in risk.reasons[0]
        assert risk.metadata["assessment_method"] == "rule_based"
    
    def test_single_signal_urgency(self):
        """Test with urgency signal."""
        risk = callguard.assess(["urgency"], use_ai=False)
        
        assert risk.score == 10
        assert risk.level == "low"
        assert "urgency" in risk.reasons[0].lower()
    
    def test_single_signal_verification_code(self):
        """Test with verification_code_request signal."""
        risk = callguard.assess(["verification_code_request"], use_ai=False)
        
        assert risk.score == 35
        assert risk.level == "low"
        assert "verification code" in risk.reasons[0].lower()
    
    def test_single_signal_bank_impersonation(self):
        """Test with bank_impersonation signal."""
        risk = callguard.assess(["bank_impersonation"], use_ai=False)
        
        assert risk.score == 25
        assert risk.level == "low"
        assert "bank" in risk.reasons[0].lower()
    
    def test_single_signal_government_impersonation(self):
        """Test with government_impersonation signal."""
        risk = callguard.assess(["government_impersonation"], use_ai=False)
        
        assert risk.score == 25
        assert risk.level == "low"
        assert "government" in risk.reasons[0].lower()
    
    def test_single_signal_tech_support(self):
        """Test with tech_support signal."""
        risk = callguard.assess(["tech_support"], use_ai=False)
        
        assert risk.score == 20
        assert risk.level == "low"
        assert "tech support" in risk.reasons[0].lower()
    
    def test_single_signal_remote_access(self):
        """Test with remote_access_request signal."""
        risk = callguard.assess(["remote_access_request"], use_ai=False)
        
        assert risk.score == 30
        assert risk.level == "low"
        assert "remote access" in risk.reasons[0].lower()
    
    def test_multiple_signals_medium_risk(self):
        """Test with multiple signals resulting in medium risk."""
        signals = ["urgency", "bank_impersonation", "tech_support"]
        risk = callguard.assess(signals, use_ai=False)
        
        # 10 + 25 + 20 = 55
        assert risk.score == 55
        assert risk.level == "medium"
        assert len(risk.reasons) == 3
    
    def test_multiple_signals_high_risk(self):
        """Test with multiple signals resulting in high risk."""
        signals = [
            "verification_code_request",
            "remote_access_request",
            "bank_impersonation",
        ]
        risk = callguard.assess(signals, use_ai=False)
        
        # 35 + 30 + 25 = 90
        assert risk.score == 90
        assert risk.level == "high"
        assert len(risk.reasons) == 3
    
    def test_all_signals_high_risk(self):
        """Test with all major signals."""
        signals = [
            "urgency",
            "bank_impersonation",
            "government_impersonation",
            "tech_support",
            "remote_access_request",
            "verification_code_request",
            "gift_cards",
            "crypto_payment",
        ]
        risk = callguard.assess(signals, use_ai=False)
        
        # Score will be very high, clamped to 100
        assert risk.score == 100
        assert risk.level == "high"
        assert len(risk.reasons) == 8
    
    def test_unknown_signal_ignored(self):
        """Test that unknown signals are ignored."""
        risk = callguard.assess(["unknown_signal", "urgency"], use_ai=False)
        
        # Only urgency should count (10 points)
        assert risk.score == 10
        assert "unknown_signal" not in str(risk.reasons).lower()
    
    def test_safe_script_for_bank_impersonation(self):
        """Test that safe script is provided for bank impersonation."""
        risk = callguard.assess(["bank_impersonation"], use_ai=False)
        
        assert risk.safe_script is not None
        assert "bank" in risk.safe_script.say_this.lower() or "card" in risk.safe_script.say_this.lower()
    
    def test_safe_script_for_government_impersonation(self):
        """Test that safe script is provided for government impersonation."""
        risk = callguard.assess(["government_impersonation"], use_ai=False)
        
        assert risk.safe_script is not None
        assert "legal" in risk.safe_script.say_this.lower() or "agency" in risk.safe_script.say_this.lower()
    
    def test_safe_script_for_tech_support(self):
        """Test that safe script is provided for tech support."""
        risk = callguard.assess(["tech_support"], use_ai=False)
        
        assert risk.safe_script is not None
        assert "remote access" in risk.safe_script.say_this.lower() or "support" in risk.safe_script.say_this.lower()
    
    def test_recommended_actions_present(self):
        """Test that recommended actions are always present."""
        risk = callguard.assess([], use_ai=False)
        
        assert len(risk.recommended_actions) >= 2
        action_ids = [action.id for action in risk.recommended_actions]
        assert "pause-call" in action_ids
        assert "hang-up" in action_ids
    
    def test_metadata_contains_assessment_method(self):
        """Test that metadata contains assessment method."""
        risk = callguard.assess(["urgency"], use_ai=False)
        
        assert risk.metadata["assessment_method"] == "rule_based"
        assert "signals_count" in risk.metadata
        assert "signals_processed" in risk.metadata
    
    def test_call_context_ignored_in_rule_based(self):
        """Test that call context is ignored in rule-based mode."""
        call_context = {
            "caller_id": "+1234567890",
            "transcript": "Test transcript",
            "duration": 120,
        }
        risk = callguard.assess(["urgency"], call_context=call_context, use_ai=False)
        
        # Should still work, context just not used in rule-based
        assert risk.score == 10


class TestCallGuardWithCallContext:
    """Test CallGuard with call context."""
    
    def test_call_context_with_caller_id(self):
        """Test with caller_id in context."""
        call_context = {
            "caller_id": "+1234567890",
        }
        risk = callguard.assess(["urgency"], call_context=call_context, use_ai=False)
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 10
    
    def test_call_context_with_transcript(self):
        """Test with transcript in context."""
        call_context = {
            "transcript": "This is a test transcript of the call.",
        }
        risk = callguard.assess(["urgency"], call_context=call_context, use_ai=False)
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 10
    
    def test_call_context_with_duration(self):
        """Test with duration in context."""
        call_context = {
            "duration": 300,
        }
        risk = callguard.assess(["urgency"], call_context=call_context, use_ai=False)
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 10
    
    def test_call_context_full(self):
        """Test with full call context."""
        call_context = {
            "caller_id": "+1234567890",
            "transcript": "Test transcript",
            "duration": 120,
            "caller_name": "John Doe",
            "call_direction": "inbound",
        }
        risk = callguard.assess(["urgency"], call_context=call_context, use_ai=False)
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 10


class TestCallGuardAIFallback:
    """Test CallGuard AI fallback behavior."""
    
    @patch('backend.risk_engine.callguard._get_llm')
    @patch('backend.risk_engine.callguard.CREWAI_AVAILABLE', False)
    @patch('backend.risk_engine.callguard.LANGCHAIN_AVAILABLE', False)
    def test_fallback_to_rule_based_no_ai(self, mock_get_llm):
        """Test fallback to rule-based when AI is not available."""
        mock_get_llm.return_value = None
        
        risk = callguard.assess(["urgency"], use_ai=True)
        
        assert risk.score == 10
        assert risk.metadata["assessment_method"] == "rule_based"
    
    @patch('backend.risk_engine.callguard._get_llm')
    @patch('backend.risk_engine.callguard.CREWAI_AVAILABLE', False)
    @patch('backend.risk_engine.callguard.LANGCHAIN_AVAILABLE', True)
    @patch('backend.risk_engine.callguard._langchain_assess')
    def test_langchain_fallback_when_crewai_unavailable(self, mock_langchain, mock_get_llm):
        """Test fallback to LangChain when CrewAI is unavailable."""
        mock_get_llm.return_value = Mock()
        mock_langchain.return_value = None  # Simulate LangChain failure
        
        risk = callguard.assess(["urgency"], use_ai=True, use_crewai=True)
        
        # Should fall back to rule-based
        assert risk.score == 10
        assert risk.metadata["assessment_method"] == "rule_based"
    
    @patch('backend.risk_engine.callguard._get_llm')
    @patch('backend.risk_engine.callguard.CREWAI_AVAILABLE', True)
    @patch('backend.risk_engine.callguard.LANGCHAIN_AVAILABLE', True)
    @patch('backend.risk_engine.callguard._crewai_assess')
    def test_crewai_fallback_when_fails(self, mock_crewai, mock_get_llm):
        """Test fallback when CrewAI fails."""
        mock_get_llm.return_value = Mock()
        mock_crewai.return_value = None  # Simulate CrewAI failure
        
        risk = callguard.assess(["urgency"], use_ai=True, use_crewai=True)
        
        # Should fall back to rule-based
        assert risk.score == 10
        assert risk.metadata["assessment_method"] == "rule_based"


class TestCallGuardInputValidation:
    """Test CallGuard input validation and edge cases."""
    
    def test_empty_signals_list(self):
        """Test with empty signals list."""
        risk = callguard.assess([], use_ai=False)
        
        assert risk.score == 0
        assert risk.level == "low"
    
    def test_none_signals(self):
        """Test with None signals (should be handled gracefully)."""
        # The function should handle None by converting to empty list
        risk = callguard.assess(None, use_ai=False)  # type: ignore
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 0
    
    def test_invalid_signal_types_filtered(self):
        """Test that invalid signal types are filtered out."""
        signals = ["valid_signal", 123, None, "", "  ", "another_valid"]
        risk = callguard.assess(signals, use_ai=False)  # type: ignore
        
        # Should only process valid string signals
        assert isinstance(risk, RiskResponse)
    
    def test_whitespace_only_signals_filtered(self):
        """Test that whitespace-only signals are filtered."""
        signals = ["urgency", "   ", "\t", "\n"]
        risk = callguard.assess(signals, use_ai=False)
        
        # Should only process "urgency"
        assert risk.score == 10


class TestCallGuardMetadata:
    """Test CallGuard metadata structure."""
    
    def test_metadata_structure_rule_based(self):
        """Test metadata structure for rule-based assessment."""
        risk = callguard.assess(["urgency", "bank_impersonation"], use_ai=False)
        
        assert "assessment_method" in risk.metadata
        assert "primary_signal" in risk.metadata
        assert "signals_count" in risk.metadata
        assert "signals_processed" in risk.metadata
        assert risk.metadata["assessment_method"] == "rule_based"
        assert risk.metadata["signals_count"] == 2
    
    def test_primary_signal_in_metadata(self):
        """Test that primary signal (highest weight) is in metadata."""
        risk = callguard.assess(["urgency", "verification_code_request"], use_ai=False)
        
        # verification_code_request has higher weight (35) than urgency (10)
        assert risk.metadata["primary_signal"] == "verification_code_request"
    
    def test_signals_processed_count(self):
        """Test that signals_processed count is correct."""
        risk = callguard.assess(["urgency", "unknown_signal", "bank_impersonation"], use_ai=False)
        
        # Should process 2 valid signals (urgency and bank_impersonation)
        assert risk.metadata["signals_processed"] == 2
        assert risk.metadata["signals_count"] == 3


class TestCallGuardNextAction:
    """Test CallGuard next_action field."""
    
    def test_next_action_present(self):
        """Test that next_action is always present."""
        risk = callguard.assess([], use_ai=False)
        
        assert risk.next_action is not None
        assert len(risk.next_action) > 0
        assert "verify" in risk.next_action.lower() or "caller" in risk.next_action.lower()
    
    def test_next_action_relevant(self):
        """Test that next_action is relevant to the context."""
        risk = callguard.assess(["verification_code_request"], use_ai=False)
        
        assert "verify" in risk.next_action.lower() or "caller" in risk.next_action.lower()

