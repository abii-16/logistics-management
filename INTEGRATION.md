# Integration Notes

## Supabase

1. Create a Supabase project.
2. Run `database/schema.sql` in the SQL editor.
3. Add keys:
   - `frontend/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Gemini

Add `GEMINI_API_KEY` to `backend/.env`.

The current backend keeps a rule-based extractor as a safe fallback in `backend/services/extraction_service.py`. Replace `_demo_safe_gemini_placeholder` with the Gemini call when you want live extraction.

## SMS / Voice

Add Twilio keys to `backend/.env`:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

`backend/services/notification_service.py` already returns the correct SMS content format for booking confirmation.

