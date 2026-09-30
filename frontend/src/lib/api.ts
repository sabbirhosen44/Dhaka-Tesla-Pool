const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dtp_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as unknown as T);
}

// Auth
export const getActors = () => apiFetch<Actor[]>('/auth/actors');
export const demoLogin = (actorName: string) =>
  apiFetch<LoginResponse>('/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ name: actorName, actorName }),
  });
export const getMe = () => apiFetch<UserProfile>('/auth/me');

// Ride Requests
export const createRideRequest = (dto: CreateRideRequestDto) =>
  apiFetch<RideRequest>('/ride-requests', { method: 'POST', body: JSON.stringify(dto) });
export const getMyHistory = () => apiFetch<RideRequest[]>('/ride-requests/my-history');
export const getRideRequest = (id: string) => apiFetch<RideRequest>(`/ride-requests/${id}`);
export const cancelRideRequest = (id: string) =>
  apiFetch<RideRequest>(`/ride-requests/${id}/cancel`, { method: 'POST' });

// Pool Engine (Driver)
export const getActivePool = () => apiFetch<Pool>('/pools/active');
export const poolAction = (poolId: string, action: TripAction) =>
  apiFetch<Pool>(`/pools/${poolId}/action`, { method: 'POST', body: JSON.stringify({ action }) });

// Vehicle
export const getBullet = () => apiFetch<Vehicle>('/vehicles/bullet');
export const getMyVehicle = () => apiFetch<Vehicle>('/vehicles/driver/me');
export const getAllVehicles = (onlineOnly = false) =>
  apiFetch<Vehicle[]>(`/vehicles${onlineOnly ? '?onlineOnly=true' : ''}`);
export const getManifest = (vehicleId: string) =>
  apiFetch<VehicleManifest>(`/vehicles/${vehicleId}/manifest`);

// SSE Sync
export const SSE_URL = `${API_BASE}/sync/stream`;

// Types
export interface Actor {
  id: string;
  name: string;
  role: 'DRIVER' | 'PASSENGER';
  phone: string;
}

export interface LoginResponse {
  accessToken: string;
  access_token?: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'DRIVER' | 'PASSENGER';
  phone: string;
}

export interface CreateRideRequestDto {
  pickupZone: string;
  dropoffZone: string;
  seatsRequested?: number;
  preferredVehicleId?: string;
}

export interface RideRequest {
  id: string;
  status: string;
  pickupZone: string;
  dropoffZone: string;
  seatsRequested?: number;
  fareInPoysha: number;
  corridor?: string;
  createdAt: string;
  pool?: Pool;
}

export interface Pool {
  id: string;
  status: string;
  corridor: string;
  members: PoolMember[];
  vehicle?: Vehicle;
}

export interface PoolMember {
  id: string;
  passenger: UserProfile;
  fareInPoysha: number;
  joinedAt: string;
}

export interface Vehicle {
  id: string;
  name?: string;
  model?: string;
  plate?: string;
  capacity: number;
  isOnline: boolean;
  driver?: UserProfile;
}

export interface ManifestPassenger {
  memberId?: string;
  rideRequestId?: string;
  passengerName?: string;
  name?: string;
  passengerPhone?: string;
  phone?: string;
  pickupZone?: string;
  dropoffZone?: string;
  seatsAllocated?: number;
  finalFarePoysha?: number;
  finalFareBDT?: string;
}

export interface VehicleManifest {
  vehicleId?: string;
  model?: string;
  capacity?: number;
  totalCapacity?: number;
  occupiedSeats?: number;
  seatsOccupied?: number;
  availableSeats?: number;
  seatsRemaining?: number;
  isOnline?: boolean;
  driver?: UserProfile;
  passengers?: ManifestPassenger[];
  vehicle?: Vehicle;
}

export type TripAction = 'ARRIVE' | 'START' | 'COMPLETE';
