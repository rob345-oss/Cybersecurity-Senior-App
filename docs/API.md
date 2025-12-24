# Titanium Guardian API

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

**Response**
`RiskResponse`

### POST /v1/session/{session_id}/end
End a session and return a summary.

**Response**
```json
{
  "session_id": "...",
  "module": "callguard",
  "created_at": "2024-01-01T12:00:00Z",
  "last_risk": {"score": 70, "level": "high", "reasons": [], "next_action": "...", "recommended_actions": [], "metadata": {}},
  "key_takeaways": ["Signal detected: verification code request"]
}
```

### GET /v1/session/{session_id}
Fetch events and latest risk.

**Response**
```json
{
  "events": [
    {"id": "...", "type": "signal", "payload": {"signal_key": "urgency"}, "timestamp": "2024-01-01T12:00:00Z"}
  ],
  "last_risk": {"score": 10, "level": "low", "reasons": [], "next_action": "...", "recommended_actions": [], "metadata": {}}
}
```

## CallGuard
Use core session endpoints with event types:
- `signal` payload: `{signal_key: str, phone_number?: str, free_text?: str}`
- `note` payload: `{text: str}`

## MoneyGuard

### POST /v1/moneyguard/assess
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
  "impersonation_type": "bank"
}
```

### POST /v1/moneyguard/safe_steps
```json
{"session_id": "optional"}
```

## InboxGuard

### POST /v1/inboxguard/analyze_text
```json
{"text": "Final notice, verify now", "channel": "sms"}
```

### POST /v1/inboxguard/analyze_url
```json
{"url": "https://bit.ly/example"}
```

## IdentityWatch

### POST /v1/identitywatch/profile
```json
{"emails": ["user@example.com"], "phones": ["+15551234567"], "full_name": "Alex Chen", "state": "CA"}
```

### POST /v1/identitywatch/check_risk
```json
{
  "profile_id": "profile-1",
  "signals": {"account_opened": true, "suspicious_inquiry": false, "password_reset_unknown": true}
}
```
