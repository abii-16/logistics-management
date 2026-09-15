export type OrderStatus =
  | "Pending"
  | "Cluster Forming"
  | "Driver Assigned"
  | "In Transit"
  | "Completed";

export type FarmerOrder = {
  id: string;
  farmerName: string;
  phone: string;
  village: string;
  crop: string;
  weightKg: number;
  status: OrderStatus;
  destination: string;
  individualCost: number;
  sharedCost: number;
  pickupTime: string;
  pickupDate?: string;
  pickupSlot?: "morning" | "afternoon" | "evening";
  isTimeFlexible?: boolean;
  source?: string;
  language?: string;
  confidence?: Record<string, number> | null;
  reviewRequired?: boolean;
  assignedDriver?: string | null;
  finalCost?: number | null;
};

export type Driver = {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  licenseNumber: string;
  reliabilityScore: number;
};

export type Bid = {
  id: string;
  driverName: string;
  vehicle: string;
  amount: number;
  reliabilityScore: number;
  status: "Leading" | "Open" | "Accepted";
};

export type AIExtraction = {
  transcript: string;
  extracted: {
    farmer_name: string;
    village: string;
    crop: string;
    weight: number;
  };
  confidence: {
    farmer_name: number;
    village: number;
    crop: number;
    weight: number;
  };
};

export type Recommendation = {
  farmers: number;
  totalWeightKg: number;
  truckUtilization: number;
  estimatedSavings: number;
  spoilageRisk: "Low" | "Medium" | "High";
  departureTime: string;
};

export type SavingsPoint = {
  label: string;
  value: number;
};

export type TimeSlot = "morning" | "afternoon" | "evening";

export type SlotBid = {
  id: string;
  driverId?: string | null;  // Made optional since it can be NULL
  driverName: string;
  pickupDate: string;
  pickupSlot: TimeSlot;
  amount: number;  // Changed from bidAmount to match backend
  vehicle: string;
  reliabilityScore: number;
  bidType: "slot";
  status: "Open" | "Accepted" | "Rejected";
  createdAt: string;
};

export type SlotBidCreate = {
  driver_id: string;
  driver_name: string;
  pickup_date: string;
  pickup_slot: TimeSlot;
  amount: number;  // Changed from bid_amount to match backend
  vehicle: string;
  reliability_score?: number;
};

