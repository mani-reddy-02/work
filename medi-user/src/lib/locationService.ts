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
  { name: 'Uppal, Hyderabad', locality: 'Uppal', city: 'Hyderabad', state: 'Telangana', lat: 17.4018, lng: 78.5602 },
  { name: 'Jubilee Hills, Hyderabad', locality: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', lat: 17.4325, lng: 78.4071 },
  { name: 'Banjara Hills, Hyderabad', locality: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', lat: 17.4168, lng: 78.4485 },
  { name: 'Madhapur, Hyderabad', locality: 'Madhapur', city: 'Hyderabad', state: 'Telangana', lat: 17.4435, lng: 78.3772 },
  { name: 'Hitec City, Hyderabad', locality: 'Hitec City', city: 'Hyderabad', state: 'Telangana', lat: 17.4504, lng: 78.3808 },
  { name: 'Secunderabad', locality: 'MG Road', city: 'Secunderabad', state: 'Telangana', lat: 17.4399, lng: 78.4983 },
  { name: 'Gachibowli, Hyderabad', locality: 'Gachibowli', city: 'Hyderabad', state: 'Telangana', lat: 17.4401, lng: 78.3489 },
  { name: 'Kukatpally, Hyderabad', locality: 'Kukatpally', city: 'Hyderabad', state: 'Telangana', lat: 17.4849, lng: 78.4138 },
  { name: 'Begumpet, Hyderabad', locality: 'Begumpet', city: 'Hyderabad', state: 'Telangana', lat: 17.4447, lng: 78.4664 },
  { name: 'Charminar, Hyderabad', locality: 'Charminar', city: 'Hyderabad', state: 'Telangana', lat: 17.3616, lng: 78.4747 },
  { name: 'Adoni, Andhra Pradesh', locality: 'Adoni', city: 'Adoni', state: 'Andhra Pradesh', lat: 15.6322, lng: 77.2728 },
  { name: 'Alur Road, Adoni', locality: 'Alur Road', city: 'Adoni', state: 'Andhra Pradesh', lat: 15.6150, lng: 77.2950 },
  { name: 'Mantralayam, Andhra Pradesh', locality: 'Mantralayam', city: 'Mantralayam', state: 'Andhra Pradesh', lat: 15.9388, lng: 77.4269 },
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
  // 1. Query authoritative backend reverse-geocoding service (supports Nominatim with proper User-Agent)
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

  // 2. Direct Nominatim fallback
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
        let rawLocality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.quarter ||
          addr.subdistrict ||
          addr.village ||
          addr.town ||
          addr.city_district ||
          addr.road ||
          '';

        rawLocality = rawLocality.replace(/^Ward\s+\d+\s*/i, '').replace(/\s+mandal$/i, '').trim();

        let rawCity =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.village ||
          addr.county ||
          addr.state_district ||
          '';

        rawCity = rawCity.replace(/\s+mandal$/i, '').replace(/\s+district$/i, '').trim();

        const state = addr.state ? addr.state.trim() : null;
        const locality = rawLocality && rawLocality.toLowerCase() !== rawCity.toLowerCase() ? rawLocality : null;
        const city = rawCity || locality || state || 'Hyderabad';

        let label = '';
        if (locality && city) {
          label = `${locality}, ${city}`;
        } else if (city && state && city.toLowerCase() !== state.toLowerCase()) {
          label = `${city}, ${state}`;
        } else if (city) {
          label = city;
        } else {
          label = 'Location Detected';
        }

        return { label, city, locality, state };
      }
    }
  } catch (e) {
    // Fallback if nominatim network is slow or offline
  }

  // 3. Fallback to closest known verified locality if network geocoding failed
  let closestLoc: LocalityItem | null = null;
  let minDistance = Infinity;

  for (const loc of KNOWN_LOCALITIES) {
    const dist = calculateDistanceKm(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestLoc = loc;
    }
  }

  if (closestLoc && minDistance <= 25) {
    return {
      label: closestLoc.name,
      city: closestLoc.city,
      locality: closestLoc.locality || closestLoc.city,
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

/**
 * Detect approximate user location via IP when GPS is unavailable or blocked (e.g. over HTTP)
 */
export async function detectLocationByIp(): Promise<{
  latitude: number;
  longitude: number;
  city: string;
  locality?: string;
  state?: string;
  label: string;
} | null> {
  // 1. Fast reverse-geocode client
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const city = data.city || data.locality || data.principalSubdivision || 'Hyderabad';
        const locality = data.locality && data.locality !== city ? data.locality : undefined;
        const state = data.principalSubdivision || undefined;
        const label = locality ? `${locality}, ${city}` : state ? `${city}, ${state}` : city;
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city,
          locality,
          state,
          label,
        };
      }
    }
  } catch (e) {
    // Continue to next fallback
  }

  // 2. Reliable secondary IP location lookup
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const city = data.city || data.region || 'Hyderabad';
        const state = data.region || undefined;
        const label = state ? `${city}, ${state}` : city;
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city,
          state,
          label,
        };
      }
    }
  } catch (e) {
    // Fallback failed
  }

  return null;
}
