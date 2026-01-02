#!/usr/bin/env python3
"""
Simple test runner for CallGuard tests.

Run this script to execute all CallGuard tests:
    python backend/tests/run_callguard_tests.py

Or run specific test classes:
    python backend/tests/run_callguard_tests.py TestRuleBasedAssessment
"""

import sys
from pathlib import Path

# Add project root to path
# run_callguard_tests.py is in backend/tests/
# So we need to go up 2 levels to get to project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pytest

if __name__ == "__main__":
    # Get test file path
    test_file = Path(__file__).parent / "test_callguard.py"
    
    # Run tests
    args = [str(test_file), "-v", "--tb=short"]
    
    # If specific test class provided as argument
    if len(sys.argv) > 1:
        args.append(f"-k={sys.argv[1]}")
    
    exit_code = pytest.main(args)
    sys.exit(exit_code)

