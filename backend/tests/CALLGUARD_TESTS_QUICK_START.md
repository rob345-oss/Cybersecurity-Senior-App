# CallGuard Tests - Quick Start Guide

## 🚀 Fastest Way to Test

Run the simple test suite (no dependencies needed):

```bash
python backend/tests/test_callguard_simple.py
```

This runs 10 essential tests and shows results immediately.

## 📋 All Test Options

### 1. Simple Test Suite (Recommended for Quick Check)
```bash
python backend/tests/test_callguard_simple.py
```
- ✅ No dependencies required
- ✅ Fast execution
- ✅ Clear output
- ✅ 10 essential tests

### 2. Full Test Suite with pytest
```bash
# Install pytest first
pip install pytest

# Run all tests
pytest backend/tests/test_callguard.py -v

# Run specific test class
pytest backend/tests/test_callguard.py::TestRuleBasedAssessment -v

# Run with coverage
pytest backend/tests/test_callguard.py --cov=backend.risk_engine.callguard -v
```

### 3. Test Runner Script
```bash
python backend/tests/run_callguard_tests.py
```

## 🧪 What Gets Tested

### Core Functionality
- ✅ Rule-based risk assessment
- ✅ Signal weight calculations
- ✅ Score clamping (0-100)
- ✅ Risk level determination (low/medium/high)

### Input Validation
- ✅ Empty signals handling
- ✅ Invalid input types
- ✅ Call context variations
- ✅ Edge cases

### Response Structure
- ✅ Safe script generation
- ✅ Recommended actions
- ✅ Metadata structure
- ✅ Reasons formatting

### Real-World Scenarios
- ✅ Bank impersonation scams
- ✅ Tech support scams
- ✅ Gift card scams
- ✅ Legitimate calls

## 📊 Expected Output

### Simple Test Suite Output
```
============================================================
CallGuard Test Suite
============================================================

[Test 1] Testing basic assessment with verification code request...
✓ Passed: Score=35, Level=medium

[Test 2] Testing with empty signals...
✓ Passed: Score=0, Level=low

...

============================================================
Results: 10 passed, 0 failed out of 10 tests
============================================================
```

### pytest Output
```
test_callguard.py::TestRuleBasedAssessment::test_high_risk_verification_code_request PASSED
test_callguard.py::TestRuleBasedAssessment::test_multiple_high_risk_signals PASSED
...
```

## 🔧 Troubleshooting

### "ModuleNotFoundError: No module named 'backend'"
Make sure you're running from the project root:
```bash
cd /path/to/Cybersecurity-Senior-App
python backend/tests/test_callguard_simple.py
```

### "pytest: command not found"
Install pytest:
```bash
pip install pytest
```

### Tests Fail
1. Check that `callguard.py` is in `backend/risk_engine/`
2. Verify all dependencies are installed
3. Ensure you're using Python 3.8+

## 📝 Test Files

- `test_callguard_simple.py` - Simple tests, no dependencies
- `test_callguard.py` - Comprehensive pytest suite
- `run_callguard_tests.py` - Test runner script
- `TEST_CALLGUARD_README.md` - Detailed documentation

## 💡 Tips

1. **Start with simple tests**: Run `test_callguard_simple.py` first
2. **Use `use_ai=False`**: Tests use rule-based system for consistency
3. **Check specific scenarios**: Each test focuses on one aspect
4. **Read test names**: They describe what's being tested

## 🎯 Quick Test Checklist

Run these to verify everything works:

```bash
# 1. Basic functionality
python backend/tests/test_callguard_simple.py

# 2. If you have pytest, run full suite
pytest backend/tests/test_callguard.py -v

# 3. Test specific scenario
pytest backend/tests/test_callguard.py::TestIntegrationScenarios::test_bank_scam_scenario -v
```

All tests should pass! ✅

