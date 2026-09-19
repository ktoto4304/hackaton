export interface ElevationPoint {
  lon: number;
  lat: number;
  distanceKm: number;
  elevationM: number;
}

interface CacheEntry {
  data: ElevationPoint[];
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа

function cacheKey(points: [number, number][]): string {
  // Округляем координаты до 4 знаков — иначе кэш бесполезен
  const rounded = points.map(([lon, lat]) => `${lon.toFixed(4)},${lat.toFixed(4)}`);
  return rounded.slice(0, 50).join('|') + `|${points.length}`;
}

function haversineKm(
  a: [number, number],
  b: [number, number],
): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Запрашивает высоты для точек маршрута. Прореживает до maxSamples,
 * чтобы не превышать лимиты публичного API.
 */
export async function fetchElevationProfile(
  lonLatPoints: [number, number][],
  maxSamples = 50,
): Promise<ElevationPoint[]> {
  if (lonLatPoints.length < 2) return [];

  // Прореживание
  const step = Math.max(1, Math.floor(lonLatPoints.length / maxSamples));
  const sampled: [number, number][] = [];
  for (let i = 0; i < lonLatPoints.length; i += step) {
    sampled.push(lonLatPoints[i]);
  }
  if (sampled[sampled.length - 1] !== lonLatPoints[lonLatPoints.length - 1]) {
    sampled.push(lonLatPoints[lonLatPoints.length - 1]);
  }

  const key = cacheKey(sampled);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const body = {
    locations: sampled.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
  };

  const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Open-Elevation: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { results: { latitude: number; longitude: number; elevation: number }[] };

  // Считаем накопленное расстояние
  let distanceKm = 0;
  const out: ElevationPoint[] = json.results.map((r, i) => {
    if (i > 0) {
      const prev = sampled[i - 1];
      distanceKm += haversineKm(prev, [r.longitude, r.latitude]);
    }
    return {
      lon: r.longitude,
      lat: r.latitude,
      distanceKm,
      elevationM: r.elevation,
    };
  });

  cache.set(key, { data: out, fetchedAt: Date.now() });
  return out;
}