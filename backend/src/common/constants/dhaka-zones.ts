export interface DhakaZone {
  id: string;
  name: string;
  corridor: string;
}

export const DHAKA_ZONES: Record<string, DhakaZone> = {
  BANANI: { id: 'BANANI', name: 'Banani', corridor: 'CENTRAL_NORTH' },
  MOHAKHALI: { id: 'MOHAKHALI', name: 'Mohakhali', corridor: 'CENTRAL_CONNECT' },
  GULSHAN_1: { id: 'GULSHAN_1', name: 'Gulshan 1', corridor: 'CENTRAL_CONNECT' },
  GULSHAN_2: { id: 'GULSHAN_2', name: 'Gulshan 2', corridor: 'CENTRAL_NORTH' },
  UTTARA: { id: 'UTTARA', name: 'Uttara', corridor: 'NORTH_SUBURB' },
  FARMGATE: { id: 'FARMGATE', name: 'Farmgate', corridor: 'CENTRAL_SOUTH' },
  DHANMONDI: { id: 'DHANMONDI', name: 'Dhanmondi', corridor: 'WEST_SOUTH' },
  MIRPUR: { id: 'MIRPUR', name: 'Mirpur', corridor: 'WEST_NORTH' },
};

// Approximate road distances in km between Dhaka zones (based on road routes, not straight-line)
export const ZONE_DISTANCES_KM: Record<string, Record<string, number>> = {
  BANANI: {
    MOHAKHALI: 3.2,
    GULSHAN_1: 2.8,
    GULSHAN_2: 2.0,
    UTTARA: 9.5,
    FARMGATE: 5.5,
    DHANMONDI: 8.0,
    MIRPUR: 7.2,
  },
  MOHAKHALI: {
    BANANI: 3.2,
    GULSHAN_1: 2.0,
    FARMGATE: 3.5,
  },
  GULSHAN_1: {
    BANANI: 2.8,
    MOHAKHALI: 2.0,
    GULSHAN_2: 1.8,
  },
};

/**
 * Corridor Matching Rule):
 *
 * Two ride requests are pool-compatible when ALL three conditions hold:
 *
 *   1. Same pickup zone — driver picks up all passengers from one location.
 *   2. Same named corridor — both dropoffs lie in the same geographic direction
 *      from the pickup (prevents cross-city zig-zag routes).
 *   3. Dropoff distance difference <= 3.0 km — limits driver detour to a
 *      reasonable extra distance given Dhaka's heavy traffic conditions.
 *      (5 km detour in Dhaka can mean 20-30 min extra; 3 km keeps it fair.)
 *
 * Example — Nusrat (Banani->Mohakhali) and Rafiq (Banani->Gulshan 1):
 *   Rule 1: Same pickup — Banani ✓
 *   Rule 2: Same corridor — CENTRAL_CONNECT ✓
 *   Rule 3: Detour diff — |3.2 - 2.8| = 0.4 km ≤ 3.0 km ✓
 *   Result: Compatible → can share Bullet.
 */
export function areRoutesCompatible(
  pickupA: string,
  dropoffA: string,
  pickupB: string,
  dropoffB: string,
): boolean {
  const pA = pickupA.toUpperCase();
  const dA = dropoffA.toUpperCase();
  const pB = pickupB.toUpperCase();
  const dB = dropoffB.toUpperCase();

  // Rule 1: Must share the same pickup zone
  if (pA !== pB) return false;

  // Rule 2: Dropoffs must lie on the same named corridor
  const zoneA = DHAKA_ZONES[dA];
  const zoneB = DHAKA_ZONES[dB];
  if (!zoneA || !zoneB) return false;
  if (zoneA.corridor !== zoneB.corridor) return false;

  // Rule 3: Dropoff distance difference must be <= 3.0 km (Dhaka traffic threshold)
  const distA = ZONE_DISTANCES_KM[pA]?.[dA] ?? ZONE_DISTANCES_KM[dA]?.[pA] ?? 0;
  const distB = ZONE_DISTANCES_KM[pB]?.[dB] ?? ZONE_DISTANCES_KM[dB]?.[pB] ?? 0;
  const detourDiff = Math.abs(distA - distB);

  return detourDiff <= 3.0;
}
