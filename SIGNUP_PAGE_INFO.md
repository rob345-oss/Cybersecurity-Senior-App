# Sign Up Page - Information

## New Sign Up Page Created

A dedicated sign up page has been created at `/signup` in the Next.js website.

### Location
- **File**: `frontend/app/signup/page.tsx`
- **URL**: `http://localhost:3000/signup` (or your domain/signup)

### Features
- ✅ Full registration form with validation
- ✅ Password strength requirements (12+ chars, uppercase, lowercase, number, special char)
- ✅ Email validation
- ✅ Password confirmation
- ✅ Optional phone number field
- ✅ Error handling and display
- ✅ Success message after registration
- ✅ Auto-redirect to app after successful signup
- ✅ Link to login page

### Navigation Updates

The following navigation elements now point to the signup page:
- **NavBar "Sign Up" button** → `/signup`
- **Hero "Get Started" button** → `/signup`
- **Mobile menu "Sign Up" button** → `/signup`

## Configuration

### Required Environment Variable

For the signup page to work, you need to set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This tells the signup page where to send registration requests.

### Optional Environment Variable

```bash
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

This is used for redirecting after signup and for the "Log In" link.

## Where Your Information is Stored

See `DATA_STORAGE_INFO.md` for complete details. Summary:

### Storage Location
- **Database**: PostgreSQL (`titanium_guardian` database)
- **Table**: `users` table

### What Gets Stored

1. **Email Address** - Encrypted (Fernet encryption)
2. **Full Name** - Encrypted (Fernet encryption)
3. **Phone Number** - Encrypted (Fernet encryption), optional
4. **Password** - Hashed (BCrypt, one-way hash, cannot be decrypted)
5. **Account Metadata** - UUID, timestamps, verification status

### Security

- ✅ All PII (email, name, phone) is **encrypted at rest**
- ✅ Password is **hashed** (BCrypt, cannot be reversed)
- ✅ Passwords are **never stored in plain text**
- ✅ Database connections use SSL/TLS in production
- ✅ Access requires authentication (JWT tokens)

### Database Structure

```
PostgreSQL Database: titanium_guardian
└── users table
    ├── id (UUID) - Your unique account ID
    ├── email_encrypted (VARCHAR) - Your email, encrypted
    ├── full_name_encrypted (VARCHAR) - Your name, encrypted
    ├── phone_encrypted (VARCHAR) - Your phone, encrypted (optional)
    ├── password_hash (VARCHAR) - Your password, hashed (one-way)
    ├── email_verified (BOOLEAN) - Verification status
    ├── created_at (TIMESTAMP) - Account creation time
    └── updated_at (TIMESTAMP) - Last update time
```

## Testing the Signup Page

1. **Start the backend**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start the Next.js website**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Visit the signup page**:
   - Go to `http://localhost:3000/signup`
   - Or click "Sign Up" from any page

4. **Fill out the form**:
   - Email: Any valid email
   - Full Name: Your name
   - Phone: Optional
   - Password: Must meet requirements (12+ chars, etc.)
   - Confirm Password: Must match

5. **Submit and check**:
   - Account is created in the database
   - Verification token is logged in backend console (for development)
   - You're redirected to the app

## Development vs Production

### Development
- Verification tokens are **logged to backend console**
- Check backend logs to get your verification token
- Use the token to verify your email

### Production
- Verification tokens should be **sent via email** (to be implemented)
- Users receive email with verification link
- Click link to verify account

## Next Steps After Signup

1. **Check backend logs** for verification token (development)
2. **Verify your email** using the token
3. **Log in** to the application
4. **Start using the agents** (CallGuard, MoneyGuard, etc.)

See `AUTH_SETUP.md` for complete authentication setup instructions.

