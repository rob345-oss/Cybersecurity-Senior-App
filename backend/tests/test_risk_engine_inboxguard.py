"""
Comprehensive unit tests for risk_engine/inboxguard.py module.

Tests analyze_text, analyze_url, and helper functions with various scenarios.
"""
import pytest
from backend.risk_engine import inboxguard
from backend.models import RiskResponse


class TestInboxGuardAnalyzeText:
    """Test inboxguard.analyze_text function."""
    
    def test_empty_text(self):
        """Test with empty text."""
        risk = inboxguard.analyze_text("", "email")
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 0
        assert risk.level == "low"
        assert "No obvious red flags detected" in risk.reasons[0]
    
    def test_clean_text_no_flags(self):
        """Test with clean text that has no red flags."""
        text = "Hello, this is a normal message from a friend."
        risk = inboxguard.analyze_text(text, "email")
        
        assert risk.score == 0
        assert risk.level == "low"
        assert "No obvious red flags detected" in risk.reasons[0]
    
    def test_urgency_language(self):
        """Test detection of urgency language."""
        text = "This is urgent! You must act immediately!"
        risk = inboxguard.analyze_text(text, "email")
        
        assert risk.score >= 20
        assert "Urgency language detected" in risk.reasons
    
    def test_payment_terms(self):
        """Test detection of payment-related terms."""
        text = "Please make a payment using wire transfer or gift card."
        risk = inboxguard.analyze_text(text, "email")
        
        assert risk.score >= 20
        assert "Payment request detected" in risk.reasons
    
    def test_otp_terms(self):
        """Test detection of OTP/verification code requests."""
        text = "Please provide the verification code sent to your phone."
        risk = inboxguard.analyze_text(text, "email")
        
        assert risk.score >= 25
        assert "Verification code request detected" in risk.reasons
    
    def test_attachment_mentioned(self):
        """Test detection of attachment mentions."""
        text = "Please open the attachment I sent you."
        risk = inboxguard.analyze_text(text, "email")
        
        assert risk.score >= 10
        assert "Attachment mentioned" in risk.reasons
    
    def test_impersonation_terms(self):
        """Test detection of impersonation terms."""
        test_cases = [
            ("Your IRS account needs verification", "irs"),
            ("Your PayPal account is locked", "paypal"),
            ("Microsoft support needs to access your computer", "microsoft"),
            ("Your bank account has been compromised", "bank"),
            ("USPS delivery notification", "usps"),
            ("FedEx package delivery", "fedex"),
        ]
        
        for text, term in test_cases:
            risk = inboxguard.analyze_text(text, "email")
            assert risk.score >= 20
            assert "Impersonation terms detected" in risk.reasons
    
    def test_suspicious_urls(self):
        """Test detection of suspicious URLs in text."""
        text = "Click here: https://bit.ly/suspicious-link"
        risk = inboxguard.analyze_text(text, "email")
        
        assert risk.score >= 15
        assert "Suspicious URLs detected" in risk.reasons
    
    def test_multiple_flags(self):
        """Test with multiple red flags."""
        text = "URGENT: Verify your PayPal account immediately at https://bit.ly/fake-paypal. Enter the verification code now!"
        risk = inboxguard.analyze_text(text, "email")
        
        assert risk.score >= 40  # Urgency + Payment + OTP + URL
        assert len(risk.reasons) >= 3
    
    def test_channel_parameter(self):
        """Test that channel parameter is stored in metadata."""
        text = "Test message"
        risk = inboxguard.analyze_text(text, "sms")
        
        assert risk.metadata["channel"] == "sms"
        
        risk2 = inboxguard.analyze_text(text, "email")
        assert risk2.metadata["channel"] == "email"
    
    def test_extracted_urls_in_metadata(self):
        """Test that extracted URLs are stored in metadata."""
        text = "Visit https://example.com and https://test.com/path"
        risk = inboxguard.analyze_text(text, "email")
        
        assert "extracted_urls" in risk.metadata
        assert len(risk.metadata["extracted_urls"]) == 2
        assert "https://example.com" in risk.metadata["extracted_urls"]
        assert "https://test.com/path" in risk.metadata["extracted_urls"]
    
    def test_detected_entities_in_metadata(self):
        """Test that detected entities are stored in metadata."""
        text = "Your PayPal and Microsoft accounts need attention"
        risk = inboxguard.analyze_text(text, "email")
        
        assert "detected_entities" in risk.metadata
        assert "paypal" in risk.metadata["detected_entities"]
        assert "microsoft" in risk.metadata["detected_entities"]
    
    def test_recommended_actions_present(self):
        """Test that recommended actions are always present."""
        text = "Normal message"
        risk = inboxguard.analyze_text(text, "email")
        
        assert len(risk.recommended_actions) >= 3
        action_ids = [action.id for action in risk.recommended_actions]
        assert "dont-click" in action_ids
        assert "official-app" in action_ids
        assert "report" in action_ids
    
    def test_next_action_present(self):
        """Test that next_action is always present."""
        text = "Test message"
        risk = inboxguard.analyze_text(text, "email")
        
        assert risk.next_action is not None
        assert len(risk.next_action) > 0
        assert "verify" in risk.next_action.lower() or "avoid" in risk.next_action.lower()
    
    def test_case_insensitive_detection(self):
        """Test that detection is case-insensitive."""
        text1 = "URGENT ACTION REQUIRED"
        text2 = "urgent action required"
        text3 = "Urgent Action Required"
        
        risk1 = inboxguard.analyze_text(text1, "email")
        risk2 = inboxguard.analyze_text(text2, "email")
        risk3 = inboxguard.analyze_text(text3, "email")
        
        # All should detect urgency
        assert risk1.score == risk2.score == risk3.score
        assert risk1.score >= 20


class TestInboxGuardAnalyzeURL:
    """Test inboxguard.analyze_url function."""
    
    def test_clean_url(self):
        """Test with a clean, legitimate URL."""
        url = "https://example.com"
        risk = inboxguard.analyze_url(url)
        
        assert isinstance(risk, RiskResponse)
        assert risk.score == 0
        assert "No obvious URL red flags detected" in risk.reasons[0]
    
    def test_url_shortener(self):
        """Test detection of URL shorteners."""
        test_cases = [
            "https://bit.ly/short",
            "https://tinyurl.com/abc123",
            "https://t.co/xyz",
            "https://goo.gl/test",
            "https://ow.ly/link",
        ]
        
        for url in test_cases:
            risk = inboxguard.analyze_url(url)
            assert risk.score >= 15
            assert "URL shortener used" in risk.reasons
    
    def test_ip_address_in_url(self):
        """Test detection of IP addresses in URLs."""
        url = "http://192.168.1.1/login"
        risk = inboxguard.analyze_url(url)
        
        assert risk.score >= 15
        assert "IP address used in URL" in risk.reasons
    
    def test_multiple_hyphens(self):
        """Test detection of multiple hyphens in domain."""
        url = "https://pay-pal-verify-example.com"
        risk = inboxguard.analyze_url(url)
        
        assert risk.score >= 15
        assert "Multiple hyphens in domain" in risk.reasons
    
    def test_long_subdomain_chain(self):
        """Test detection of long subdomain chains."""
        url = "https://a.b.c.d.example.com"
        risk = inboxguard.analyze_url(url)
        
        assert risk.score >= 15
        assert "Long subdomain chain" in risk.reasons
    
    def test_sensitive_keywords(self):
        """Test detection of sensitive action keywords."""
        test_cases = [
            "https://example.com/login",
            "https://example.com/verify",
            "https://example.com/secure",
            "https://example.com/account",
            "https://example.com/update",
        ]
        
        for url in test_cases:
            risk = inboxguard.analyze_url(url)
            assert risk.score >= 15
            assert "Contains sensitive action keywords" in risk.reasons
    
    def test_punycode_domain(self):
        """Test detection of Punycode domains."""
        url = "http://xn--paypa1-login.example.com"
        risk = inboxguard.analyze_url(url)
        
        assert risk.score >= 15
        assert "Punycode domain detected" in risk.reasons
    
    def test_unusual_tld_length(self):
        """Test detection of unusual TLD length."""
        url = "https://example.verylongtld"
        risk = inboxguard.analyze_url(url)
        
        assert risk.score >= 15
        assert "Unusual TLD length" in risk.reasons
    
    def test_multiple_flags(self):
        """Test URL with multiple red flags."""
        url = "https://bit.ly/pay-pal-login-verify"
        risk = inboxguard.analyze_url(url)
        
        # Should have multiple flags
        assert risk.score >= 15
        assert len(risk.reasons) >= 1
    
    def test_domain_in_metadata(self):
        """Test that domain is stored in metadata."""
        url = "https://example.com/path"
        risk = inboxguard.analyze_url(url)
        
        assert "domain" in risk.metadata
        assert risk.metadata["domain"] == "example.com"
    
    def test_looks_like_spoof_in_metadata(self):
        """Test that spoof detection is stored in metadata."""
        url = "http://xn--paypa1-login.example.com"
        risk = inboxguard.analyze_url(url)
        
        assert "looks_like_spoof" in risk.metadata
        assert risk.metadata["looks_like_spoof"] is True
    
    def test_url_red_flags_in_metadata(self):
        """Test that URL red flags are stored in metadata."""
        url = "https://bit.ly/test"
        risk = inboxguard.analyze_url(url)
        
        assert "url_red_flags" in risk.metadata
        assert isinstance(risk.metadata["url_red_flags"], list)
        assert len(risk.metadata["url_red_flags"]) > 0
    
    def test_recommended_actions_present(self):
        """Test that recommended actions are always present."""
        url = "https://example.com"
        risk = inboxguard.analyze_url(url)
        
        assert len(risk.recommended_actions) >= 2
        action_ids = [action.id for action in risk.recommended_actions]
        assert "manual" in action_ids
        assert "verify-sender" in action_ids
    
    def test_next_action_present(self):
        """Test that next_action is always present."""
        url = "https://example.com"
        risk = inboxguard.analyze_url(url)
        
        assert risk.next_action is not None
        assert len(risk.next_action) > 0
        assert "click" in risk.next_action.lower() or "validate" in risk.next_action.lower()
    
    def test_http_vs_https(self):
        """Test that both HTTP and HTTPS URLs are handled."""
        http_url = "http://example.com"
        https_url = "https://example.com"
        
        risk_http = inboxguard.analyze_url(http_url)
        risk_https = inboxguard.analyze_url(https_url)
        
        # Both should be processed without errors
        assert isinstance(risk_http, RiskResponse)
        assert isinstance(risk_https, RiskResponse)
    
    def test_url_with_path_and_query(self):
        """Test URLs with paths and query parameters."""
        url = "https://example.com/path/to/page?param=value&other=123"
        risk = inboxguard.analyze_url(url)
        
        assert isinstance(risk, RiskResponse)
        assert risk.metadata["domain"] == "example.com"
    
    def test_score_calculation_multiple_flags(self):
        """Test that score increases with multiple flags."""
        # URL with multiple flags
        url = "https://bit.ly/pay-pal-login-verify"
        risk = inboxguard.analyze_url(url)
        
        # Score should be 15 * number of flags
        assert risk.score >= 15
        # Should have at least URL shortener flag
        assert any("shortener" in reason.lower() for reason in risk.reasons)

