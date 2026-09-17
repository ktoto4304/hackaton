import { useEffect, useRef, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import Draw from 'ol/interaction/Draw';
import GeoJSON from 'ol/format/GeoJSON';
import DragPan from 'ol/interaction/DragPan';
import 'ol/ol.css';
import { Button } from '@/components/ui/button';
import { notification } from 'antd';
import { planMultiPath } from 'planefill';

// --- Стили ---
const pointStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: '#dc2626' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
});

const polygonStyle = new Style({
  fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
  stroke: new Stroke({ color: '#3b82f6', width: 2 }),
});

const ROUTE_COLORS = ['#16a34a', '#eab308', '#ec4899', '#8b5cf6', '#f97316'];

function makeRouteStyle(droneId: number) {
  return new Style({
    stroke: new Stroke({
      color: ROUTE_COLORS[droneId % ROUTE_COLORS.length],
      width: 3,
    }),
  });
}

const INITIAL_RUNWAYS: { lonLat: [number, number]; name: string }[] = [
  { lonLat: [37.6173, 55.7558], name: 'ВПП №1 (основная)' },
  { lonLat: [37.621, 55.758], name: 'ВПП №2 (запасная)' },
  { lonLat: [37.613, 55.752], name: 'ВПП №3 (резерв)' },
];

const INITIAL_POLYGON_LONLAT: [number, number][] = [
  [37.61, 55.749],
  [37.61, 55.76],
  [37.625, 55.76],
  [37.625, 55.749],
  [37.61, 55.749],
];

type DrawMode = 'none' | 'polygon' | 'point';

interface RouteResult {
  droneId: number;
  lengthKm: number;
  timeMin: number;
  photos: number;
}

interface SurveyMapProps {
  onRoutesCalculated?: (routes: RouteResult[]) => void;
}

export function SurveyMap({ onRoutesCalculated }: SurveyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const pointsSourceRef = useRef<VectorSource | null>(null);
  const polygonSourceRef = useRef<VectorSource | null>(null);
  const routeSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);

  const [mode, setMode] = useState<DrawMode>('none');
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [hasPolygon, setHasPolygon] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lon: number; lat: number } | null>(null);
  const [zoom, setZoom] = useState(14);

  const fitToFeatures = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const sources = [
      pointsSourceRef.current,
      polygonSourceRef.current,
      routeSourceRef.current,
    ];
    const allFeatures = sources.flatMap((s) => s?.getFeatures() ?? []);
    if (allFeatures.length === 0) return;

    const combined = allFeatures.reduce<number[] | null>((acc, f) => {
      const ext = f.getGeometry()?.getExtent();
      if (!ext) return acc;
      if (!acc) return ext;
      return [
        Math.min(acc[0], ext[0]),
        Math.min(acc[1], ext[1]),
        Math.max(acc[2], ext[2]),
        Math.max(acc[3], ext[3]),
      ];
    }, null);

    if (!combined) return;
    if (!isFinite(combined[0]) || !isFinite(combined[3])) return;

    map.getView().fit(combined as [number, number, number, number], {
      padding: [50, 50, 50, 50],
      maxZoom: 16,
      duration: 500,
    });
  }, []);

  const resetDragPan = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof DragPan) {
        interaction.setActive(false);
        setTimeout(() => interaction.setActive(true), 0);
      }
    });
  }, []);

  // --- Инициализация карты ---
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    let cancelled = false;
    let retryCount = 0;
    const MAX_RETRIES = 60;

    const createMap = () => {
      if (cancelled) return;
      const el = mapRef.current;
      if (!el) return;

      if (el.clientHeight === 0 || el.clientWidth === 0) {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          requestAnimationFrame(createMap);
        } else {
          console.warn(
            'SurveyMap: контейнер карты так и не получил размеры',
            { w: el.clientWidth, h: el.clientHeight }
          );
        }
        return;
      }

      const pointsSource = new VectorSource();
      INITIAL_RUNWAYS.forEach(({ lonLat, name }) => {
        const f = new Feature({ geometry: new Point(fromLonLat(lonLat)), name });
        f.setStyle(pointStyle);
        pointsSource.addFeature(f);
      });

      const polygonSource = new VectorSource();
      const polygonFeature = new Feature({
        geometry: new Polygon([
          INITIAL_POLYGON_LONLAT.map(([lon, lat]) => fromLonLat([lon, lat])),
        ]),
      });
      polygonFeature.setStyle(polygonStyle);
      polygonSource.addFeature(polygonFeature);

      const routeSource = new VectorSource();

      const map = new Map({
        target: el,
        layers: [
          new TileLayer({
            source: new XYZ({
              url: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              attributions: '© OpenStreetMap contributors © CARTO',
            }),
          }),
          new VectorLayer({ source: polygonSource, style: polygonStyle }),
          new VectorLayer({ source: pointsSource, style: pointStyle }),
          new VectorLayer({
            source: routeSource,
            style: (feature) => makeRouteStyle(feature.get('droneId') as number),
          }),
        ],
        view: new View({
          center: fromLonLat([37.6173, 55.7558]),
          zoom: 14,
        }),
      });

      mapInstanceRef.current = map;
      pointsSourceRef.current = pointsSource;
      polygonSourceRef.current = polygonSource;
      routeSourceRef.current = routeSource;
      setHasPolygon(polygonSource.getFeatures().length > 0);

      const popupEl = document.createElement('div');
      popupEl.className =
        'bg-white px-3 py-2 rounded shadow text-sm border border-gray-200 pointer-events-none';
      const popup = new Overlay({
        element: popupEl,
        positioning: 'bottom-center',
        offset: [0, -12],
      });
      map.addOverlay(popup);

      map.on('click', (evt) => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
          hitTolerance: 6,
        });
        const name = feature?.get('name') as string | undefined;
        if (name) {
          popupEl.textContent = name;
          popup.setPosition(evt.coordinate);
        } else {
          popup.setPosition(undefined);
        }
      });

      map.on('pointermove', (evt) => {
        const [lon, lat] = toLonLat(evt.coordinate);
        setCursorCoords({ lon, lat });
      });

      map.on('moveend', () => {
        const z = map.getView().getZoom();
        if (z !== undefined) setZoom(z);
      });

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            map.updateSize();
          }
        }
      });
      observer.observe(el);

      requestAnimationFrame(() => {
        map.updateSize();
        fitToFeatures();
      });
    };

    requestAnimationFrame(createMap);

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
        pointsSourceRef.current = null;
        polygonSourceRef.current = null;
        routeSourceRef.current = null;
      }
    };
  }, [fitToFeatures]);

  // --- Draw ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    if (mode === 'none') return;

    const source =
      mode === 'polygon' ? polygonSourceRef.current : pointsSourceRef.current;
    if (!source) return;

    const draw = new Draw({
      source,
      type: mode === 'polygon' ? 'Polygon' : 'Point',
      stopClick: true,
    });

    draw.on('drawend', (e) => {
      if (mode === 'polygon') {
        source.getFeatures().forEach((f) => {
          if (f !== e.feature) source.removeFeature(f);
        });
        setHasPolygon(true);
      } else {
        const count = pointsSourceRef.current!.getFeatures().length;
        e.feature.set('name', `ВПП №${count}`);
      }

      draw.setActive(false);
      map.removeInteraction(draw);
      drawInteractionRef.current = null;
      resetDragPan();

      setMode('none');
      setTimeout(() => fitToFeatures(), 0);
    });

    draw.on('drawabort', () => {
      draw.setActive(false);
      map.removeInteraction(draw);
      drawInteractionRef.current = null;
      resetDragPan();
      setMode('none');
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;

    return () => {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
    };
  }, [mode, fitToFeatures, resetDragPan]);

  const calculateRoutes = useCallback(() => {
    const map = mapInstanceRef.current;
    const routeSource = routeSourceRef.current;
    const polygonSource = polygonSourceRef.current;
    if (!map || !routeSource || !polygonSource) return;

    const polygonFeatures = polygonSource.getFeatures();
    if (polygonFeatures.length === 0) {
      notification.warning({
        message: 'Нет области съёмки',
        description: 'Сначала нарисуйте полигон на карте',
        placement: 'topRight',
      });
      return;
    }

    const droneCount = 2;

    const format = new GeoJSON();
    const polygonGeoJSON = format.writeFeatureObject(polygonFeatures[0], {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });

    const collection = planMultiPath(polygonGeoJSON as any, {
      parties: droneCount,
      divisionStrategy: 'balanced',
      coverageStrategy: 'boustrophedon',
      spacing: 30,
    });

    routeSource.clear();
    const results: RouteResult[] = [];

    collection.features.forEach((f: any, i: number) => {
      const olFeature = format.readFeature(f, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }) as Feature;

      olFeature.set('droneId', i);
      routeSource.addFeature(olFeature);

      const line = olFeature.getGeometry() as LineString;
      const lengthM = line.getLength();
      const lengthKm = lengthM / 1000;

      const speedKmh = 40;
      const timeMin = (lengthKm / speedKmh) * 60;
      const photos = Math.round(lengthM / 30);

      results.push({ droneId: i, lengthKm, timeMin, photos });
    });

    setRoutes(results);
    onRoutesCalculated?.(results);
    setTimeout(() => fitToFeatures(), 100);

    notification.success({
      message: 'Расчёт завершён',
      description: `Построено маршрутов: ${results.length}`,
      placement: 'topRight',
    });
  }, [fitToFeatures, onRoutesCalculated]);

  const clearAll = useCallback(() => {
    polygonSourceRef.current?.clear();
    pointsSourceRef.current?.clear();
    routeSourceRef.current?.clear();
    setRoutes([]);
    setHasPolygon(false);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Панель кнопок:
          - На тач-экранах опущена ниже (top-20), т.к. кнопки сворачивания
            панелей там крупнее (44px).
          - max-w ограничивает ширину.
          - Кнопки выше на тач (h-11), ниже на десктопе (lg:h-8). */}
      <div className="absolute top-20 lg:top-16 left-4 right-4 lg:right-auto z-10 flex flex-wrap gap-2 rounded-lg bg-background/90 p-2 shadow-lg border border-border backdrop-blur lg:max-w-[calc(100%-2rem)]">
        <Button
          variant={mode === 'polygon' ? 'default' : 'outline'}
          size="sm"
          disabled={mode === 'point'}
          onClick={() => setMode(mode === 'polygon' ? 'none' : 'polygon')}
          className="h-11 lg:h-8"
        >
          {mode === 'polygon' ? 'Отменить' : 'Нарисовать полигон'}
        </Button>
        <Button
          variant={mode === 'point' ? 'default' : 'outline'}
          size="sm"
          disabled={mode === 'polygon'}
          onClick={() => setMode(mode === 'point' ? 'none' : 'point')}
          className="h-11 lg:h-8"
        >
          {mode === 'point' ? 'Отменить' : 'Добавить ВПП'}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={calculateRoutes}
          className="h-11 lg:h-8"
        >
          Рассчитать маршруты
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fitToFeatures}
          className="h-11 lg:h-8"
        >
          Показать всё
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="h-11 lg:h-8"
        >
          Очистить
        </Button>
      </div>

      {!hasPolygon && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="rounded-lg bg-background/95 px-6 py-4 text-center shadow-lg border border-border mx-4">
            <p className="text-sm font-medium">Нарисуйте область съёмки</p>
            <p className="text-xs text-muted-foreground mt-1">
              Нажмите «Нарисовать полигон» и обведите зону на карте
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-border bg-background/90 px-3 lg:px-4 py-2 lg:py-1.5 text-xs text-muted-foreground backdrop-blur gap-2">
        <span className="truncate">
          {cursorCoords
            ? `${cursorCoords.lat.toFixed(4)}°, ${cursorCoords.lon.toFixed(4)}°`
            : 'Наведите на карту'}
        </span>
        <span className="whitespace-nowrap">Масштаб: {zoom.toFixed(1)}</span>
        <span className="whitespace-nowrap">Маршрутов: {routes.length}</span>
      </div>
    </div>
  );
}