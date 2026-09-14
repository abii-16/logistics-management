/**
 * SMS Service for Frontend
 * Sends SMS notifications after registration and login
 * Non-blocking: if SMS fails, auth still succeeds
 */

const SMS_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/**
 * Call backend SMS endpoint
 */
async function sendSMSRequest(endpoint: string, payload: any): Promise<boolean> {
  try {
    const response = await fetch(`${SMS_API_URL}/api/sms${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      console.warn(`SMS request failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    return data.success !== false;
  } catch (error) {
    console.error("SMS request error:", error);
    return false;
  }
}

/**
 * Send registration success SMS
 */
export async function sendRegistrationSMS(
  name: string,
  phone: string,
  role: "farmer" | "driver"
): Promise<boolean> {
  console.log(`Sending registration SMS to ${phone}...`);
  
  const success = await sendSMSRequest("/registration", {
    name,
    phone,
    role
  });

  if (success) {
    console.log("Registration SMS sent successfully");
  } else {
    console.warn("Registration SMS failed - but auth will continue");
  }

  return success;
}

/**
 * Send login alert SMS
 */
export async function sendLoginSMS(name: string, phone: string): Promise<boolean> {
  console.log(`Sending login SMS to ${phone}...`);
  
  const success = await sendSMSRequest("/login", {
    name,
    phone
  });

  if (success) {
    console.log("Login SMS sent successfully");
  } else {
    console.warn("Login SMS failed - but auth will continue");
  }

  return success;
}

/**
 * Send driver assignment SMS
 */
export async function sendDriverAssignmentSMS(
  driverName: string,
  phone: string,
  orderId: string
): Promise<boolean> {
  console.log(`Sending driver assignment SMS to ${phone}...`);
  
  return sendSMSRequest("/driver-assignment", {
    driver_name: driverName,
    phone,
    order_id: orderId
  });
}

/**
 * Send bundle created SMS
 */
export async function sendBundleCreatedSMS(
  farmerName: string,
  phone: string,
  bundleId: string,
  savings: number
): Promise<boolean> {
  console.log(`Sending bundle created SMS to ${phone}...`);
  
  return sendSMSRequest("/bundle-created", {
    farmer_name: farmerName,
    phone,
    bundle_id: bundleId,
    savings
  });
}

/**
 * Send trip update SMS
 */
export async function sendTripUpdateSMS(
  userName: string,
  phone: string,
  tripId: string,
  status: string
): Promise<boolean> {
  console.log(`Sending trip update SMS to ${phone}...`);
  
  return sendSMSRequest("/trip-update", {
    user_name: userName,
    phone,
    trip_id: tripId,
    status
  });
}

/**
 * Send generic SMS (for testing/custom messages)
 */
export async function sendCustomSMS(phone: string, message: string): Promise<boolean> {
  console.log(`Sending custom SMS to ${phone}...`);
  
  return sendSMSRequest("/custom", {
    phone,
    message
  });
}
