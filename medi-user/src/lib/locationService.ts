import { API_BASE_URL } from './apiConfig';

export interface LocalityItem {
  name: string;
  locality?: string;
  city: string;
  state?: string;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
}

export const KNOWN_LOCALITIES: LocalityItem[] = [
  { name: 'Madanapalle, Andhra Pradesh', locality: 'Madanapalle', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5560, lng: 78.5010 },
  { name: 'BT College, Madanapalle', locality: 'BT College', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5510, lng: 78.5030 },
  { name: 'Neerugattuvaripalli, Madanapalle', locality: 'Neerugattuvaripalli', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5620, lng: 78.4980 },
  { name: 'CTM Road, Madanapalle', locality: 'CTM Road', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5580, lng: 78.5050 },
  { name: 'Basinikonda, Madanapalle', locality: 'Basinikonda', city: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5420, lng: 78.5120 },
  { name: 'Tirupati, Andhra Pradesh', locality: 'Tirupati', city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
  { name: 'Chittoor, Andhra Pradesh', locality: 'Chittoor', city: 'Chittoor', state: 'Andhra Pradesh', lat: 13.2172, lng: 79.1003 },
  { name: 'Kadapa, Andhra Pradesh', locality: 'Kadapa', city: 'Kadapa', state: 'Andhra Pradesh', lat: 14.4673, lng: 78.8242 },
  { name: 'Near Uppal, Hyderabad', locality: 'Uppal', city: 'Hyderabad', state: 'Telangana', lat: 17.4018, lng: 78.5602 },
  { name: 'Jubilee Hills, Hyderabad', locality: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', lat: 17.4325, lng: 78.4071 },
  { name: 'Banjara Hills, Hyderabad', locality: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', lat: 17.4168, lng: 78.4485 },
  { name: 'Madhapur, Hyderabad', locality: 'Madhapur', city: 'Hyderabad', state: 'Telangana', lat: 17.4435, lng: 78.3772 },
  { name: 'Hitec City, Hyderabad', locality: 'Hitec City', city: 'Hyderabad', state: 'Telangana', lat: 17.4504, lng: 78.3808 },
  { name: 'Secunderabad', locality: 'MG Road', city: 'Secunderabad', state: 'Telangana', lat: 17.4399, lng: 78.4983 },
  { name: 'Gachibowli, Hyderabad', locality: 'Gachibowli', city: 'Hyderabad', state: 'Telangana', lat: 17.4401, lng: 78.3489 },
  { name: 'Kukatpally, Hyderabad', locality: 'Kukatpally', city: 'Hyderabad', state: 'Telangana', lat: 17.4849, lng: 78.4138 },
  { name: 'Begumpet, Hyderabad', locality: 'Begumpet', city: 'Hyderabad', state: 'Telangana', lat: 17.4447, lng: 78.4664 },
  { name: 'Charminar, Hyderabad', locality: 'Charminar', city: 'Hyderabad', state: 'Telangana', lat: 17.3616, lng: 78.4747 },
  { name: 'Alur Road, Adoni', locality: 'Alur Road', city: 'Adoni', state: 'Andhra Pradesh', lat: 15.6150, lng: 77.2950 },
  { name: 'Narayanapuram, Adoni', locality: 'Narayanapuram', city: 'Adoni', state: 'Andhra Pradesh', lat: 15.6322, lng: 77.2728 },
  { name: 'Ramchandranagar, Mantralayam', locality: 'Ramchandranagar', city: 'Mantralayam', state: 'Andhra Pradesh', lat: 15.9388, lng: 77.4269 },
  { name: 'Bengaluru, Karnataka', locality: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai, Tamil Nadu', locality: 'Chennai', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kurnool, Andhra Pradesh', locality: 'Kurnool', city: 'Kurnool', state: 'Andhra Pradesh', lat: 15.8281, lng: 78.0373 },
  { name: 'Vijayawada, Andhra Pradesh', locality: 'Vijayawada', city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { name: 'Visakhapatnam, Andhra Pradesh', locality: 'Visakhapatnam', city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 }
];

export const DEFAULT_RADIUS_KM = 25;
export const EXPANDED_RADIUS_KM = 50;
export const MAX_RADIUS_KM = 100;

/**
 * Calculates Haversine distance in km between two coordinate points
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Formats distance into a human-friendly string (e.g. "2.4 km away" or "850 m away")
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm == null || distanceKm === Infinity || isNaN(distanceKm)) {
    return '';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Resolves a coordinate pair to a human-readable locality string
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<{ label: string; city: string | null; locality: string | null; state: string | null }> {
  // 1. Check if it's very close to one of our verified platform localities (within 5 km)
  let closestLoc: LocalityItem | null = null;
  let minDistance = Infinity;

  for (const loc of KNOWN_LOCALITIES) {
    const dist = calculateDistanceKm(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestLoc = loc;
    }
  }

  if (closestLoc && minDistance <= 6) {
    return {
      label: closestLoc.name.startsWith('Near') ? closestLoc.name : `Near ${closestLoc.name}`,
      city: closestLoc.city,
      locality: closestLoc.locality || closestLoc.city,
      state: closestLoc.state || null
    };
  }

  // 2. Query authoritative backend reverse-geocoding service (supports Nominatim with proper User-Agent)
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/public/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.label) {
        return json.data;
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // 3. Direct Nominatim fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.quarter ||
          addr.village ||
          addr.town ||
          addr.county ||
          '';
        const city = addr.city || addr.town || addr.county || addr.state_district || 'Hyderabad';
        const state = addr.state || '';

        const label = locality && locality !== city
          ? `Near ${locality}, ${city}`
          : `Near ${city}${state ? `, ${state}` : ''}`;

        return { label, city, locality, state };
      }
    }
  } catch (e) {
    // Fallback if nominatim network is slow or offline
  }

  // 3. Fallback to closest known city even if > 6 km
  if (closestLoc) {
    return {
      label: `Near ${closestLoc.city}`,
      city: closestLoc.city,
      locality: closestLoc.locality || null,
      state: closestLoc.state || null
    };
  }

  return {
    label: 'Location Detected',
    city: null,
    locality: null,
    state: null
  };
}

/**
 * Search localities based on query string
 */
export function searchKnownLocalities(query: string): LocalityItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return KNOWN_LOCALITIES;

  return KNOWN_LOCALITIES.filter(
    item =>
      item.name.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      (item.locality && item.locality.toLowerCase().includes(q)) ||
      (item.state && item.state.toLowerCase().includes(q)) ||
      (q === 'mpl' && item.city.toLowerCase() === 'madanapalle') ||
      (q === 'hyd' && item.city.toLowerCase() === 'hyderabad') ||
      (q.startsWith('madana') && item.city.toLowerCase() === 'madanapalle')
  );
}

export const searchLocalities = searchKnownLocalities;

/**
 * Fetch dynamic location configuration from backend
 */
export async function fetchBackendLocationConfig(): Promise<{
  defaultRadiusKm: number;
  maxRadiusKm: number;
  supportedLocalities: LocalityItem[];
} | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/location-config`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (e) {
    // Ignore network error and use defaults
  }
  return null;
}
