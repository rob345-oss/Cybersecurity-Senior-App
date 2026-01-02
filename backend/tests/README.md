# Backend Tests

This directory contains comprehensive test suites for the backend API and risk engine modules.

## Test Structure

### Unit Tests

- **`test_risk_engine_base.py`** - Tests for base utility functions (clamp_score, score_to_level, build_risk_response)
- **`test_risk_engine_callguard.py`** - Tests for CallGuard module (rule-based, AI fallback, input validation)
- **`test_risk_engine_identitywatch.py`** - Tests for IdentityWatch module (signal combinations, edge cases)
- **`test_risk_engine_inboxguard.py`** - Tests for InboxGuard module (text analysis, URL analysis, helpers)
- **`test_risk_engine_moneyguard.py`** - Tests for MoneyGuard module (payment scenarios, safe_steps)

### Integration Tests

- **`test_api_integration.py`** - Core integration tests for API endpoints, edge cases, and session management
- **`test_api_integration_extended.py`** - Extended integration tests for additional scenarios, error handling, and edge cases

### Other Tests

- **`test_callguard_simple.py`** - Simple CallGuard tests
- **`test_callguard.py`** - Additional CallGuard tests
- **`test_validators.py`** - Input validation tests

## Running Tests

### Run all tests
```bash
pytest
```

### Run specific test file
```bash
pytest backend/tests/test_risk_engine_base.py
```

### Run with coverage
```bash
pytest --cov=backend --cov-report=html
```

### Run with verbose output
```bash
pytest -v
```

### Run specific test class or function
```bash
pytest backend/tests/test_risk_engine_base.py::TestClampScore
pytest backend/tests/test_risk_engine_base.py::TestClampScore::test_clamp_score_within_bounds
```

## Test Coverage

The test suite provides comprehensive coverage for:

- ✅ All risk engine modules (base, callguard, identitywatch, inboxguard, moneyguard)
- ✅ All API endpoints (session management, MoneyGuard, InboxGuard, IdentityWatch)
- ✅ Input validation and sanitization
- ✅ Error handling and edge cases
- ✅ Session lifecycle management
- ✅ Response structure validation
- ✅ XSS prevention and security

## Requirements

Tests require the following dependencies (already in `requirements.txt`):
- pytest >= 7.4.0
- fastapi (for TestClient)
- All backend dependencies

## Notes

- Tests use a fresh MemoryStore instance for each test to ensure isolation
- Some tests mock AI dependencies (LangChain, CrewAI) to test fallback behavior
- Integration tests require proper authentication headers (API key from environment)

