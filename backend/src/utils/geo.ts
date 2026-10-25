/**
 * Geographic distance and location utility
 */

export const DEFAULT_NEARBY_RADIUS_KM = process.env.NEARBY_SEARCH_RADIUS_KM
  ? parseFloat(process.env.NEARBY_SEARCH_RADIUS_KM)
  : 25; // 25 km default search radius

/**
 * Calculates great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 (in degrees)
 * @param lon1 Longitude of point 1 (in degrees)
 * @param lat2 Latitude of point 2 (in degrees)
 * @param lon2 Longitude of point 2 (in degrees)
 * @returns Distance in kilometers rounded to 1 decimal place (e.g. 2.4)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  // Exact same point
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Formats a distance in kilometers into a human-friendly string.
 * Examples: "800 m away", "2.4 km away".
 */
export function formatDistanceText(distanceKm: number): string {
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
 * Parses and validates coordinates and radius from request query.
 */
export function parseGeoParams(query: Record<string, any>): {
  lat: number | null;
  lng: number | null;
  radius: number;
  hasCoords: boolean;
  nearbyOnly: boolean;
} {
  const rawLat = query.lat !== undefined ? parseFloat(String(query.lat)) : null;
  const rawLng = query.lng !== undefined ? parseFloat(String(query.lng)) : null;
  const rawRadius = query.radius !== undefined ? parseFloat(String(query.radius)) : null;

  const validLat =
    rawLat !== null && !isNaN(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : null;
  const validLng =
    rawLng !== null && !isNaN(rawLng) && rawLng >= -180 && rawLng <= 180 ? rawLng : null;

  const hasCoords = validLat !== null && validLng !== null;

  const radius =
    rawRadius !== null && !isNaN(rawRadius) && rawRadius > 0
      ? Math.min(Math.max(rawRadius, 1), 200)
      : DEFAULT_NEARBY_RADIUS_KM;

  const nearbyOnly =
    query.nearbyOnly === 'true' || query.nearbyOnly === true || (hasCoords && query.nearbyOnly !== 'false');

  return {
    lat: validLat,
    lng: validLng,
    radius,
    hasCoords,
    nearbyOnly,
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const PINCODE_MAP: Record<string, Coordinates> = {
  // Madanapalle
  '517325': { latitude: 13.5560, longitude: 78.5010 },
  '517326': { latitude: 13.5510, longitude: 78.5030 },
  '517327': { latitude: 13.5620, longitude: 78.4980 },
  '517328': { latitude: 13.5580, longitude: 78.5050 },
  // Adoni
  '518301': { latitude: 15.6150, longitude: 77.2950 },
  '518302': { latitude: 15.6322, longitude: 77.2728 },
  // Mantralayam
  '518345': { latitude: 15.9388, longitude: 77.4269 },
  // Tirupati
  '517501': { latitude: 13.6288, longitude: 79.4192 },
  '517507': { latitude: 13.6288, longitude: 79.4192 },
  // Chittoor
  '517001': { latitude: 13.2172, longitude: 79.1003 },
  // Kadapa
  '516001': { latitude: 14.4673, longitude: 78.8242 },
  // Kurnool
  '518001': { latitude: 15.8281, longitude: 78.0373 },
  '518002': { latitude: 15.8281, longitude: 78.0373 },
  // Anantapur
  '515001': { latitude: 14.6819, longitude: 77.6006 },
  // Vijayawada
  '520001': { latitude: 16.5062, longitude: 80.6480 },
  // Guntur
  '522001': { latitude: 16.3067, longitude: 80.4365 },
  // Visakhapatnam
  '530001': { latitude: 17.6868, longitude: 83.2185 },
  // Hyderabad areas
  '500001': { latitude: 17.3850, longitude: 78.4867 },
  '500003': { latitude: 17.4399, longitude: 78.4983 },
  '500033': { latitude: 17.4325, longitude: 78.4071 }, // Jubilee Hills
  '500034': { latitude: 17.4168, longitude: 78.4485 }, // Banjara Hills
  '500039': { latitude: 17.4018, longitude: 78.5602 }, // Uppal
  '500081': { latitude: 17.4435, longitude: 78.3772 }, // Madhapur / Hitec City
  '500032': { latitude: 17.4401, longitude: 78.3489 }, // Gachibowli
  '500072': { latitude: 17.4849, longitude: 78.4138 }, // Kukatpally
};

const CITY_KEYWORD_MAP: Array<{ keywords: string[]; coords: Coordinates }> = [
  { keywords: ['madanapalle', 'madanapalli', 'mpl'], coords: { latitude: 13.5560, longitude: 78.5010 } },
  { keywords: ['bt college'], coords: { latitude: 13.5510, longitude: 78.5030 } },
  { keywords: ['neerugattuvaripalli'], coords: { latitude: 13.5620, longitude: 78.4980 } },
  { keywords: ['jubilee hills'], coords: { latitude: 17.4325, longitude: 78.4071 } },
  { keywords: ['banjara hills'], coords: { latitude: 17.4168, longitude: 78.4485 } },
  { keywords: ['uppal'], coords: { latitude: 17.4018, longitude: 78.5602 } },
  { keywords: ['madhapur', 'mindspace'], coords: { latitude: 17.4435, longitude: 78.3772 } },
  { keywords: ['hitec city', 'cyber towers'], coords: { latitude: 17.4504, longitude: 78.3808 } },
  { keywords: ['gachibowli'], coords: { latitude: 17.4401, longitude: 78.3489 } },
  { keywords: ['kukatpally'], coords: { latitude: 17.4849, longitude: 78.4138 } },
  { keywords: ['secunderabad'], coords: { latitude: 17.4399, longitude: 78.4983 } },
  { keywords: ['hyderabad'], coords: { latitude: 17.4018, longitude: 78.5602 } },
  { keywords: ['adoni'], coords: { latitude: 15.6322, longitude: 77.2728 } },
  { keywords: ['mantralayam'], coords: { latitude: 15.9388, longitude: 77.4269 } },
  { keywords: ['tirupati'], coords: { latitude: 13.6288, longitude: 79.4192 } },
  { keywords: ['chittoor'], coords: { latitude: 13.2172, longitude: 79.1003 } },
  { keywords: ['kadapa', 'cuddapah'], coords: { latitude: 14.4673, longitude: 78.8242 } },
  { keywords: ['kurnool'], coords: { latitude: 15.8281, longitude: 78.0373 } },
  { keywords: ['anantapur'], coords: { latitude: 14.6819, longitude: 77.6006 } },
  { keywords: ['bengaluru', 'bangalore'], coords: { latitude: 12.9716, longitude: 77.5946 } },
  { keywords: ['chennai', 'madras'], coords: { latitude: 13.0827, longitude: 80.2707 } },
  { keywords: ['vijayawada'], coords: { latitude: 16.5062, longitude: 80.6480 } },
  { keywords: ['guntur'], coords: { latitude: 16.3067, longitude: 80.4365 } },
  { keywords: ['visakhapatnam', 'vizag'], coords: { latitude: 17.6868, longitude: 83.2185 } },
  { keywords: ['warangal'], coords: { latitude: 17.9689, longitude: 79.5941 } },
];

export function resolveCoordinatesForLocation(params?: {
  city?: string | null;
  pincode?: string | null;
  state?: string | null;
  area?: string | null;
  address?: string | null;
}): Coordinates | null {
  if (!params) return null;

  // 1. Check exact pincode match
  if (params.pincode) {
    const pin = params.pincode.replace(/\D/g, '');
    if (PINCODE_MAP[pin]) {
      return PINCODE_MAP[pin];
    }
    if (pin.startsWith('500')) {
      return { latitude: 17.4018, longitude: 78.5602 };
    }
    if (pin.startsWith('560')) {
      return { latitude: 12.9716, longitude: 77.5946 };
    }
    if (pin.startsWith('600')) {
      return { latitude: 13.0827, longitude: 80.2707 };
    }
  }

  // 2. Check text matches in locality, city, area, address
  const fullText = [params.area, params.city, params.address, params.state]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (fullText) {
    for (const item of CITY_KEYWORD_MAP) {
      if (item.keywords.some(k => fullText.includes(k))) {
        return item.coords;
      }
    }
  }

  return null;
}

export function getEffectiveCoordinates(
  entity?: {
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    pincode?: string | null;
    pinCode?: string | null;
    state?: string | null;
    area?: string | null;
    address?: string | null;
    addressLine1?: string | null;
  } | null,
  fallbackEntity?: {
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    pincode?: string | null;
    pinCode?: string | null;
    state?: string | null;
    area?: string | null;
    address?: string | null;
    addressLine1?: string | null;
  } | null
): Coordinates | null {
  if (entity) {
    if (
      entity.latitude != null &&
      entity.longitude != null &&
      !isNaN(Number(entity.latitude)) &&
      !isNaN(Number(entity.longitude))
    ) {
      return {
        latitude: Number(entity.latitude),
        longitude: Number(entity.longitude)
      };
    }

    const resolved = resolveCoordinatesForLocation({
      city: entity.city,
      pincode: entity.pincode || entity.pinCode,
      state: entity.state,
      area: entity.area,
      address: entity.address || entity.addressLine1
    });

    if (resolved) return resolved;
  }

  if (fallbackEntity) {
    return getEffectiveCoordinates(fallbackEntity);
  }

  return null;
}

