# Titanium Guardian API

## OpenAPI/Swagger Documentation

The API includes automatically generated OpenAPI/Swagger documentation that provides an interactive interface to explore and test all endpoints.

### Accessing the Documentation

When the backend server is running, you can access the documentation at:

- **Swagger UI**: `http://localhost:8000/docs` (or your server URL + `/docs`)
  - Interactive API explorer with "Try it out" functionality
  - Allows you to test endpoints directly from the browser
  - Shows request/response schemas, examples, and validation rules

- **ReDoc**: `http://localhost:8000/redoc` (or your server URL + `/redoc`)
  - Alternative documentation interface with a clean, readable layout
  - Better for reading and understanding the API structure

- **OpenAPI JSON Schema**: `http://localhost:8000/openapi.json`
  - Raw OpenAPI 3.0 specification in JSON format
  - Can be imported into API clients like Postman, Insomnia, or used for code generation

### Features

The OpenAPI documentation includes:
- Complete endpoint descriptions and parameters
- Request/response schemas with validation rules
- Authentication requirements
- Example requests and responses
- Error response codes and formats

**Note**: The interactive documentation requires API key authentication. Set your API key in the Swagger UI by clicking the "Authorize" button and entering your API key.

## Authentication

All API endpoints require authentication using an API key passed in the `X-API-Key` header.

### Setup

1. **Backend**: Set the `API_KEY` environment variable:
   ```bash
   export API_KEY=your-secret-api-key-here
   ```
   Or create a `.env` file in the backend directory:
   ```
   API_KEY=your-secret-api-key-here
   ```

2. **Frontend**: Set the `VITE_API_KEY` environment variable to match the backend API key:
   ```bash
   export VITE_API_KEY=your-secret-api-key-here
   ```
   Or create a `.env` file in the frontend directory:
   ```
   VITE_API_KEY=your-secret-api-key-here
   ```

### Request Headers

All requests must include:
```
X-API-Key: your-secret-api-key-here
Content-Type: application/json
```

### Error Responses

- **401 Unauthorized**: Missing API key header
- **403 Forbidden**: Invalid API key

### Development Mode

If `API_KEY` is not set in the backend environment, authentication is disabled (for development only). This should never be used in production.

## Shared Models

### RiskResponse
```json
{
  "score": 72,
  "level": "high",
  "reasons": ["Signal detected: verification code request"],
  "next_action": "Verify the caller using an official phone number before sharing anything.",
  "recommended_actions": [
    {"id": "pause-call", "title": "Pause and verify", "detail": "Take a breath, avoid sharing info, and verify the caller independently."}
  ],
  "safe_script": {
    "say_this": "I never share verification codes.",
    "if_they_push_back": "Without that, I can't proceed. Goodbye."
  },
  "metadata": {}
}
```

## Core Session Endpoints

### POST /v1/session/start
Start a module session.

**Request**
```json
{
  "user_id": "e4b0b56a-1e45-4cbe-b13d-7e04c3942b5c",
  "device_id": "ios-simulator",
  "module": "callguard",
  "context": {
    "caller": "Unknown"
  }
}
```

**Response**
```json
{"session_id": "c11c1f9b-39fd-4cb6-b8d8-8f5bf94c9c5b"}
```

### POST /v1/session/{session_id}/event
Append an event and return current risk.

**Request**
```json
{
  "type": "signal",
  "payload": {"signal_key": "verification_code_request"},
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response** (200 OK)
```json
{
  "score": 72,
  "level": "high",
  "reasons": [
    "Signal detected: verification_code_request",
    "High-risk signal: verification code request detected"
  ],
  "next_action": "Verify the caller using an official phone number before sharing anything.",
  "recommended_actions": [
    {
      "id": "pause-call",
      "title": "Pause and verify",
      "detail": "Take a breath, avoid sharing info, and verify the caller independently."
    }
  ],
  "safe_script": {
    "say_this": "I never share verification codes.",
    "if_they_push_back": "Without that, I can't proceed. Goodbye."
  },
  "metadata": {}
}
```

**Error Responses**
- `404 Not Found`: Session not found
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key

### POST /v1/session/{session_id}/end
End a session and return a summary.

**Request**: None (session_id in URL path)

**Response** (200 OK)
```json
{
  "session_id": "c11c1f9b-39fd-4cb6-b8d8-8f5bf94c9c5b",
  "module": "callguard",
  "created_at": "2024-01-01T12:00:00Z",
  "last_risk": {
    "score": 70,
    "level": "high",
    "reasons": [
      "Signal detected: verification_code_request"
    ],
    "next_action": "Verify the caller using an official phone number before sharing anything.",
    "recommended_actions": [
      {
        "id": "pause-call",
        "title": "Pause and verify",
        "detail": "Take a breath, avoid sharing info, and verify the caller independently."
      }
    ],
    "safe_script": {
      "say_this": "I never share verification codes.",
      "if_they_push_back": "Without that, I can't proceed. Goodbye."
    },
    "metadata": {}
  },
  "key_takeaways": [
    "Signal detected: verification code request"
  ]
}
```

**Error Responses**
- `404 Not Found`: Session not found or no risk score available
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key

### GET /v1/session/{session_id}
Fetch events and latest risk.

**Request**: None (session_id in URL path)

**Response** (200 OK)
```json
{
  "events": [
    {
      "id": "event-1",
      "type": "signal",
      "payload": {"signal_key": "urgency"},
      "timestamp": "2024-01-01T12:00:00Z"
    },
    {
      "id": "event-2",
      "type": "signal",
      "payload": {"signal_key": "verification_code_request"},
      "timestamp": "2024-01-01T12:05:00Z"
    }
  ],
  "last_risk": {
    "score": 72,
    "level": "high",
    "reasons": [
      "Signal detected: verification_code_request"
    ],
    "next_action": "Verify the caller using an official phone number before sharing anything.",
    "recommended_actions": [
      {
        "id": "pause-call",
        "title": "Pause and verify",
        "detail": "Take a breath, avoid sharing info, and verify the caller independently."
      }
    ],
    "safe_script": {
      "say_this": "I never share verification codes.",
      "if_they_push_back": "Without that, I can't proceed. Goodbye."
    },
    "metadata": {}
  }
}
```

**Error Responses**
- `404 Not Found`: Session not found
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key

## CallGuard
Use core session endpoints with event types:
- `signal` payload: `{signal_key: str, phone_number?: str, free_text?: str}`
- `note` payload: `{text: str}`

## MoneyGuard

### POST /v1/moneyguard/assess
Assess the risk level of a payment request.

**Request**
```json
{
  "amount": 950,
  "payment_method": "gift_card",
  "recipient": "Vendor",
  "reason": "Invoice",
  "did_they_contact_you_first": true,
  "urgency_present": true,
  "asked_to_keep_secret": true,
  "asked_for_verification_code": true,
  "asked_for_remote_access": false,
  "impersonation_type": "bank",
  "session_id": "c11c1f9b-39fd-4cb6-b8d8-8f5bf94c9c5b"
}
```

**Response** (200 OK)
```json
{
  "score": 85,
  "level": "high",
  "reasons": [
    "Payment method: gift_card (high-risk)",
    "Red flag: urgency present",
    "Red flag: asked to keep secret",
    "Red flag: verification code requested",
    "Red flag: they contacted you first",
    "Impersonation type: bank"
  ],
  "next_action": "Do not proceed with this payment. Verify the request through official channels before taking any action.",
  "recommended_actions": [
    {
      "id": "pause",
      "title": "Pause the payment",
      "detail": "Give yourself time to verify the request."
    },
    {
      "id": "verify",
      "title": "Verify independently",
      "detail": "Use an official number or app to confirm the request."
    }
  ],
  "safe_script": null,
  "metadata": {
    "payment_method": "gift_card",
    "amount": 950
  }
}
```

**Error Responses**
- `400 Bad Request`: Invalid input (e.g., amount out of range 0-1,000,000,000)
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key
- `500 Internal Server Error`: Server error during assessment

### POST /v1/moneyguard/safe_steps
Get recommended safe steps and scripts for payment verification.

**Request**
```json
{
  "session_id": "c11c1f9b-39fd-4cb6-b8d8-8f5bf94c9c5b"
}
```

**Response** (200 OK)
```json
{
  "checklist": [
    {
      "id": "pause",
      "title": "Pause the payment",
      "detail": "Give yourself time to verify the request."
    },
    {
      "id": "verify",
      "title": "Verify independently",
      "detail": "Use an official number or app to confirm the request."
    },
    {
      "id": "invoice",
      "title": "Ask for documentation",
      "detail": "Request a written invoice and validate the business directly."
    }
  ],
  "scripts": [
    {
      "id": "delay",
      "title": "Delay script",
      "detail": "I need to verify this request first. I'll follow up shortly."
    },
    {
      "id": "no-otp",
      "title": "No OTP script",
      "detail": "I don't share verification codes with anyone."
    }
  ]
}
```

**Error Responses**
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key

## InboxGuard

### POST /v1/inboxguard/analyze_text
Analyze text content from email, SMS, or other messaging channels for phishing and scam indicators.

**Request**
```json
{
  "text": "Final notice, verify now",
  "channel": "sms"
}
```

**Valid channel values**: `"email"`, `"sms"`, `"whatsapp"`, `"other"`

**Response** (200 OK)
```json
{
  "score": 65,
  "level": "high",
  "reasons": [
    "Phishing term detected: verify",
    "Urgency language detected: final notice",
    "Channel: SMS (higher risk)"
  ],
  "next_action": "Do not click any links or provide personal information. Verify the message through official channels.",
  "recommended_actions": [
    {
      "id": "verify-sender",
      "title": "Verify the sender",
      "detail": "Contact the organization directly using official contact information."
    },
    {
      "id": "don't-click",
      "title": "Don't click links",
      "detail": "Avoid clicking any links in suspicious messages."
    }
  ],
  "safe_script": null,
  "metadata": {
    "channel": "sms",
    "detected_terms": ["verify", "final notice"]
  }
}
```

**Error Responses**
- `400 Bad Request`: Invalid input (e.g., empty text)
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key
- `500 Internal Server Error`: Server error during analysis

### POST /v1/inboxguard/analyze_url
Analyze a URL for suspicious characteristics, shortened links, and potential phishing indicators.

**Request**
```json
{
  "url": "https://bit.ly/example"
}
```

**Response** (200 OK)
```json
{
  "score": 55,
  "level": "medium",
  "reasons": [
    "Shortened URL detected: bit.ly",
    "Cannot verify destination domain"
  ],
  "next_action": "Avoid clicking shortened URLs. If you must access, use a URL expander service first to see the destination.",
  "recommended_actions": [
    {
      "id": "expand-url",
      "title": "Expand URL first",
      "detail": "Use a URL expander to see the actual destination before clicking."
    },
    {
      "id": "verify-domain",
      "title": "Verify domain",
      "detail": "Check if the destination domain matches the expected organization."
    }
  ],
  "safe_script": null,
  "metadata": {
    "url_type": "shortened",
    "shortener_service": "bit.ly"
  }
}
```

**Error Responses**
- `400 Bad Request`: Invalid URL format (must include http:// or https:// scheme and valid domain)
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key
- `500 Internal Server Error`: Server error during URL analysis

## IdentityWatch

### POST /v1/identitywatch/profile
Create a new identity profile to monitor for identity theft and account compromise signals.

**Request**
```json
{
  "emails": ["user@example.com", "user.alt@example.com"],
  "phones": ["+15551234567", "555-987-6543"],
  "full_name": "Alex Chen",
  "state": "CA"
}
```

**Validation Rules**:
- At least one email is required (must be valid email format)
- At least one phone number is required (must be 10-20 characters)
- `full_name` and `state` are optional

**Response** (200 OK)
```json
{
  "profile_id": "profile-1",
  "created": "2024-01-01T12:00:00Z"
}
```

**Error Responses**
- `400 Bad Request`: Invalid input (e.g., invalid email format, invalid phone format, empty arrays)
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key

### POST /v1/identitywatch/check_risk
Check identity risk based on security signals and events for a profile.

**Request**
```json
{
  "profile_id": "profile-1",
  "signals": {
    "account_opened": true,
    "suspicious_inquiry": false,
    "password_reset_unknown": true,
    "new_device_login": false,
    "address_change": false,
    "credit_freeze_request": false
  }
}
```

**Available signals** (all boolean values):
- `account_opened`: New account opened in your name
- `suspicious_inquiry`: Suspicious credit/inquiry detected
- `password_reset_unknown`: Password reset requested (not by you)
- `new_device_login`: Login from new/unknown device
- `address_change`: Address change detected
- `credit_freeze_request`: Credit freeze request (may indicate fraud attempt)

**Response** (200 OK)
```json
{
  "score": 75,
  "level": "high",
  "reasons": [
    "Identity risk: account opened",
    "Identity risk: password reset unknown",
    "Multiple high-risk signals detected"
  ],
  "next_action": "Immediately review your accounts and credit reports. Consider placing a fraud alert or credit freeze.",
  "recommended_actions": [
    {
      "id": "review-accounts",
      "title": "Review all accounts",
      "detail": "Check all financial and online accounts for unauthorized activity."
    },
    {
      "id": "credit-freeze",
      "title": "Place credit freeze",
      "detail": "Contact credit bureaus to freeze your credit to prevent new accounts."
    },
    {
      "id": "change-passwords",
      "title": "Change passwords",
      "detail": "Update passwords for all accounts, especially if password reset was detected."
    }
  ],
  "safe_script": null,
  "metadata": {
    "signal_count": 2,
    "high_risk_signals": ["account_opened", "password_reset_unknown"]
  }
}
```

**Error Responses**
- `400 Bad Request`: Invalid input
- `404 Not Found`: Profile not found
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key
- `500 Internal Server Error`: Server error during risk assessment
