# CAT Reminder - Passwordless Authentication Setup

## Overview

The authentication system has been updated to use **passwordless authentication** with email verification codes.

## Key Changes

### Registration

- **Required Fields:**
  - Full Name
  - Admission Number
  - MKU Email (@mku.ac.ke)
- **No password needed!**

### Login

- **Only MKU email required** (@mku.ac.ke)
- A 6-digit verification code is sent to your email
- Code expires in 10 minutes

## Backend Setup

### 1. Database Configuration

Run the SQL migration to create the tables:

```bash
mysql -u your_username -p your_database < server/migrations/passwordless_auth.sql
```

### 2. Environment Variables

Copy the example file and configure:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your details:

```env
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cat_reminder

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT Secret
JWT_SECRET=your-super-secret-key
```

**Note for Gmail:**

- Enable 2-factor authentication
- Generate an App Password: https://myaccount.google.com/apppasswords
- Use the App Password in EMAIL_PASS

### 3. Install Dependencies & Run

```bash
cd server
npm install
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Frontend Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

## API Endpoints

### POST `/api/auth/register`

Register a new user

```json
{
  "email": "student@mku.ac.ke",
  "fullName": "John Doe",
  "admNumber": "MKU/12345"
}
```

### POST `/api/auth/login`

Login with email

```json
{
  "email": "student@mku.ac.ke"
}
```

### POST `/api/auth/verify-code`

Verify the email code

```json
{
  "userId": "uuid",
  "code": "123456"
}
```

### POST `/api/auth/resend-code`

Resend verification code

```json
{
  "userId": "uuid"
}
```

## Features

✅ Passwordless authentication  
✅ Email verification with 6-digit codes  
✅ MKU email validation (@mku.ac.ke only)  
✅ Code expiration (10 minutes)  
✅ Resend code functionality  
✅ JWT token-based sessions  
✅ Clean, modern UI with verification flow

## Security Notes

- Verification codes expire after 10 minutes
- Codes can only be used once
- MKU email domain validation
- JWT tokens for authenticated sessions
- Secure password-free authentication flow
