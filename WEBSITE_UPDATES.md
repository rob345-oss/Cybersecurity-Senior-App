# Website Updates - Login/Signup Buttons and Agent Connections

## Changes Made

### 1. Added Login/Signup Buttons to Website Pages

**NavBar Component** (`frontend/app/components/home/NavBar.tsx`):
- Added "Log In" and "Sign Up" buttons to the navigation bar
- Buttons appear in both desktop and mobile views
- Links point to the React/Vite application (configurable via `NEXT_PUBLIC_APP_URL`)

**Hero Component** (`frontend/app/components/home/Hero.tsx`):
- Changed "Join the Waitlist" button to "Get Started"
- "Get Started" button now links directly to the application

### 2. Made Agent Feature Cards Clickable

**Features Component** (`frontend/app/components/home/Features.tsx`):
- Made all agent feature cards clickable
- Cards now link directly to the corresponding agent in the app
- Added URL parameter support (`?agent=<agentId>`) to open specific agents
- Mapped feature names to agent IDs:
  - CallGuard → `callguard`
  - InboxGuard → `inboxguard`
  - WebGuardian → `inboxguard` (uses URL analysis from InboxGuard)
  - IdentityWatch → `identitywatch`
  - MoneyGuard → `moneyguard`
  - CareCircle → Not yet implemented (not clickable)

### 3. Connected Agents to Backend API

All agent modules are already properly connected to the backend Python API:

**CallGuard** (`frontend/src/modules/CallGuard.tsx`):
- ✅ Connected to `/v1/session/start` endpoint
- ✅ Connected to `/v1/session/{session_id}/event` endpoint
- ✅ Updated to use authenticated user ID (from JWT token)
- ✅ Sends JWT token via Authorization header

**MoneyGuard** (`frontend/src/modules/MoneyGuard.tsx`):
- ✅ Connected to `/v1/moneyguard/assess` endpoint
- ✅ Sends JWT token via Authorization header (automatic via `postJson`)

**InboxGuard** (`frontend/src/modules/InboxGuard.tsx`):
- ✅ Connected to `/v1/inboxguard/analyze_text` endpoint
- ✅ Connected to `/v1/inboxguard/analyze_url` endpoint
- ✅ Sends JWT token via Authorization header (automatic via `postJson`)

**IdentityWatch** (`frontend/src/modules/IdentityWatch.tsx`):
- ✅ Connected to `/v1/identitywatch/profile` endpoint
- ✅ Connected to `/v1/identitywatch/check_risk` endpoint
- ✅ Sends JWT token via Authorization header (automatic via `postJson`)

### 4. Enhanced App Navigation

**App Component** (`frontend/src/App.tsx`):
- Added support for URL parameters to open specific agents
- When visiting `/app?agent=callguard`, the app opens directly to CallGuard
- Supports all agent IDs: `callguard`, `moneyguard`, `inboxguard`, `identitywatch`

## Configuration

### Environment Variables

For the Next.js website to link correctly to the React app, set:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

Or in production:
```bash
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

This environment variable is used in:
- NavBar login/signup buttons
- Hero "Get Started" button
- Feature card links

### API Configuration

The React/Vite app already uses:
```bash
VITE_API_URL=http://localhost:8000
```

All API calls automatically include JWT tokens from session storage.

## User Flow

1. **From Website to App**:
   - User clicks "Log In", "Sign Up", or "Get Started" → Goes to React app
   - User clicks on a feature card → Goes to React app with specific agent opened

2. **In the App**:
   - If not authenticated → Shows login/register/verify forms
   - If authenticated → Shows main app with selected agent

3. **Using Agents**:
   - All agents require authentication (JWT token)
   - Agents automatically use authenticated user's ID
   - API calls include JWT token in Authorization header
   - All endpoints are protected and verify JWT token

## Testing

To test the connections:

1. **Start Backend**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start React App**:
   ```bash
   cd frontend
   npm run dev:vite
   ```

3. **Start Next.js Website** (optional, for testing links):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test Flow**:
   - Visit Next.js website (usually `http://localhost:3000`)
   - Click "Log In" or "Sign Up" → Should redirect to Vite app
   - Click on a feature card (e.g., CallGuard) → Should open app with CallGuard selected
   - Log in and use any agent → Should successfully connect to backend API

## Notes

- All agent modules use the `postJson` and `getJson` functions from `frontend/src/api.ts`
- These functions automatically include JWT tokens from session storage
- Backend verifies JWT tokens and extracts user information
- No API keys needed - all authentication is via JWT tokens
- User must be logged in to use any agent functionality

