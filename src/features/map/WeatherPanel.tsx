import { useEffect, useState } from 'react';
import { Wind, Thermometer, CloudRain, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchWeather, assessWeather, type WeatherSnapshot } from './weather';

interface WeatherPanelProps {
  lat: number;
  lon: number;
  refreshKey?: number;
}

export function WeatherPanel({ lat, lon, refreshKey }: WeatherPanelProps) {
  const [data, setData] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const w = await fetchWeather(lat, lon);
      setData(w);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat.toFixed(2), lon.toFixed(2), refreshKey]);

  if (loading && !data) {
    return <div className="text-xs text-muted-foreground">Погода загружается…</div>;
  }
  if (error) {
    return (
      <div className="text-xs text-red-500 flex items-center gap-2">
        Погода недоступна
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={load}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }
  if (!data) return null;

  const assess = assessWeather(data);

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-1.5">
        <Wind className="h-3.5 w-3.5" />
        {data.windSpeedMs.toFixed(1)} м/с
        {data.windGustMs > data.windSpeedMs + 2 && (
          <span className="text-muted-foreground">(порывы {data.windGustMs.toFixed(1)})</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Thermometer className="h-3.5 w-3.5" />
        {data.temperatureC.toFixed(1)} °C
      </div>
      <div className="flex items-center gap-1.5">
        <CloudRain className="h-3.5 w-3.5" />
        {data.precipitationMm.toFixed(1)} мм
      </div>
      <div
        className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
          assess.ok
            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
            : 'bg-red-500/20 text-red-700 dark:text-red-400'
        }`}
      >
        {assess.ok ? 'Лётная' : assess.reason}
      </div>
    </div>
  );
}