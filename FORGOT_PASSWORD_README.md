# Forgot Password Feature

A secure password reset system with both email and SMS OTP options for the Medicine Inventory application.

## Features

### 🔐 Dual Reset Methods
- **Email Reset**: Send password reset link to registered email
- **SMS Reset**: Send 6-digit OTP to registered phone number

### 🛡️ Security Features
- JWT-based reset tokens with expiration (1 hour for email, 10 minutes for OTP)
- Rate limiting and attempt tracking
- Secure password requirements
- Token invalidation after use
- IP address and user agent tracking

### 📱 User Experience
- Intuitive modal interface
- Real-time OTP input with auto-focus
- Password strength indicator
- Responsive design
- Clear error messages and validation

## Setup Instructions

### 1. Database Setup

Run the database migration script:

```bash
node setup-password-reset.js
```

This will create the necessary tables and functions:
- `password_reset_tokens` - Stores email reset tokens
- `otp_verifications` - Stores SMS OTP codes
- `generate_otp()` - Function to generate secure OTPs
- `validate_otp()` - Function to validate OTP codes
- `cleanup_expired_tokens()` - Function to clean up expired tokens

### 2. Environment Configuration

Copy the example environment file and configure your services:

```bash
cp server/env.example server/.env
```

#### Email Service Configuration

Choose one of the following email providers:

**Console (Development)**
```env
EMAIL_PROVIDER=console
```

**Gmail**
```env
EMAIL_PROVIDER=gmail
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

**SMTP**
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

**SendGrid**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
```

#### SMS Service Configuration

Choose one of the following SMS providers:

**Console (Development)**
```env
SMS_PROVIDER=console
```

**Twilio**
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

**AWS SNS**
```env
SMS_PROVIDER=aws-sns
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### Frontend URL
```env
FRONTEND_URL=http://localhost:3000
```

### 3. Install Dependencies

Install required packages for email and SMS services:

```bash
# For email services
npm install nodemailer

# For SMS services (choose one)
npm install twilio          # For Twilio
npm install aws-sdk         # For AWS SNS
```

### 4. Start the Application

```bash
# Start the server
cd server
npm start

# Start the client (in another terminal)
cd client
npm start
```

## API Endpoints

### POST /api/auth/forgot-password
Send password reset via email or SMS.

**Request Body:**
```json
{
  "email": "user@example.com",  // Required for email method
  "phone": "+1234567890",       // Required for SMS method
  "method": "email"             // "email" or "sms"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

### POST /api/auth/verify-otp
Verify OTP code for SMS reset.

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "jwt_token_here"
}
```

### POST /api/auth/reset-password
Reset password using token or OTP.

**Request Body (Email method):**
```json
{
  "token": "jwt_token_here",
  "password": "new_password",
  "method": "email"
}
```

**Request Body (SMS method):**
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "password": "new_password",
  "method": "sms"
}
```

## Frontend Components

### ForgotPasswordModal
Main modal component that handles the entire forgot password flow.

**Props:**
- `isOpen`: Boolean to control modal visibility
- `onClose`: Function to close the modal

### OTPVerification
Component for entering and verifying OTP codes.

**Props:**
- `phone`: Phone number receiving the OTP
- `onVerified`: Callback when OTP is verified
- `onBack`: Callback to go back to previous step

### PasswordResetForm
Component for setting a new password.

**Props:**
- `userData`: Object containing reset method and token/phone
- `onSuccess`: Callback when password is reset successfully
- `onBack`: Callback to go back to previous step

## Security Considerations

### Token Security
- Reset tokens are JWT-based with short expiration times
- Tokens are stored in database and invalidated after use
- IP address and user agent are tracked for security

### Rate Limiting
- OTP attempts are limited (3 attempts per phone number)
- Tokens have expiration times to prevent abuse
- Failed attempts are tracked and logged

### Password Requirements
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Real-time strength indicator
- Confirmation field to prevent typos

## Testing

### Development Mode
In development mode, both email and SMS services will log messages to the console instead of sending actual messages.

### Email Testing
Check the server console for email content and reset links.

### SMS Testing
Check the server console for SMS content and OTP codes.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure Supabase credentials are correct
   - Run the setup script to create required tables

2. **Email Not Sending**
   - Check email service configuration
   - Verify credentials and permissions
   - Check console logs for error messages

3. **SMS Not Sending**
   - Check SMS service configuration
   - Verify phone number format (include country code)
   - Check console logs for error messages

4. **Token Validation Errors**
   - Ensure JWT_SECRET is set in environment
   - Check token expiration times
   - Verify database connection

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging and console output for email/SMS services.

## Production Deployment

### Security Checklist
- [ ] Use strong JWT secrets
- [ ] Configure proper email/SMS service credentials
- [ ] Set up proper CORS policies
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up database backups

### Environment Variables
Ensure all required environment variables are set in production:
- Database credentials
- JWT secrets
- Email service credentials
- SMS service credentials
- Frontend URL

## Support

For issues or questions regarding the forgot password feature, please check:
1. This documentation
2. Console logs for error messages
3. Database connectivity
4. Service provider credentials

The feature is designed to be secure, user-friendly, and production-ready with proper configuration.
