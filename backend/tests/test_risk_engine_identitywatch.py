"""
Comprehensive unit tests for risk_engine/identitywatch.py module.

Tests the assess function with various signal combinations and edge cases.
"""
import pytest
from backend.risk_engine import identitywatch
from backend.models import RiskResponse


class TestIdentityWatchAssess:
    """Test identitywatch.assess function."""
    
    def test_no_signals(self):
        """Test assessment with no signals (all False)."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 0
        assert risk.level == "low"
        assert "No high-risk identity signals selected" in risk.reasons
        assert len(risk.recommended_actions) > 0
        assert risk.safe_script is not None
    
    def test_single_signal_password_reset(self):
        """Test with password_reset_unknown signal."""
        signals = {
            "password_reset_unknown": True,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.score == 25
        assert risk.level == "low"
        assert "password reset unknown" in risk.reasons[0].lower()
    
    def test_single_signal_account_opened(self):
        """Test with account_opened signal."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": True,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.score == 40
        assert risk.level == "medium"
        assert "account opened" in risk.reasons[0].lower()
    
    def test_single_signal_suspicious_inquiry(self):
        """Test with suspicious_inquiry signal."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": False,
            "suspicious_inquiry": True,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.score == 40
        assert risk.level == "medium"
        assert "suspicious inquiry" in risk.reasons[0].lower()
    
    def test_single_signal_reused_passwords(self):
        """Test with reused_passwords signal."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": True,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.score == 15
        assert risk.level == "low"
        assert "reused passwords" in risk.reasons[0].lower()
    
    def test_single_signal_clicked_suspicious_link(self):
        """Test with clicked_suspicious_link signal."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": True,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.score == 20
        assert risk.level == "low"
        assert "clicked suspicious link" in risk.reasons[0].lower()
    
    def test_single_signal_ssn_requested(self):
        """Test with ssn_requested_unexpectedly signal."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": True,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.score == 25
        assert risk.level == "low"
        assert "ssn requested unexpectedly" in risk.reasons[0].lower()
    
    def test_multiple_signals_medium_risk(self):
        """Test with multiple signals resulting in medium risk."""
        signals = {
            "password_reset_unknown": True,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": True,
            "clicked_suspicious_link": True,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        # 25 + 15 + 20 = 60
        assert risk.score == 60
        assert risk.level == "medium"
        assert len(risk.reasons) == 3
    
    def test_multiple_signals_high_risk(self):
        """Test with multiple high-weight signals resulting in high risk."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": True,
            "suspicious_inquiry": True,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        # 40 + 40 = 80
        assert risk.score == 80
        assert risk.level == "high"
        assert len(risk.reasons) == 2
    
    def test_all_signals_high_risk(self):
        """Test with all signals enabled."""
        signals = {
            "password_reset_unknown": True,
            "account_opened": True,
            "suspicious_inquiry": True,
            "reused_passwords": True,
            "clicked_suspicious_link": True,
            "ssn_requested_unexpectedly": True,
        }
        
        risk = identitywatch.assess(signals)
        
        # 25 + 40 + 40 + 15 + 20 + 25 = 165, clamped to 100
        assert risk.score == 100
        assert risk.level == "high"
        assert len(risk.reasons) == 6
    
    def test_recommended_actions_present(self):
        """Test that recommended actions are always present."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert len(risk.recommended_actions) == 4
        action_ids = [action.id for action in risk.recommended_actions]
        assert "freeze-credit" in action_ids
        assert "enable-2fa" in action_ids
        assert "change-passwords" in action_ids
        assert "check-credit" in action_ids
    
    def test_safe_script_present(self):
        """Test that safe script is always present."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.safe_script is not None
        assert len(risk.safe_script.say_this) > 0
        assert len(risk.safe_script.if_they_push_back) > 0
    
    def test_metadata_present(self):
        """Test that metadata is present with helpful information."""
        signals = {
            "password_reset_unknown": True,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.metadata is not None
        assert "suggested_freeze_steps" in risk.metadata
        assert "suggested_password_steps" in risk.metadata
        assert "monitoring_steps" in risk.metadata
        assert isinstance(risk.metadata["suggested_freeze_steps"], list)
        assert len(risk.metadata["suggested_freeze_steps"]) > 0
    
    def test_next_action_present(self):
        """Test that next_action is always present."""
        signals = {
            "password_reset_unknown": False,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
        }
        
        risk = identitywatch.assess(signals)
        
        assert risk.next_action is not None
        assert len(risk.next_action) > 0
        assert "credit freeze" in risk.next_action.lower() or "password" in risk.next_action.lower()
    
    def test_unknown_signal_ignored(self):
        """Test that unknown signals in the dict are ignored."""
        signals = {
            "password_reset_unknown": True,
            "account_opened": False,
            "suspicious_inquiry": False,
            "reused_passwords": False,
            "clicked_suspicious_link": False,
            "ssn_requested_unexpectedly": False,
            "unknown_signal": True,  # This should be ignored
        }
        
        risk = identitywatch.assess(signals)
        
        # Should only count password_reset_unknown (25 points)
        assert risk.score == 25
        assert "unknown_signal" not in str(risk.reasons).lower()
    
    def test_empty_signals_dict(self):
        """Test with empty signals dictionary."""
        signals = {}
        
        risk = identitywatch.assess(signals)
        
        assert risk.score == 0
        assert risk.level == "low"
        assert "No high-risk identity signals selected" in risk.reasons[0]

