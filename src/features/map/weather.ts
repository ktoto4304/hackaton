export interface WeatherSnapshot {
  windSpeedMs: number;
  windGustMs: number;
  windDirectionDeg: number;
  temperatureC: number;
  precipitationMm: number;
  fetchedAt: string;
  lat: number;
  lon: number;
}

const cache = new Map<string, { data: WeatherSnapshot; at: number }>();
const TTL_MS = 10 * 60 * 1000; // 10 минут

export async function fetchWeather(lat: number, lon: number): Promise<WeatherSnapshot> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set(
    'current',
    'temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m',
  );
  url.searchParams.set('wind_speed_unit', 'ms');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);

  const json = (await res.json()) as any;
  const c = json.current ?? {};

  const data: WeatherSnapshot = {
    windSpeedMs: Number(c.wind_speed_10m ?? 0),
    windGustMs: Number(c.wind_gusts_10m ?? 0),
    windDirectionDeg: Number(c.wind_direction_10m ?? 0),
    temperatureC: Number(c.temperature_2m ?? 0),
    precipitationMm: Number(c.precipitation ?? 0),
    fetchedAt: new Date().toISOString(),
    lat,
    lon,
  };

  cache.set(key, { data, at: Date.now() });
  return data;
}

/** Проверка: подходит ли погода для полётов. */
export function assessWeather(w: WeatherSnapshot): {
  ok: boolean;
  reason?: string;
} {
  if (w.windGustMs > 15) {
    return { ok: false, reason: `Порывы ветра ${w.windGustMs.toFixed(1)} м/с > 15` };
  }
  if (w.windSpeedMs > 10) {
    return { ok: false, reason: `Ветер ${w.windSpeedMs.toFixed(1)} м/с > 10` };
  }
  if (w.precipitationMm > 0.5) {
    return { ok: false, reason: `Осадки ${w.precipitationMm.toFixed(1)} мм` };
  }
  if (w.temperatureC < -10 || w.temperatureC > 40) {
    return { ok: false, reason: `Температура ${w.temperatureC.toFixed(0)}°C вне диапазона` };
  }
  return { ok: true };
}