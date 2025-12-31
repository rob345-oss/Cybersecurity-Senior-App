"""Quick test script to verify validators work correctly"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.main import (
    MoneyGuardAssessRequest,
    InboxGuardURLRequest,
    IdentityWatchProfileRequest,
)
from pydantic import ValidationError

print("Testing validators...")

# Test MoneyGuard amount validation
print("\n1. Testing MoneyGuard amount validation...")
try:
    # Valid amount
    req = MoneyGuardAssessRequest(
        amount=100.50,
        payment_method="zelle",
        recipient="Test",
        reason="Test",
        did_they_contact_you_first=False,
        urgency_present=False,
        asked_to_keep_secret=False,
        asked_for_verification_code=False,
        asked_for_remote_access=False,
        impersonation_type="none",
    )
    print("   [OK] Valid amount (100.50) accepted")
except ValidationError as e:
    print(f"   [FAIL] Valid amount failed: {e}")

try:
    # Negative amount (should fail)
    req = MoneyGuardAssessRequest(
        amount=-10,
        payment_method="zelle",
        recipient="Test",
        reason="Test",
        did_they_contact_you_first=False,
        urgency_present=False,
        asked_to_keep_secret=False,
        asked_for_verification_code=False,
        asked_for_remote_access=False,
        impersonation_type="none",
    )
    print("   [FAIL] Negative amount was accepted (should fail)")
except ValidationError:
    print("   [OK] Negative amount correctly rejected")

try:
    # Too large amount (should fail)
    req = MoneyGuardAssessRequest(
        amount=2000000000,
        payment_method="zelle",
        recipient="Test",
        reason="Test",
        did_they_contact_you_first=False,
        urgency_present=False,
        asked_to_keep_secret=False,
        asked_for_verification_code=False,
        asked_for_remote_access=False,
        impersonation_type="none",
    )
    print("   [FAIL] Too large amount was accepted (should fail)")
except ValidationError:
    print("   [OK] Too large amount correctly rejected")

# Test InboxGuard URL validation
print("\n2. Testing InboxGuard URL validation...")
try:
    # Valid URL
    req = InboxGuardURLRequest(url="https://example.com/path")
    print("   [OK] Valid URL accepted")
except ValidationError as e:
    print(f"   [FAIL] Valid URL failed: {e}")

try:
    # Invalid URL without scheme
    req = InboxGuardURLRequest(url="example.com")
    print("   [FAIL] URL without scheme was accepted (should fail)")
except ValidationError:
    print("   [OK] URL without scheme correctly rejected")

try:
    # Invalid URL without domain
    req = InboxGuardURLRequest(url="https://")
    print("   [FAIL] URL without domain was accepted (should fail)")
except ValidationError:
    print("   [OK] URL without domain correctly rejected")

try:
    # Empty URL
    req = InboxGuardURLRequest(url="")
    print("   [FAIL] Empty URL was accepted (should fail)")
except ValidationError:
    print("   [OK] Empty URL correctly rejected")

# Test IdentityWatch email/phone validation
print("\n3. Testing IdentityWatch email validation...")
try:
    # Valid emails
    req = IdentityWatchProfileRequest(
        emails=["test@example.com", "user@domain.co.uk"],
        phones=["+1234567890", "555-123-4567"],
    )
    print("   [OK] Valid emails accepted")
except ValidationError as e:
    print(f"   [FAIL] Valid emails failed: {e}")

try:
    # Invalid email
    req = IdentityWatchProfileRequest(
        emails=["invalid-email"],
        phones=["+1234567890"],
    )
    print("   [FAIL] Invalid email was accepted (should fail)")
except ValidationError:
    print("   [OK] Invalid email correctly rejected")

try:
    # Empty email
    req = IdentityWatchProfileRequest(
        emails=[""],
        phones=["+1234567890"],
    )
    print("   [FAIL] Empty email was accepted (should fail)")
except ValidationError:
    print("   [OK] Empty email correctly rejected")

print("\n4. Testing IdentityWatch phone validation...")
try:
    # Valid phones
    req = IdentityWatchProfileRequest(
        emails=["test@example.com"],
        phones=["+1234567890", "(555) 123-4567", "555-123-4567"],
    )
    print("   [OK] Valid phone numbers accepted")
except ValidationError as e:
    print(f"   [FAIL] Valid phones failed: {e}")

try:
    # Invalid phone (too short)
    req = IdentityWatchProfileRequest(
        emails=["test@example.com"],
        phones=["123"],
    )
    print("   [FAIL] Too short phone was accepted (should fail)")
except ValidationError:
    print("   [OK] Too short phone correctly rejected")

try:
    # Empty phone
    req = IdentityWatchProfileRequest(
        emails=["test@example.com"],
        phones=[""],
    )
    print("   [FAIL] Empty phone was accepted (should fail)")
except ValidationError:
    print("   [OK] Empty phone correctly rejected")

try:
    # Empty lists
    req = IdentityWatchProfileRequest(
        emails=[],
        phones=[],
    )
    print("   [FAIL] Empty lists were accepted (should fail)")
except ValidationError:
    print("   [OK] Empty lists correctly rejected")

print("\n[SUCCESS] All validator tests completed!")

