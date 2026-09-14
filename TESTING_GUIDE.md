# KrishiBundle Registration Fix - Quick Test Guide

## One-Time Setup

### 1. Apply Database Schema
```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Click "New Query"
# 3. Copy contents of database/schema.sql
# 4. Paste into editor
# 5. Click "Run"
# Or run: python database/apply_schema.py
```

### 2. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
# Includes: twilio==9.2.0
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## Quick Test Flow (5 minutes)

### Test 1: New Farmer Registration ✅

1. **Open frontend**
   ```bash
   cd frontend
   npm run dev  # Should run on http://localhost:3000
   ```

2. **Navigate to registration**
   - Click "Register" on homepage OR go to `/register`

3. **Create Farmer Account**
   - Step 1: Click "🌾 Farmer Account"
   - Step 2: Fill in:
     - **Name**: "Arumugam Test"
     - **Phone**: "+91 9876543210"
     - **Village**: "Test Melma"
     - **Language**: "Tamil (தமிழ்)"
     - **Password**: "TestPass123!"
     - **Confirm**: "TestPass123!"
   - Click "Register & Sign In"

4. **Verify Success**
   - ✅ Redirected to `/farmer` dashboard
   - ✅ No red error messages in console (F12 > Console)
   - ✅ Dashboard loads and is interactive

5. **Check Database**
   - In Supabase Dashboard, run:
     ```sql
     SELECT * FROM users WHERE phone = '+91 9876543210';
     SELECT * FROM farmers WHERE user_id = (SELECT id FROM users WHERE phone = '+91 9876543210');
     SELECT * FROM notifications WHERE phone = '+91 9876543210' ORDER BY created_at DESC LIMIT 5;
     ```
   - ✅ User record exists with role="farmer"
   - ✅ Farmer record exists with village="Test Melma"
   - ✅ Notification entry exists (status: queued/sent)

---

### Test 2: New Driver Registration ✅

1. **Go back to registration**
   - Click "Back to Home" then "Register" OR go to `/register`

2. **Create Driver Account**
   - Step 1: Click "🚛 Driver Account"
   - Step 2: Fill in:
     - **Name**: "Shyam Test"
     - **Phone**: "+91 9876543211"
     - **Vehicle Number**: "TN 11 AB 9999"
     - **Vehicle Type**: "Mini Truck (1500 kg)"
     - **License Number**: "DL-1420230009999"
     - **Password**: "TestPass123!"
     - **Confirm**: "TestPass123!"
   - Click "Register & Sign In"

3. **Verify Success**
   - ✅ Redirected to `/driver/loads` dashboard
   - ✅ No red error messages
   - ✅ Dashboard loads with driver interface

4. **Check Database**
   - In Supabase Dashboard, run:
     ```sql
     SELECT * FROM users WHERE phone = '+91 9876543211';
     SELECT * FROM drivers WHERE user_id = (SELECT id FROM users WHERE phone = '+91 9876543211');
     ```
   - ✅ User record exists with role="driver"
   - ✅ Driver record exists with vehicle_number="TN 11 AB 9999"

---

### Test 3: Login with New Account ✅

1. **Sign out** (from dashboard or manually logout)

2. **Go to login**
   - Click "Login" or go to `/login`

3. **Login as Farmer**
   - **Phone**: "9876543210" (without +91)
   - **Password**: "TestPass123!"
   - **Role**: "Farmer"
   - Click "Login"

4. **Verify Success**
   - ✅ Logged in successfully
   - ✅ Redirected to `/farmer` dashboard
   - ✅ User can interact with platform

5. **Check SMS Log**
   - In Supabase Dashboard, run:
     ```sql
     SELECT * FROM notifications WHERE phone = '+91 9876543210' ORDER BY created_at DESC LIMIT 2;
     ```
   - ✅ Should see TWO entries:
     1. Registration SMS (type: registration)
     2. Login SMS (type: login)

---

### Test 4: Demo Accounts Still Work ✅

1. **Go to login page** → `/login`

2. **Click "Try Quick Demo"**
   - Select role (Farmer, Driver, Admin)
   - Click "Try Quick Demo"

3. **Verify Demo**
   - ✅ Demo dashboard loads
   - ✅ All features work
   - ✅ No SMS sent (demo user)

---

## Frontend Development Commands

```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

---

## Backend Development Commands

```bash
cd backend

# Start development server
python -m uvicorn main:app --reload

# Check health
curl http://localhost:8000/health

# Test SMS endpoint
curl -X POST http://localhost:8000/api/sms/registration \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"+919876543210","role":"farmer"}'
```

---

## Troubleshooting During Testing

### ❌ "Farmers table does not exist"
**Fix:** 
```sql
-- Run in Supabase SQL Editor
CREATE TABLE if not exists farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  village TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'ta',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ❌ "Duplicate key value violates unique constraint"
**Fix:** The phone number already exists. Use a different phone number for testing:
- First test: +91 9876543210
- Second test: +91 9876543211
- Third test: +91 9876543212

### ❌ "SMS request failed"
**This is OK!** SMS is non-blocking. Check:
1. `/api/sms/registration` endpoint is accessible
2. Backend is running on `http://localhost:8000`
3. Check `notifications` table for failed SMS entries

### ❌ "Role Mismatch" error during login
**Reason:** Logged in as wrong role. Make sure:
- Register as Farmer → Login as Farmer
- Register as Driver → Login as Driver
- Admin accounts are seeded (can't self-register)

### ❌ Dashboard doesn't load after login
**Fix:**
1. Check browser console (F12 > Console) for errors
2. Verify user record exists in `users` table
3. Verify role-specific record exists (farmers/drivers table)
4. Try hard refresh: Ctrl+Shift+R

---

## Expected Behavior Checklist

### Farmer Registration Flow
- [ ] Form accepts farmer details
- [ ] Password validation works (match check)
- [ ] Redirects to `/farmer` on success
- [ ] User can see farmer dashboard
- [ ] SMS logged to notifications table

### Driver Registration Flow
- [ ] Form accepts driver details
- [ ] Redirects to `/driver/loads` on success
- [ ] User can see driver dashboard
- [ ] SMS logged to notifications table

### Login Flow
- [ ] Accepts phone + password
- [ ] Validates phone format
- [ ] Redirects to correct dashboard
- [ ] SMS logged after login
- [ ] User profile loads immediately

### Demo Accounts
- [ ] Demo login works
- [ ] Demo dashboard loads
- [ ] All demo features functional
- [ ] No errors in console

---

## Success Criteria

✅ **All Tests Pass When:**
1. ✅ New farmer registration completes without errors
2. ✅ New driver registration completes without errors
3. ✅ Both can immediately log back in
4. ✅ Demo accounts still work
5. ✅ User records exist in database
6. ✅ SMS notifications logged (with or without Twilio)
7. ✅ No console errors
8. ✅ Dashboards load correctly

---

## Production Deployment

### Enable Real SMS (Twilio)

1. **Get Twilio Account**
   - Sign up at https://www.twilio.com/
   - Note your Account SID and Auth Token
   - Get a Twilio phone number

2. **Set Environment Variables**
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Deploy Backend**
   - Update `requirements.txt` (already done)
   - Deploy with Twilio env vars set
   - Twilio will automatically initialize

4. **Real SMS will now send!**

---

## Support

| Issue | Solution |
|-------|----------|
| Registration fails | Check schema applied, clear browser cache |
| SMS not sending | Check notifications table, verify backend running |
| Login fails | Verify user record in database, check phone format |
| Demo broken | Clear localStorage, reload page |
| Can't access `/farmer` | Check user role in users table |

---

## Reference Materials

- 📄 [SMS_INTEGRATION.md](./SMS_INTEGRATION.md) - Complete SMS documentation
- 📄 [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) - Full technical details
- 📁 [database/schema.sql](./database/schema.sql) - Complete database schema
- 📁 [backend/services/sms_service.py](./backend/services/sms_service.py) - SMS service code
- 📁 [frontend/services/sms.ts](./frontend/services/sms.ts) - Frontend SMS client

---

**Last Updated**: 2024
**Status**: ✅ Ready for Testing & Deployment
