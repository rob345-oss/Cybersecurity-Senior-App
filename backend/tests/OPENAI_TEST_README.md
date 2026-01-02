# OpenAI API Key Integration Test

This test suite verifies that your OpenAI API key is working and that the AI agent can successfully process requests.

## Quick Start

1. **Set your OpenAI API key:**
   
   **Windows (PowerShell):**
   ```powershell
   $env:OPENAI_API_KEY='sk-your-api-key-here'
   ```
   
   **Windows (CMD):**
   ```cmd
   set OPENAI_API_KEY=sk-your-api-key-here
   ```
   
   **Linux/Mac:**
   ```bash
   export OPENAI_API_KEY='sk-your-api-key-here'
   ```

2. **Run the test:**
   ```bash
   python backend/tests/test_openai_integration.py
   ```

## What This Test Does

The test suite performs 5 comprehensive checks:

1. **API Key Check** - Verifies that `OPENAI_API_KEY` environment variable is set
2. **LLM Initialization** - Tests that the OpenAI LLM can be initialized with your key
3. **Simple API Call** - Makes a basic OpenAI API call to verify the key works
4. **AI Agent Assessment** - Tests the full AI agent with a realistic scam scenario
5. **Context Understanding** - Verifies the AI can understand context and provide nuanced analysis

## Expected Output

When your API key is working correctly, you should see:

```
======================================================================
OpenAI API Key Integration Test Suite
======================================================================

[Test 1] Checking if OPENAI_API_KEY is set...
[PASS] OPENAI_API_KEY is set (length: 51 chars)

[Test 2] Testing OpenAI LLM initialization...
[PASS] OpenAI LLM initialized successfully

[Test 3] Making a simple OpenAI API call...
[PASS] OpenAI API call successful!

[Test 4] Testing AI agent with real risk assessment...
[PASS] AI agent successfully processed the assessment!

[Test 5] Testing AI agent's context understanding...
[PASS] AI correctly identified high-risk scenario from context!

[SUCCESS] Your OpenAI API key is working! The AI agent is functional.
```

## Troubleshooting

### "OPENAI_API_KEY not set"
- Make sure you've set the environment variable before running the test
- On Windows, use PowerShell or CMD as shown above
- Verify the key starts with `sk-`

### "LLM initialization returned None"
- Check that `langchain-openai` is installed: `pip install langchain-openai`
- Verify your API key is valid
- Ensure you have internet connectivity

### "AI was not used - fell back to rule-based system"
- This means the API key isn't working or LLM initialization failed
- Check the previous test results to see where it failed
- Verify your API key has credits/usage available

### "UnicodeEncodeError" on Windows
- This has been fixed in the latest version
- If you still see this, ensure you're using the latest test file

## Requirements

- Python 3.8+
- `langchain-openai` package installed
- Valid OpenAI API key with credits
- Internet connectivity

## What Makes This a "True AI Agent" Test?

Unlike simple API connectivity tests, this suite verifies:

1. **Actual AI Processing** - Makes real calls to OpenAI's language model
2. **Context Understanding** - Tests that the AI can analyze call transcripts and understand nuance
3. **Intelligent Responses** - Verifies the AI provides meaningful, context-aware risk assessments
4. **Multi-step Reasoning** - Tests the AI's ability to process complex scenarios with multiple signals

The test uses realistic scam scenarios that require the AI to:
- Understand natural language in call transcripts
- Identify threat patterns beyond simple keyword matching
- Provide nuanced risk assessments based on context
- Generate appropriate safe scripts and recommendations

This demonstrates that your integration is truly using AI capabilities, not just rule-based fallbacks.

