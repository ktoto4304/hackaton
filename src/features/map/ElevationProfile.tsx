import { useMemo } from 'react';
import type { ElevationPoint } from './elevation';

interface ElevationProfileProps {
  points: ElevationPoint[];
  flightHeightM: number;
  width?: number;
  height?: number;
}

export function ElevationProfile({
  points,
  flightHeightM,
  width = 400,
  height = 120,
}: ElevationProfileProps) {
  const { path, minEl, maxEl, maxDist, groundY } = useMemo(() => {
    if (!points.length) {
      return { path: '', minEl: 0, maxEl: 0, maxDist: 0, groundY: 0 };
    }
    const elevations = points.map((p) => p.elevationM);
    const minEl = Math.min(...elevations);
    const maxEl = Math.max(...elevations);
    const maxDist = points[points.length - 1].distanceKm;

    const padTop = 8;
    const padBottom = 24;
    const graphH = height - padTop - padBottom;

    const xFor = (i: number) => (points[i].distanceKm / maxDist) * (width - 40) + 30;
    const yFor = (e: number) => {
      const range = Math.max(maxEl - minEl, 1);
      return padTop + graphH - ((e - minEl) / range) * graphH;
    };

    let d = `M ${xFor(0)} ${yFor(points[0].elevationM)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${xFor(i)} ${yFor(points[i].elevationM)}`;
    }
    // Замыкаем вниз для заливки
    d += ` L ${xFor(points.length - 1)} ${height - padBottom}`;
    d += ` L ${xFor(0)} ${height - padBottom} Z`;

    // Высота полёта — горизонтальная линия над рельефом на средней высоте
    const avgEl = (minEl + maxEl) / 2;
    const flightY = yFor(avgEl + flightHeightM);

    return {
      path: d,
      minEl,
      maxEl,
      maxDist,
      groundY: flightY,
    };
  }, [points, flightHeightM, width, height]);

  if (!points.length) {
    return (
      <div className="text-xs text-muted-foreground">Нет данных профиля</div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <svg width={width} height={height} className="block">
        <defs>
          <linearGradient id="elev-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Заливка рельефа */}
        <path d={path} fill="url(#elev-fill)" stroke="#3b82f6" strokeWidth="1.5" />

        {/* Линия высоты полёта */}
        <line
          x1={30}
          x2={width - 10}
          y1={groundY}
          y2={groundY}
          stroke="#eab308"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text
          x={width - 12}
          y={groundY - 4}
          textAnchor="end"
          fontSize="10"
          fill="#eab308"
        >
          H + {flightHeightM} м
        </text>

        {/* Подписи осей */}
        <text x={30} y={height - 8} fontSize="10" fill="currentColor">
          0
        </text>
        <text x={width - 10} y={height - 8} fontSize="10" fill="currentColor" textAnchor="end">
          {maxDist.toFixed(1)} км
        </text>
        <text x={30} y={12} fontSize="10" fill="currentColor">
          {maxEl.toFixed(0)} м
        </text>
        <text x={30} y={height - 24} fontSize="10" fill="currentColor">
          {minEl.toFixed(0)} м
        </text>
      </svg>
    </div>
  );
}