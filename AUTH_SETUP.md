# User Authentication System - Setup and Access Instructions

## Overview

A secure user authentication system has been implemented with:
- **PostgreSQL database** for persistent storage
- **JWT-based authentication** (replaces API key auth)
- **Email verification** requirement
- **Field-level encryption** for all PII (email, name, phone)
- **BCrypt password hashing** with strong password requirements
- **Rate limiting** on authentication endpoints

## Security Features

### Password Security
- Minimum 12 characters
- Requires: uppercase, lowercase, digit, special character
- BCrypt hashing with cost factor 12
- Passwords never stored in plaintext

### PII Encryption
- All PII fields (email, full_name, phone) encrypted at rest using Fernet
- Field-level encryption before database storage
- Decryption only when needed for API responses

### JWT Tokens
- Short-lived access tokens (15 minutes, configurable)
- Refresh tokens (7 days, configurable)
- Automatic token refresh on expiration
- HMAC-SHA256 signing algorithm

### Email Verification
- Cryptographically secure random tokens (32 bytes)
- Tokens hashed before storage (SHA-256)
- 24-hour expiration
- Single-use tokens

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Copy the example file
cp .env.example .env
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Generate with: `python -c 'import secrets; print(secrets.token_urlsafe(64))'`
- `ENCRYPTION_KEY` - Generate with: `python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'`

See `.env.example` for all available configuration options.

### 2. Database Setup

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d postgres
```

This will:
- Start PostgreSQL container
- Create the database automatically
- Set up the connection

Then run migrations:

```bash
cd backend
# Install dependencies if not already installed
pip install -r ../requirements.txt

# Run migrations
alembic upgrade head
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL 16+
2. Create database:
   ```sql
   CREATE DATABASE titanium_guardian;
   CREATE USER titanium_user WITH PASSWORD 'titanium_password';
   GRANT ALL PRIVILEGES ON DATABASE titanium_guardian TO titanium_user;
   ```
3. Update `DATABASE_URL` in `.env`
4. Run migrations: `cd backend && alembic upgrade head`

### 3. Start Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Start server
cd backend
uvicorn main:app --reload
```

Backend will be available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev:vite
```

Frontend will be available at: `http://localhost:5173` (or check console for actual port)

## How to Access

### 1. Create an Account

1. Navigate to the frontend application
2. Click "Register"
3. Fill in the form:
   - **Email**: Your email address
   - **Full Name**: Your full name
   - **Phone**: Optional phone number
   - **Password**: Must meet requirements (min 12 chars, uppercase, lowercase, number, special char)
   - **Confirm Password**: Re-enter password
4. Click "Create Account"

### 2. Verify Email

After registration:

**Development Mode:**
- Check backend logs for the verification token
- Copy the token from the log output
- Click "Verify Email" in the frontend
- Paste the token and click "Verify Email"

**Production Mode (when email sending is implemented):**
- Check your email inbox
- Click the verification link (or copy the token from the link)
- The token will be automatically filled in the verify form

### 3. Login

1. Click "Login" in the frontend
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to the main application

### 4. Use the Application

Once logged in:
- All API endpoints are now protected with JWT authentication
- Your session will persist until you logout or the token expires
- Tokens are automatically refreshed when they expire
- You can logout using the logout button in the sidebar

## API Endpoints

### Authentication Endpoints (Public)

- `POST /v1/auth/register` - Create new account
- `POST /v1/auth/login` - Login and get tokens
- `POST /v1/auth/verify-email` - Verify email with token
- `POST /v1/auth/refresh` - Refresh access token

### Protected Endpoints (Require JWT)

All existing endpoints now require JWT authentication:
- `POST /v1/session/start`
- `POST /v1/session/{session_id}/event`
- `GET /v1/session/{session_id}`
- `POST /v1/session/{session_id}/end`
- `POST /v1/moneyguard/assess`
- `POST /v1/moneyguard/safe_steps`
- `POST /v1/inboxguard/analyze_text`
- `POST /v1/inboxguard/analyze_url`
- `POST /v1/identitywatch/profile`
- `POST /v1/identitywatch/check_risk`
- `GET /v1/data-retention/policy`
- `GET /v1/auth/me` - Get current user info

**Authentication Header:**
```
Authorization: Bearer <access_token>
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `docker ps` (if using Docker)
- Check `DATABASE_URL` is correct in `.env`
- Verify database exists and user has permissions
- Check backend logs for connection errors

### Migration Issues

- Ensure database is accessible
- Check `DATABASE_URL` format: `postgresql+asyncpg://user:password@host:port/dbname`
- Try running: `alembic upgrade head --sql` to see SQL without executing

### Authentication Issues

- Verify `JWT_SECRET_KEY` is set and at least 64 characters
- Check token expiration settings
- Clear browser session storage if tokens are corrupted
- Check backend logs for authentication errors

### Encryption Issues

- Verify `ENCRYPTION_KEY` is set (base64-encoded Fernet key)
- Generate new key if needed: `python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'`
- **Warning**: Changing encryption key will prevent decrypting existing data

## Security Notes

1. **Never commit `.env` file** - Contains sensitive secrets
2. **Use strong JWT_SECRET_KEY** - Generate with secure random function
3. **Use strong ENCRYPTION_KEY** - Generate Fernet key properly
4. **Enable HTTPS in production** - JWT tokens should only be sent over HTTPS
5. **Configure CORS properly** - Set `CORS_ORIGINS` to specific domains in production
6. **Implement email sending** - Currently verification tokens are logged; implement email service for production

## Next Steps for Production

1. **Implement Email Service** - Send verification emails via SMTP/service (SendGrid, AWS SES, etc.)
2. **Add Password Reset** - Implement forgot password flow
3. **Add Rate Limiting** - Additional rate limiting on auth endpoints (currently basic)
4. **Enable HTTPS** - Configure SSL/TLS certificates
5. **Database Backups** - Set up automated backups for PostgreSQL
6. **Monitoring** - Add logging and monitoring for authentication events
7. **Session Management** - Consider implementing refresh token rotation

## Support

For issues or questions:
- Check backend logs: Look for error messages
- Check browser console: Look for API errors
- Verify environment variables are set correctly
- Ensure all dependencies are installed

