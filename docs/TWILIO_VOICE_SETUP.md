# Twilio Voice Setup for CallGuard

Browser calling at `/dashboard/callguard` needs three extra values in your **root** `.env` (besides the `TWILIO_*` vars you already have):

- `TWILIO_API_KEY`
- `TWILIO_API_SECRET`
- `TWILIO_TWIML_APP_SID`

Plus `PUBLIC_API_URL` (ngrok) so Twilio can reach your webhooks.

---

## Step 1: Create an API Key (for `TWILIO_API_KEY` / `TWILIO_API_SECRET`)

1. Open [Twilio Console](https://console.twilio.com/).
2. Go to **Account** → **API keys & tokens** (or **Keys & Credentials** → **API keys**).
3. Click **Create API key**.
4. **Friendly name**: e.g. `Titanium Guardian Voice`.
5. **Key type**: **Standard**.
6. Click **Create**.
7. Copy immediately:
   - **SID** → `TWILIO_API_KEY` (starts with `SK`)
   - **Secret** → `TWILIO_API_SECRET` (shown only once)

Paste into your project root `.env`:

```bash
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_secret_here
```

---

## Step 2: Expose your API locally (for `PUBLIC_API_URL`)

Twilio cannot call `http://localhost:8000`. Use a tunnel:

```bash
ngrok http 8000
```

Copy the **HTTPS** URL (e.g. `https://abc123.ngrok-free.app`) into `.env`:

```bash
PUBLIC_API_URL=https://abc123.ngrok-free.app
```

No trailing slash. Restart the backend after changing this.

---

## Step 3: Create a TwiML App (for `TWILIO_TWIML_APP_SID`)

1. In Twilio Console: **Develop** → **Voice** → **TwiML apps** → **Create new TwiML App**.
2. **Friendly name**: e.g. `Titanium Guardian Web`.
3. **Voice Configuration**:
   - **Request URL**: `POST`  
     `{PUBLIC_API_URL}/v1/voice/webhooks/outbound`  
     Example: `https://abc123.ngrok-free.app/v1/voice/webhooks/outbound`
   - **Status callback URL** (optional but recommended): `POST`  
     `{PUBLIC_API_URL}/v1/voice/webhooks/status`
4. Save.
5. Copy the **TwiML App SID** (starts with `AP`) into `.env`:

```bash
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 4: Configure your phone number (you already have `+13019458543`)

1. **Phone Numbers** → **Manage** → **Active numbers** → your number.
2. Under **Voice configuration** → **A call comes in**:
   - **Configure with**: Webhook
   - **URL**: `POST` `{PUBLIC_API_URL}/v1/voice/webhooks/incoming`
   - Example: `https://abc123.ngrok-free.app/v1/voice/webhooks/incoming`
3. Save.

---

## Step 5: Inbound calls to your browser (optional)

Set `TWILIO_DEFAULT_USER_ID` to the UUID of the user who should receive inbound calls:

1. Log in to the app.
2. Open DevTools → **Application** → **Session Storage** → note your user from the API, or call `GET http://localhost:8000/v1/auth/me` with your Bearer token.
3. Add to `.env`:

```bash
TWILIO_DEFAULT_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Step 6: Restart and verify

```bash
# Terminal 1 — from repo root
uvicorn backend.main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

1. Sign in → open **http://localhost:3000/dashboard/callguard**.
2. The phone panel should show **Phone ready** (green).
3. If not, while logged in run:

```bash
curl -X POST http://localhost:8000/v1/voice/token -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

You should get JSON with `"token": "..."`. A **503** response lists any missing env vars.

---

## Full `.env` Twilio block (reference)

```bash
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_VERIFY_ENABLED=true
TWILIO_VERIFY_SERVICE_SID=VA...

TWILIO_API_KEY=SK...
TWILIO_API_SECRET=...
TWILIO_TWIML_APP_SID=AP...
PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
TWILIO_DEFAULT_USER_ID=your-user-uuid

OPENAI_API_KEY=sk-...   # optional; live transcript on calls
```

| Variable | Required for browser phone? |
|----------|----------------------------|
| `TWILIO_ENABLED` | Yes (`true`) |
| `TWILIO_ACCOUNT_SID` | Yes |
| `TWILIO_AUTH_TOKEN` | Yes (webhooks + REST) |
| `TWILIO_PHONE_NUMBER` | Yes |
| `TWILIO_API_KEY` / `TWILIO_API_SECRET` | Yes (`/v1/voice/token`) |
| `TWILIO_TWIML_APP_SID` | Yes (outbound `device.connect`) |
| `PUBLIC_API_URL` | Yes (webhooks + media stream) |
| `TWILIO_DEFAULT_USER_ID` | For inbound to browser only |
| `TWILIO_VERIFY_*` | Optional (Verify product; not required for Voice SDK) |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Set: TWILIO_API_KEY..." | Complete Steps 1 and 3; restart backend |
| "TWILIO_ENABLED" | Set `TWILIO_ENABLED=true` |
| Webhook 403 | `PUBLIC_API_URL` must exactly match the URL Twilio calls (use ngrok HTTPS) |
| Inbound never rings | `TWILIO_DEFAULT_USER_ID` = logged-in user id; stay on `/dashboard/callguard` |
| No live transcript | Set `OPENAI_API_KEY` in root `.env` |

## Security

- Never commit `.env` or put `TWILIO_AUTH_TOKEN`, `TWILIO_API_SECRET`, or API keys in the frontend.
- Rotate the API secret if it was exposed; create a new API key in Console if needed.
