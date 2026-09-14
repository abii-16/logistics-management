"""
SMS Service for KrishiBundle
Handles SMS notifications for registration, login, and other events
"""

import os
from typing import Optional
from datetime import datetime

# Twilio imports (optional - graceful fallback if not available)
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

from database.db import supabase_client


class SMSService:
    """Lightweight SMS service for KrishiBundle"""

    def __init__(self):
        self.twilio_available = TWILIO_AVAILABLE
        self.twilio_client = None
        self.twilio_phone = None

        if self.twilio_available:
            account_sid = os.getenv("TWILIO_ACCOUNT_SID")
            auth_token = os.getenv("TWILIO_AUTH_TOKEN")
            self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "+14155552671")  # Twilio trial number

            if account_sid and auth_token:
                try:
                    self.twilio_client = Client(account_sid, auth_token)
                except Exception as e:
                    print(f"Failed to initialize Twilio client: {e}")

    def send_sms(self, phone: str, message: str, sms_type: str = "notification") -> bool:
        """
        Send SMS to phone number
        
        Args:
            phone: Phone number (format: +91XXXXXXXXXX or 91XXXXXXXXXX)
            message: SMS message text
            sms_type: Type of SMS (for logging)
        
        Returns:
            bool: True if SMS sent or queued, False if failed
        """
        try:
            # Format phone number
            formatted_phone = self._format_phone(phone)
            if not formatted_phone:
                print(f"Invalid phone number: {phone}")
                return False

            # Try Twilio first
            if self.twilio_client:
                return self._send_via_twilio(formatted_phone, message, sms_type)

            # Fallback: Log to database
            return self._log_sms_to_db(formatted_phone, message, sms_type)

        except Exception as e:
            print(f"SMS send error: {e}")
            return False

    def _send_via_twilio(self, phone: str, message: str, sms_type: str) -> bool:
        """Send SMS via Twilio"""
        try:
            msg = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_phone,
                to=phone
            )
            print(f"SMS sent via Twilio: {msg.sid}")
            # Log to database
            self._log_sms_to_db(phone, message, sms_type, status="sent", sms_id=msg.sid)
            return True
        except Exception as e:
            print(f"Twilio send failed: {e}")
            # Log failed attempt
            self._log_sms_to_db(phone, message, sms_type, status="failed")
            return False

    def _log_sms_to_db(self, phone: str, message: str, sms_type: str, status: str = "queued", sms_id: Optional[str] = None) -> bool:
        """Log SMS to database for audit trail"""
        try:
            if not supabase_client:
                print("Supabase client not available for SMS logging")
                return False

            supabase_client.table("notifications").insert({
                "phone": phone,
                "channel": "sms",
                "message": message,
                "status": status,
                "type": sms_type,
                "external_id": sms_id
            }).execute()
            
            print(f"SMS logged to database: {phone} ({sms_type})")
            return True
        except Exception as e:
            print(f"Failed to log SMS to database: {e}")
            return False

    def _format_phone(self, phone: str) -> Optional[str]:
        """Format phone number to international format"""
        try:
            # Remove spaces and special chars
            clean = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

            # Handle Indian numbers
            if clean.startswith("91"):
                return f"+{clean}"
            elif clean.startswith("+91"):
                return clean
            elif len(clean) == 10 and clean.isdigit():
                return f"+91{clean}"
            else:
                return f"+{clean}" if not clean.startswith("+") else clean
        except Exception as e:
            print(f"Phone formatting error: {e}")
            return None

    def send_registration_sms(self, name: str, phone: str, role: str) -> bool:
        """Send registration success SMS"""
        message = (
            f"KrishiBundle Registration Successful\n\n"
            f"Welcome, {name}.\n\n"
            f"Your account has been created successfully.\n"
            f"Role: {role.capitalize()}\n\n"
            f"You can now access the KrishiBundle platform."
        )
        return self.send_sms(phone, message, sms_type="registration")

    def send_login_sms(self, name: str, phone: str) -> bool:
        """Send login alert SMS"""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M")
        message = (
            f"KrishiBundle Login Alert\n\n"
            f"Hello {name},\n\n"
            f"You have successfully logged into your KrishiBundle account.\n"
            f"Date & Time: {current_time}\n\n"
            f"If this was not you, contact support immediately."
        )
        return self.send_sms(phone, message, sms_type="login")

    def send_driver_assignment_sms(self, driver_name: str, phone: str, order_id: str) -> bool:
        """Send SMS when driver is assigned to delivery"""
        message = (
            f"KrishiBundle Order Assignment\n\n"
            f"Hi {driver_name},\n\n"
            f"You have been assigned to deliver order {order_id}.\n"
            f"Check your app for details."
        )
        return self.send_sms(phone, message, sms_type="assignment")

    def send_bundle_created_sms(self, farmer_name: str, phone: str, bundle_id: str, savings: int) -> bool:
        """Send SMS when bundle is created"""
        message = (
            f"KrishiBundle Bundle Created\n\n"
            f"Hi {farmer_name},\n\n"
            f"Your items have been bundled for delivery!\n"
            f"Bundle ID: {bundle_id}\n"
            f"Estimated Savings: ₹{savings}\n\n"
            f"Check your app for more details."
        )
        return self.send_sms(phone, message, sms_type="bundle_created")

    def send_trip_update_sms(self, user_name: str, phone: str, trip_id: str, status: str) -> bool:
        """Send SMS for trip status updates"""
        message = (
            f"KrishiBundle Trip Update\n\n"
            f"Hi {user_name},\n\n"
            f"Trip {trip_id} status: {status}\n"
            f"Check your app for real-time tracking."
        )
        return self.send_sms(phone, message, sms_type="trip_update")


# Global SMS service instance
sms_service = SMSService()


# Export functions for easier use
def send_registration_sms(name: str, phone: str, role: str) -> bool:
    """Send registration SMS"""
    return sms_service.send_registration_sms(name, phone, role)


def send_login_sms(name: str, phone: str) -> bool:
    """Send login SMS"""
    return sms_service.send_login_sms(name, phone)


def send_driver_assignment_sms(driver_name: str, phone: str, order_id: str) -> bool:
    """Send driver assignment SMS"""
    return sms_service.send_driver_assignment_sms(driver_name, phone, order_id)


def send_bundle_created_sms(farmer_name: str, phone: str, bundle_id: str, savings: int) -> bool:
    """Send bundle created SMS"""
    return sms_service.send_bundle_created_sms(farmer_name, phone, bundle_id, savings)


def send_trip_update_sms(user_name: str, phone: str, trip_id: str, status: str) -> bool:
    """Send trip update SMS"""
    return sms_service.send_trip_update_sms(user_name, phone, trip_id, status)
