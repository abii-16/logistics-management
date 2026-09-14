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
  source?: string;
  language?: string;
  confidence?: Record<string, number> | null;
  reviewRequired?: boolean;
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

