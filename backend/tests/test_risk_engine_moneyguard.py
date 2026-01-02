"""
Comprehensive unit tests for risk_engine/moneyguard.py module.

Tests assess function and safe_steps function with various payment scenarios.
"""
import pytest
from backend.risk_engine import moneyguard
from backend.models import RiskResponse


class TestMoneyGuardAssess:
    """Test moneyguard.assess function."""
    
    def test_minimal_payload(self):
        """Test with minimal valid payload."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "John Doe",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 0
        assert risk.level == "low"
        assert "No high-risk indicators detected" in risk.reasons[0]
    
    def test_gift_card_payment_method(self):
        """Test with gift card payment method."""
        payload = {
            "amount": 500.0,
            "payment_method": "gift_card",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 40
        assert risk.level == "medium"
        assert "gift card" in risk.reasons[0].lower()
    
    def test_crypto_payment_method(self):
        """Test with crypto payment method."""
        payload = {
            "amount": 500.0,
            "payment_method": "crypto",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 35
        assert risk.level == "medium"
        assert "crypto" in risk.reasons[0].lower()
    
    def test_wire_payment_method(self):
        """Test with wire payment method."""
        payload = {
            "amount": 500.0,
            "payment_method": "wire",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 25
        assert risk.level == "low"
        assert "wire" in risk.reasons[0].lower()
    
    def test_verification_code_flag(self):
        """Test with asked_for_verification_code flag."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "asked_for_verification_code": True,
            },
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 35
        assert risk.level == "medium"
        assert "verification code" in risk.reasons[0].lower()
    
    def test_remote_access_flag(self):
        """Test with asked_for_remote_access flag."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "asked_for_remote_access": True,
            },
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 30
        assert risk.level == "low"
        assert "remote access" in risk.reasons[0].lower()
    
    def test_keep_secret_flag(self):
        """Test with asked_to_keep_secret flag."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "asked_to_keep_secret": True,
            },
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 20
        assert risk.level == "low"
        assert "keep it secret" in risk.reasons[0].lower()
    
    def test_urgency_flag(self):
        """Test with urgency_present flag."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "urgency_present": True,
            },
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 15
        assert risk.level == "low"
        assert "urgency" in risk.reasons[0].lower()
    
    def test_bank_impersonation(self):
        """Test with bank impersonation type."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "impersonation_type": "bank",
            },
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 15
        assert risk.level == "low"
        assert "bank" in risk.reasons[0].lower()
    
    def test_government_impersonation(self):
        """Test with government impersonation type."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "impersonation_type": "government",
            },
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 15
        assert risk.level == "low"
        assert "government" in risk.reasons[0].lower()
    
    def test_tech_support_impersonation(self):
        """Test with tech_support impersonation type."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "impersonation_type": "tech_support",
            },
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score == 15
        assert risk.level == "low"
        assert "tech support" in risk.reasons[0].lower()
    
    def test_large_amount_contacted_first(self):
        """Test with large amount and they contacted you first."""
        payload = {
            "amount": 1000.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": True,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.score >= 15
        assert "contacted you first" in risk.reasons[0].lower()
    
    def test_multiple_flags_high_risk(self):
        """Test with multiple flags resulting in high risk."""
        payload = {
            "amount": 500.0,
            "payment_method": "gift_card",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": True,
            "flags": {
                "asked_for_verification_code": True,
                "asked_for_remote_access": True,
                "asked_to_keep_secret": True,
                "urgency_present": True,
                "impersonation_type": "bank",
            },
        }
        
        risk = moneyguard.assess(payload)
        
        # 40 (gift_card) + 15 (large amount + contacted) + 35 (verification) + 
        # 30 (remote access) + 20 (secret) + 15 (urgency) + 15 (bank) = 170, clamped to 100
        assert risk.score == 100
        assert risk.level == "high"
        assert len(risk.reasons) >= 6
    
    def test_recommended_actions_present(self):
        """Test that recommended actions are always present."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        assert len(risk.recommended_actions) == 3
        action_ids = [action.id for action in risk.recommended_actions]
        assert "pause-payment" in action_ids
        assert "call-bank" in action_ids
        assert "no-otp" in action_ids
    
    def test_safe_script_present(self):
        """Test that safe script is always present."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.safe_script is not None
        assert len(risk.safe_script.say_this) > 0
        assert len(risk.safe_script.if_they_push_back) > 0
    
    def test_metadata_present(self):
        """Test that metadata is present."""
        payload = {
            "amount": 500.0,
            "payment_method": "gift_card",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "impersonation_type": "bank",
            },
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.metadata is not None
        assert risk.metadata["amount"] == 500.0
        assert risk.metadata["payment_method"] == "gift_card"
        assert risk.metadata["impersonation_type"] == "bank"
    
    def test_next_action_present(self):
        """Test that next_action is always present."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        assert risk.next_action is not None
        assert len(risk.next_action) > 0
        assert "verify" in risk.next_action.lower()
    
    def test_zero_amount(self):
        """Test with zero amount."""
        payload = {
            "amount": 0.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        # Should not trigger large amount flag
        assert risk.score == 0 or risk.score < 15
    
    def test_amount_below_threshold(self):
        """Test with amount below large amount threshold."""
        payload = {
            "amount": 400.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": True,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        # Should not trigger large amount flag (threshold is 500)
        assert "contacted you first" not in str(risk.reasons).lower()
    
    def test_unknown_payment_method(self):
        """Test with unknown payment method."""
        payload = {
            "amount": 100.0,
            "payment_method": "unknown_method",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {},
        }
        
        risk = moneyguard.assess(payload)
        
        # Should not add points for unknown payment method
        assert risk.score == 0
    
    def test_unknown_impersonation_type(self):
        """Test with unknown impersonation type."""
        payload = {
            "amount": 100.0,
            "payment_method": "zelle",
            "recipient": "Recipient",
            "reason": "Payment",
            "did_they_contact_you_first": False,
            "flags": {
                "impersonation_type": "unknown_type",
            },
        }
        
        risk = moneyguard.assess(payload)
        
        # Should not add points for unknown impersonation type
        assert risk.score == 0


class TestMoneyGuardSafeSteps:
    """Test moneyguard.safe_steps function."""
    
    def test_safe_steps_structure(self):
        """Test that safe_steps returns correct structure."""
        result = moneyguard.safe_steps()
        
        assert isinstance(result, dict)
        assert "checklist" in result
        assert "scripts" in result
        assert isinstance(result["checklist"], list)
        assert isinstance(result["scripts"], list)
    
    def test_checklist_items(self):
        """Test that checklist contains expected items."""
        result = moneyguard.safe_steps()
        
        assert len(result["checklist"]) >= 3
        checklist_ids = [item["id"] for item in result["checklist"]]
        assert "pause" in checklist_ids
        assert "verify" in checklist_ids
        assert "invoice" in checklist_ids
    
    def test_checklist_item_structure(self):
        """Test that checklist items have correct structure."""
        result = moneyguard.safe_steps()
        
        for item in result["checklist"]:
            assert "id" in item
            assert "title" in item
            assert "detail" in item
            assert isinstance(item["id"], str)
            assert isinstance(item["title"], str)
            assert isinstance(item["detail"], str)
    
    def test_scripts_items(self):
        """Test that scripts contain expected items."""
        result = moneyguard.safe_steps()
        
        assert len(result["scripts"]) >= 2
        script_ids = [item["id"] for item in result["scripts"]]
        assert "delay" in script_ids
        assert "no-otp" in script_ids
    
    def test_scripts_item_structure(self):
        """Test that script items have correct structure."""
        result = moneyguard.safe_steps()
        
        for item in result["scripts"]:
            assert "id" in item
            assert "title" in item
            assert "detail" in item
            assert isinstance(item["id"], str)
            assert isinstance(item["title"], str)
            assert isinstance(item["detail"], str)

