export type UserRole = "admin" | "employee";

export type CarStatus = "available" | "maintenance" | "inactive";

export type DriverStatus = "available" | "inactive";

export type RideStatus =
  | "pending"
  | "assigned"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserLean {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface CarLean {
  _id: string;
  name: string;
  plateNumber: string;
  model?: string;
  seatCapacity?: number;
  status: CarStatus;
  notes?: string;
  createdAt: string;
}

export interface DriverLean {
  _id: string;
  name: string;
  phone: string;
  licenseNumber?: string;
  status: DriverStatus;
  notes?: string;
  createdAt: string;
}

export interface PickupPointLean {
  _id: string;
  name: string;
  address: string;
  landmark?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface RouteLean {
  _id: string;
  name: string;
  description?: string;
  pickupPoints: ({ _id: string; name: string; address: string } | string)[];
  destination: string;
  estimatedDistanceKm?: number;
  estimatedDurationMinutes?: number;
  active: boolean;
  createdAt: string;
}

export type FuelType = "petrol" | "diesel" | "octane" | "cng" | "other";

export interface FuelEntryLean {
  _id: string;
  car: { _id: string; name: string; plateNumber: string } | string;
  driver?: { _id: string; name: string } | string | null;
  recordedBy?: { _id: string; name: string } | string;
  date: string;
  odometerReading: number;
  fuelQuantity: number;
  pricePerUnit: number;
  totalCost: number;
  fuelType: FuelType;
  vendor?: string;
  notes?: string;
  createdAt: string;
}

export interface RideLean {
  _id: string;
  employee: { _id: string; name: string; email: string; department?: string } | string;
  purpose: string;
  pickupLocation: string;
  dropLocation: string;
  route?: { _id: string; name: string } | string | null;
  pickupPoint?: { _id: string; name: string; address: string } | string | null;
  rideDate: string;
  startTime: string;
  endTime?: string;
  passengers?: number;
  status: RideStatus;
  car?: { _id: string; name: string; plateNumber: string } | string | null;
  driver?: { _id: string; name: string; phone: string } | string | null;
  createdBy?: { _id: string; name: string } | string;
  assignedBy?: { _id: string; name: string } | string | null;
  assignedAt?: string | null;
  completedBy?: { _id: string; name: string } | string | null;
  completedAt?: string | null;
  statusChangedByRole?: "admin" | "employee" | null;
  remarks?: string;
  createdAt: string;
}
