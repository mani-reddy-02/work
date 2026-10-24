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
