# CallGuard Test Suite

This directory contains comprehensive tests for the CallGuard risk assessment system.

## Quick Start

### Option 1: Simple Test Runner (No Dependencies)
Run the simple test suite that doesn't require pytest:

```bash
python backend/tests/test_callguard_simple.py
```

This will run 10 basic tests and show results immediately.

### Option 2: Full Test Suite with pytest
Run the comprehensive test suite:

```bash
# Install pytest if not already installed
pip install pytest

# Run all tests
pytest backend/tests/test_callguard.py -v

# Run specific test class
pytest backend/tests/test_callguard.py::TestRuleBasedAssessment -v

# Run specific test
pytest backend/tests/test_callguard.py::TestRuleBasedAssessment::test_high_risk_verification_code_request -v
```

### Option 3: Using the Test Runner Script
```bash
python backend/tests/run_callguard_tests.py

# Run specific test class
python backend/tests/run_callguard_tests.py TestRuleBasedAssessment
```

## Test Coverage

### TestRuleBasedAssessment
Tests the rule-based fallback system:
- High-risk signal detection
- Multiple signal accumulation
- Low-risk scenarios
- Empty signals handling
- Safe script generation
- Recommended actions

### TestInputValidation
Tests input validation and edge cases:
- Empty signals
- Invalid signal types
- Call context variations
- None values handling

### TestHelperFunctions
Tests internal helper functions:
- Context building
- Signal formatting
- JSON parsing
- Safe script creation
- Action conversion

### TestErrorHandling
Tests error handling and graceful degradation:
- AI service failures
- Fallback mechanisms
- Error recovery

### TestResponseStructure
Tests response data integrity:
- Required fields presence
- Score clamping (0-100)
- Metadata structure
- Reasons formatting

### TestSignalWeights
Tests signal weight calculations:
- Weight accumulation
- Highest signal identification
- Known signals validation

### TestIntegrationScenarios
Real-world scenario tests:
- Bank impersonation scams
- Tech support scams
- Gift card scams
- Legitimate calls

## Expected Test Results

All tests should pass when:
- The `callguard.py` module is properly implemented
- Dependencies are installed
- No AI services are required (tests use `use_ai=False`)

## Test Output Example

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

## Troubleshooting

### Import Errors
If you get import errors, make sure you're running from the project root:
```bash
cd /path/to/Cybersecurity-Senior-App
python backend/tests/test_callguard_simple.py
```

### Module Not Found
Ensure the project root is in your Python path. The test files handle this automatically, but if issues persist:
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### pytest Not Found
Install pytest:
```bash
pip install pytest
```

## Adding New Tests

To add new tests, edit `test_callguard.py` and add test functions following the pattern:

```python
def test_your_new_test():
    """Test description."""
    signals = ["signal1", "signal2"]
    response = callguard.assess(signals, use_ai=False)
    
    assert response.score >= expected_score
    assert response.level == "expected_level"
```

## Test Philosophy

These tests focus on:
1. **Deterministic behavior**: Using `use_ai=False` for consistent results
2. **Edge cases**: Empty inputs, invalid data, boundary conditions
3. **Real-world scenarios**: Common scam patterns
4. **Data integrity**: Response structure and validation
5. **Error handling**: Graceful degradation

Tests do NOT require:
- OpenAI API keys
- Internet connection
- AI service availability

This ensures tests are fast, reliable, and can run in CI/CD pipelines.

