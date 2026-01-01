# Where Your Information is Stored When You Sign Up

## Overview

When you sign up for Titanium Guardian, your information is stored securely in a **PostgreSQL database** with **field-level encryption** for all Personally Identifiable Information (PII).

## Database Location

- **Database Type**: PostgreSQL 16+
- **Storage Location**: 
  - **Development**: Local PostgreSQL database (via Docker or local installation)
  - **Production**: Production PostgreSQL server (configured via `DATABASE_URL`)
- **Database Name**: `titanium_guardian` (configurable)

## What Information is Stored

### User Account Information

When you sign up, the following information is stored in the `users` table:

1. **Email Address** (`email_encrypted`)
   - Stored as: **Encrypted string** (Fernet encryption)
   - Original format: `your.email@example.com`
   - Stored format: `gAAAAABl...` (encrypted base64 string)
   - Used for: Login, account identification, email verification

2. **Full Name** (`full_name_encrypted`)
   - Stored as: **Encrypted string** (Fernet encryption)
   - Optional: Yes, but recommended
   - Used for: Personalization, account display

3. **Phone Number** (`phone_encrypted`)
   - Stored as: **Encrypted string** (Fernet encryption)
   - Optional: Yes
   - Used for: Identity verification, contact information

4. **Password** (`password_hash`)
   - Stored as: **BCrypt hash** (one-way hash, cannot be decrypted)
   - Original password: **Never stored**
   - Hash format: `$2b$12$...` (BCrypt hash string)
   - Security: BCrypt with cost factor 12 (strong encryption)
   - Used for: Authentication only

5. **Email Verification Status** (`email_verified`)
   - Stored as: Boolean (true/false)
   - Default: `false` until email is verified
   - Used for: Account activation tracking

6. **Account Metadata**
   - `id`: Unique UUID (not PII, unencrypted)
   - `created_at`: Timestamp of account creation
   - `updated_at`: Timestamp of last update

### Email Verification Tokens

When you register, a verification token is created in the `email_verifications` table:

- `token_hash`: SHA-256 hash of the verification token (not the token itself)
- `expires_at`: Expiration timestamp (24 hours by default)
- `used_at`: Timestamp when token was used (null until verified)
- `user_id`: Reference to your user account

**Important**: The actual verification token is **NOT stored** in the database - only its hash is stored for security.

## Security Measures

### 1. Encryption at Rest

All PII fields are encrypted **before** being stored in the database:

- **Encryption Method**: Fernet (symmetric encryption)
- **Key Location**: Stored in environment variable `ENCRYPTION_KEY`
- **Fields Encrypted**:
  - Email address
  - Full name
  - Phone number

### 2. Password Security

- **Hashing Algorithm**: BCrypt
- **Cost Factor**: 12 (high security)
- **One-Way Hash**: Passwords cannot be recovered or decrypted
- **Storage**: Only the hash is stored, never the plain password

### 3. Database Security

- **Connection**: Encrypted connections (SSL/TLS) in production
- **Access Control**: Database user permissions limited to application needs
- **Backup**: Regular backups recommended (not automatically configured)

### 4. Token Security

- **Verification Tokens**: Generated with cryptographically secure random number generator
- **Storage**: Only token hashes stored (SHA-256)
- **Expiration**: Tokens expire after 24 hours
- **Single Use**: Tokens can only be used once

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email_encrypted VARCHAR(512) NOT NULL UNIQUE,  -- Encrypted
    full_name_encrypted VARCHAR(512),               -- Encrypted
    phone_encrypted VARCHAR(512),                   -- Encrypted
    password_hash VARCHAR(255) NOT NULL,            -- BCrypt hash
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### Email Verifications Table

```sql
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,         -- SHA-256 hash
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Data Access

### Who Can Access Your Data

1. **You**: Through the application interface (after login)
2. **Application Backend**: To process your requests (requires authentication)
3. **Database Administrators**: Limited access for maintenance (in production)
4. **No One Else**: Data is encrypted and access is restricted

### How Data is Retrieved

1. **Login**: Your email is encrypted and compared against encrypted emails in the database
2. **Password Verification**: BCrypt compares your password against the stored hash
3. **Data Display**: PII fields are decrypted on-the-fly when needed for display
4. **API Responses**: Data is decrypted before being sent to the frontend

## Data Retention

- **Active Accounts**: Stored indefinitely (until account deletion)
- **Verification Tokens**: Expire after 24 hours, cleaned up automatically
- **Sessions**: Expire based on session TTL (default: 24 hours)

## Environment Configuration

The database connection is configured via environment variables:

```bash
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database_name
```

Example:
```bash
DATABASE_URL=postgresql+asyncpg://titanium_user:titanium_password@localhost:5432/titanium_guardian
```

## Production Considerations

For production deployment:

1. **Database Location**: Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, Azure Database)
2. **Encryption Key**: Store `ENCRYPTION_KEY` securely (AWS Secrets Manager, HashiCorp Vault)
3. **Backups**: Enable automated database backups
4. **Monitoring**: Set up database monitoring and alerts
5. **Access Control**: Restrict database access to application servers only
6. **Compliance**: Ensure compliance with data protection regulations (GDPR, CCPA, etc.)

## Summary

**Your information is stored:**
- ✅ In a PostgreSQL database
- ✅ With PII encrypted at rest (email, name, phone)
- ✅ With passwords hashed (BCrypt, one-way)
- ✅ With secure token handling (hashed tokens)
- ✅ With proper access controls
- ✅ Following security best practices

**Your information is NOT:**
- ❌ Stored in plain text
- ❌ Accessible without authentication
- ❌ Shared with third parties
- ❌ Stored in cookies or browser storage (only tokens are)

For additional security information, see `AUTH_SETUP.md` and `docs/PRIVACY.md`.

