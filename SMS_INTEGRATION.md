# SMS Integration Setup & Documentation

## Overview
KrishiBundle now includes SMS notifications for:
- ✅ Registration success
- ✅ Login alerts
- ✅ Driver assignments
- ✅ Bundle creation
- ✅ Trip updates

## Configuration

### Option 1: Using Twilio (Recommended)

1. **Get Twilio Credentials**
   - Sign up at https://www.twilio.com/
   - Get your Account SID and Auth Token
   - Get a Twilio phone number

2. **Set Environment Variables**
   ```bash
   # In your .env file or deployment config
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
   ```

3. **Install Twilio SDK**
   ```bash
   pip install twilio==9.2.0
   ```
   (Already in requirements.txt)

### Option 2: Using Database Logging (Fallback)

If Twilio credentials are not available:
- SMS requests are automatically logged to the `notifications` table
- Messages are stored with status "queued"
- No actual SMS is sent, but the audit trail is preserved
- Perfect for development/testing

## File Changes

### Backend Files Added/Modified

1. **backend/services/sms_service.py** (NEW)
   - Core SMS service with Twilio integration
   - Graceful fallback to database logging
   - Reusable functions:
     - `send_registration_sms()`
     - `send_login_sms()`
     - `send_driver_assignment_sms()`
     - `send_bundle_created_sms()`
     - `send_trip_update_sms()`

2. **backend/routes/sms.py** (NEW)
   - FastAPI endpoints for SMS requests
   - All endpoints return `{success: bool, message: string}`
   - Non-blocking: errors don't halt auth flow

3. **backend/main.py** (MODIFIED)
   - Added SMS router
   - SMS routes: `/api/sms/registration`, `/api/sms/login`, etc.

4. **backend/requirements.txt** (MODIFIED)
   - Added `twilio==9.2.0`

### Frontend Files Added/Modified

1. **frontend/services/sms.ts** (NEW)
   - Lightweight SMS client
   - Functions match backend SMS service
   - Non-blocking async calls

2. **frontend/app/register/page.tsx** (MODIFIED)
   - Added import: `import { sendRegistrationSMS } from "@/services/sms"`
   - After successful registration, triggers: `sendRegistrationSMS(name, phone, role)`
   - SMS failure doesn't block registration

3. **frontend/app/login/page.tsx** (MODIFIED)
   - Added import: `import { sendLoginSMS } from "@/services/sms"`
   - After successful login, triggers: `sendLoginSMS(name, phone)`
   - SMS failure doesn't block login

### Database Files Modified

1. **database/schema.sql** (MODIFIED)
   - **ADDED:** `farmers` table (was missing!)
   - **MODIFIED:** `drivers` table - added `completed_trips` and `rating` fields
   - `notifications` table already existed for SMS logging

## Registration Flow Fix

### Issues Fixed

1. **Missing `farmers` table** ✅
   - Farmer registration was failing because table didn't exist
   - Now creates farmers with village + language preferences

2. **Password security issue** ✅
   - Plaintext password stored in users table (redundant)
   - Now removed - Supabase auth handles all password management
   - Users table only stores: `id, name, phone, village, preferred_language, role`

3. **Driver registration flow** ✅
   - Simplified to remove `.single()` on insert (was causing issues)
   - Vehicles table insert is now optional (warning, not error)

### New Registration Workflow

```
1. User fills registration form (name, phone, role, password)
2. Supabase auth.signUp() - creates auth user
3. Insert user profile into `users` table
4. If Farmer:
   - Insert into `farmers` table with village + language
5. If Driver:
   - Insert into `drivers` table with vehicle info
   - Insert into `vehicles` table (optional)
6. Supabase auth.signIn() - establish session
7. Send registration SMS (async, non-blocking)
8. Redirect to dashboard
```

## Login Flow Enhancement

```
1. User enters phone + password
2. Map phone to email (kb{phone}@krishibundle.com)
3. Supabase auth.signInWithPassword()
4. Fetch user profile from `users` table
5. Role validation
6. Send login SMS (async, non-blocking)
7. Redirect to dashboard based on role
```

## SMS Message Examples

### Registration SMS
```
KrishiBundle Registration Successful

Welcome, [Name].

Your account has been created successfully.
Role: Farmer/Driver

You can now access the KrishiBundle platform.
```

### Login SMS
```
KrishiBundle Login Alert

Hello [Name],

You have successfully logged into your KrishiBundle account.
Date & Time: [Current Date & Time]

If this was not you, contact support immediately.
```

## Testing

### Test Case 1: New Farmer Registration
1. Go to `/register`
2. Select "Farmer Account"
3. Fill in:
   - Name: "Test Farmer"
   - Phone: "+91 9876543210"
   - Village: "Test Village"
   - Preferred Language: "Tamil"
   - Password: "TestPass123!"
4. Click "Register & Sign In"
5. **Expected:**
   - ✅ User record created in `users` table
   - ✅ Farmer record created in `farmers` table
   - ✅ User logged in and redirected to `/farmer`
   - ✅ SMS sent to phone (or logged to `notifications` table)
   - ✅ No errors in browser console

### Test Case 2: New Driver Registration
1. Go to `/register`
2. Select "Driver Account"
3. Fill in:
   - Name: "Test Driver"
   - Phone: "+91 9876543210"
   - Vehicle Number: "TN 11 AB 1234"
   - Vehicle Type: "Mini Truck"
   - License Number: "DL-1420230001234"
   - Password: "TestPass123!"
4. Click "Register & Sign In"
5. **Expected:**
   - ✅ User record created in `users` table
   - ✅ Driver record created in `drivers` table
   - ✅ Vehicle record created in `vehicles` table (optional)
   - ✅ User logged in and redirected to `/driver/loads`
   - ✅ SMS sent to phone
   - ✅ No errors in browser console

### Test Case 3: Login with Newly Created Account
1. Go to `/login`
2. Enter phone: "9876543210" (from registration)
3. Enter password: "TestPass123!"
4. Select role: Farmer or Driver (matching registration)
5. Click "Login"
6. **Expected:**
   - ✅ User authenticated
   - ✅ Redirected to correct dashboard
   - ✅ Login SMS sent
   - ✅ User can interact with platform

### Test Case 4: Demo Accounts Still Work
1. Go to `/login`
2. Click "Try Quick Demo"
3. **Expected:**
   - ✅ Demo user logged in
   - ✅ Demo dashboard loads
   - ✅ No SMS sent (mock user)
   - ✅ All demo features work

## Environment Configuration

### Development

**No Twilio needed!** SMS will be logged to database.

```bash
# No special config needed for dev
npm run dev  # Frontend
python -m uvicorn backend.main:app --reload  # Backend
```

### Production

1. Set Twilio credentials:
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   ```

2. Deploy backend with updated requirements.txt

3. SMS will now send real messages!

## Troubleshooting

### SMS not sending
1. Check browser console for errors
2. Check backend logs for SMS service errors
3. Verify `notifications` table has entries (check status field)
4. Check Twilio credentials if using production SMS

### Farmer registration fails
- Check that `farmers` table exists in Supabase
- Run: `apply_schema.py` or manually apply schema.sql
- Check `users` table has the new farmer entry

### Driver registration fails
- Check that `drivers` table exists
- Verify `vehicle_number` is valid
- Check `users` table entry was created first

### Login fails after registration
- Verify user record in `users` table with correct role
- Check if farmer profile exists in `farmers` table (for farmers)
- Check if driver profile exists in `drivers` table (for drivers)
- Try logging in with Supabase dashboard directly

## Future Extensions

The SMS service is designed to be reusable:

```python
# New use case? Add a new function to sms_service.py:
def send_custom_notification(name, phone, message):
    return sms_service.send_sms(phone, message, sms_type="custom")

# Then create an API endpoint:
@router.post("/custom")
async def send_custom(request: CustomRequest):
    return send_custom_notification(...)
```

## Non-Blocking Design

**Critical Design Choice:**
- SMS failures NEVER block authentication
- Registration succeeds even if SMS fails
- Login succeeds even if SMS fails
- SMS errors are logged but not shown to user
- This ensures platform reliability

## Security Notes

1. ✅ Passwords never stored in users table
2. ✅ Phone numbers validated before SMS
3. ✅ SMS requests logged for audit trail
4. ✅ Twilio credentials in environment variables only
5. ✅ SMS failures don't expose sensitive info

## Support

For issues or questions:
- Check backend logs: `uvicorn` terminal output
- Check frontend console: Browser DevTools > Console
- Check database: Supabase Dashboard > `notifications` table
- Review SMS service logs in `notifications` table with status="failed"
