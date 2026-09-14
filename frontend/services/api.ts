import { bids, drivers, extraction, farmerOrders, recommendation, savingsTrend } from "@/services/demoData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  getOrders: async () => {
    const raw = await request<any[]>("/api/bookings", farmerOrders);
    return raw.map(o => ({
      id: o.id,
      farmerName: o.farmer_name || o.farmerName,
      phone: o.phone,
      village: o.village,
      crop: o.crop,
      weightKg: o.weight_kg || o.weightKg,
      status: o.status,
      destination: o.destination,
      individualCost: o.individual_cost || o.individualCost,
      sharedCost: o.shared_cost || o.sharedCost,
      pickupTime: o.pickup_time || o.pickupTime || "Awaiting cluster",
      source: o.source || "Web Dashboard",
      language: o.language || "en",
      confidence: o.confidence || null,
      reviewRequired: o.review_required || o.reviewRequired || false
    }));
  },
  getDrivers: async () => {
    const raw = await request<any[]>("/api/drivers", drivers);
    return raw.map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      vehicleNumber: d.vehicle_number || d.vehicleNumber,
      vehicleType: d.vehicle_type || d.vehicleType,
      licenseNumber: d.license_number || d.licenseNumber,
      reliabilityScore: d.reliability_score || d.reliabilityScore
    }));
  },
  getBids: async () => {
    const raw = await request<any[]>("/api/auction/bids", bids);
    return raw.map(b => ({
      id: b.id,
      driverName: b.driver_name || b.driverName,
      vehicle: b.vehicle,
      amount: b.amount,
      reliabilityScore: b.reliability_score || b.reliabilityScore,
      status: b.status
    }));
  },
  getAdminSnapshot: async () => {
    const raw = await request<any>("/api/admin/snapshot", {
      extraction,
      recommendation,
      savingsTrend,
      orders: farmerOrders,
      bids: bids
    });
    return {
      extraction: raw.extraction,
      recommendation: {
        farmers: raw.recommendation.farmers,
        totalWeightKg: raw.recommendation.total_weight_kg || raw.recommendation.totalWeightKg,
        truckUtilization: raw.recommendation.truck_utilization || raw.recommendation.truckUtilization,
        estimatedSavings: raw.recommendation.estimated_savings || raw.recommendation.estimatedSavings,
        spoilageRisk: raw.recommendation.spoilage_risk || raw.recommendation.spoilageRisk,
        departureTime: raw.recommendation.departure_time || raw.recommendation.departureTime
      },
      savingsTrend: raw.savingsTrend,
      orders: (raw.orders || []).map((o: any) => ({
        id: o.id,
        farmerName: o.farmer_name || o.farmerName,
        phone: o.phone,
        village: o.village,
        crop: o.crop,
        weightKg: o.weight_kg || o.weightKg,
        status: o.status,
        destination: o.destination,
        individualCost: o.individual_cost || o.individualCost,
        sharedCost: o.shared_cost || o.sharedCost,
        pickupTime: o.pickup_time || o.pickupTime || "Awaiting cluster",
        source: o.source || "Web Dashboard",
        language: o.language || "en",
        confidence: o.confidence || null,
        reviewRequired: o.review_required || o.reviewRequired || false
      })),
      bids: (raw.bids || []).map((b: any) => ({
        id: b.id,
        driverName: b.driver_name || b.driverName,
        vehicle: b.vehicle,
        amount: b.amount,
        reliabilityScore: b.reliability_score || b.reliabilityScore,
        status: b.status
      }))
    };
  },
  createBooking: async (payload: any) => {
    const o = await request<any>("/api/bookings", null, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const actualOrder = o || {
      id: `KB${Math.floor(1000 + Math.random() * 9000)}`,
      farmer_name: payload.farmer_name || payload.farmerName,
      phone: payload.phone,
      village: payload.village,
      crop: payload.crop,
      weight_kg: Number(payload.weight_kg || payload.weightKg),
      status: "Cluster Forming",
      destination: payload.destination || "Koyambedu Mandi",
      individual_cost: Number(payload.weight_kg || payload.weightKg) * 8.5,
      shared_cost: Number(payload.weight_kg || payload.weightKg) * 3.6,
      pickup_time: "Today, 5:30 PM",
      source: payload.source || "Web Dashboard",
      language: payload.language || "en",
      confidence: null,
      review_required: false
    };
    return {
      id: actualOrder.id,
      farmerName: actualOrder.farmer_name || actualOrder.farmerName,
      phone: actualOrder.phone,
      village: actualOrder.village,
      crop: actualOrder.crop,
      weightKg: actualOrder.weight_kg || actualOrder.weightKg,
      status: actualOrder.status,
      destination: actualOrder.destination,
      individualCost: actualOrder.individual_cost || actualOrder.individualCost,
      sharedCost: actualOrder.shared_cost || actualOrder.sharedCost,
      pickupTime: actualOrder.pickup_time || actualOrder.pickupTime || "Awaiting cluster",
      source: actualOrder.source || "Web Dashboard",
      language: actualOrder.language || "en",
      confidence: actualOrder.confidence || null,
      reviewRequired: actualOrder.review_required || actualOrder.reviewRequired || false
    };
  },
  submitBid: async (payload: any) => {
    const b = await request<any>("/api/auction/bids", null, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const actualBid = b || {
      id: payload.id || `BID-${Date.now()}`,
      driver_name: payload.driver_name || payload.driverName || "You",
      vehicle: payload.vehicle || "Mini Truck",
      amount: payload.amount,
      reliability_score: payload.reliability_score || payload.reliabilityScore || 94,
      status: "Open"
    };
    return {
      id: actualBid.id,
      driverName: actualBid.driver_name || actualBid.driverName,
      vehicle: actualBid.vehicle,
      amount: actualBid.amount,
      reliabilityScore: actualBid.reliability_score || actualBid.reliabilityScore,
      status: actualBid.status
    };
  },
  updateBooking: async (id: string, payload: any) => {
    const body = {
      farmer_name: payload.farmerName,
      phone: payload.phone,
      village: payload.village,
      crop: payload.crop,
      weight_kg: Number(payload.weightKg),
      destination: payload.destination || "Koyambedu Mandi"
    };
    const o = await request<any>(`/api/bookings/${id}`, null, {
      method: "PUT",
      body: JSON.stringify(body)
    });
    const actualOrder = o || {
      id: id,
      farmer_name: payload.farmerName,
      phone: payload.phone,
      village: payload.village,
      crop: payload.crop,
      weight_kg: Number(payload.weightKg),
      status: "Pending",
      destination: payload.destination || "Koyambedu Mandi",
      individual_cost: Number(payload.weightKg) * 8.5,
      shared_cost: Number(payload.weightKg) * 3.6,
      pickup_time: "Today, 5:30 PM",
      source: "Web Dashboard",
      language: "en",
      confidence: null,
      review_required: false
    };
    return {
      id: actualOrder.id,
      farmerName: actualOrder.farmer_name || actualOrder.farmerName,
      phone: actualOrder.phone,
      village: actualOrder.village,
      crop: actualOrder.crop,
      weightKg: actualOrder.weight_kg || actualOrder.weightKg,
      status: actualOrder.status,
      destination: actualOrder.destination,
      individualCost: actualOrder.individual_cost || actualOrder.individualCost,
      sharedCost: actualOrder.shared_cost || actualOrder.sharedCost,
      pickupTime: actualOrder.pickup_time || actualOrder.pickupTime || "Awaiting cluster",
      source: actualOrder.source || "Web Dashboard",
      language: actualOrder.language || "en",
      confidence: actualOrder.confidence || null,
      reviewRequired: actualOrder.review_required || actualOrder.reviewRequired || false
    };
  },
  uploadVoice: async (formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice/upload`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error("API fail");
      const data = await response.json();
      return {
        id: data.id,
        transcript: data.transcript,
        extracted: data.extracted,
        confidence: data.confidence,
        reviewRequired: data.review_required,
        booking: data.booking ? {
          id: data.booking.id,
          farmerName: data.booking.farmer_name,
          phone: data.booking.phone,
          village: data.booking.village,
          crop: data.booking.crop,
          weightKg: data.booking.weight_kg,
          status: data.booking.status,
          destination: data.booking.destination,
          individualCost: data.booking.individual_cost,
          sharedCost: data.booking.shared_cost,
          pickupTime: data.booking.pickup_time || "Awaiting cluster",
          source: data.booking.source || "Voice Call",
          language: data.booking.language || "en",
          confidence: data.booking.confidence || null,
          reviewRequired: data.booking.review_required || false
        } : null
      };
    } catch (err) {
      console.warn("Helpline API offline, using local mock extraction...", err);
      const language = (formData.get("language") as string) || "English";
      const transcript = (formData.get("transcript_text") as string) || "Hello from Athur";

      let extracted = { farmer_name: "Suresh", village: "Athur", crop: "Tomato", weight: 350 };
      let confidence = { farmer_name: 94, village: 92, crop: 96, weight: 97 };
      let reviewRequired = false;

      if (language === "Tamil") {
        extracted = { farmer_name: "Arumugam", village: "Melma", crop: "Tomato", weight: 400 };
        confidence = { farmer_name: 94, village: 92, crop: 96, weight: 97 };
      } else if (language === "Hindi") {
        extracted = { farmer_name: "Ramesh", village: "Sevoor", crop: "Eggplant", weight: 200 };
        confidence = { farmer_name: 65, village: 88, crop: 90, weight: 58 };
        reviewRequired = true;
      }

      const bookingId = `KB${Math.floor(1000 + Math.random() * 9000)}`;

      return {
        id: bookingId,
        transcript: transcript,
        extracted: extracted,
        confidence: confidence,
        reviewRequired: reviewRequired,
        booking: {
          id: bookingId,
          farmerName: extracted.farmer_name,
          phone: "+91 90000 00000",
          village: extracted.village,
          crop: extracted.crop,
          weightKg: extracted.weight,
          status: "Cluster Forming",
          destination: "Koyambedu Mandi",
          individualCost: extracted.weight * 8.5,
          sharedCost: extracted.weight * 3.6,
          pickupTime: "Today, 5:30 PM",
          source: "Voice Call",
          language: language === "Tamil" ? "ta" : language === "Hindi" ? "hi" : "en",
          confidence: confidence,
          reviewRequired: reviewRequired
        }
      };
    }
  }
};

