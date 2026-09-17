// src/features/map/SurveyMap.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import Draw from 'ol/interaction/Draw';
import GeoJSON from 'ol/format/GeoJSON';
import DragPan from 'ol/interaction/DragPan';
import 'ol/ol.css';
import { Button } from '@/components/ui/button';

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

// --- Хардкод стартовых данных ---
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

export function SurveyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const pointsSourceRef = useRef<VectorSource | null>(null);
  const polygonSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);

  const [mode, setMode] = useState<DrawMode>('none');
  const [polygonGeoJSON, setPolygonGeoJSON] = useState<string | null>(null);
  const [pointsGeoJSON, setPointsGeoJSON] = useState<string[]>([]);

  // --- fitBounds с защитой от пустого extent ---
  const fitToFeatures = useCallback(() => {
    const map = mapInstanceRef.current;
    const pointSource = pointsSourceRef.current;
    const polygonSource = polygonSourceRef.current;
    if (!map) return;

    const allFeatures = [
      ...(pointSource?.getFeatures() ?? []),
      ...(polygonSource?.getFeatures() ?? []),
    ];

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

  // --- Сброс «залипшего» DragPan ---
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

  // --- Инициализация карты (один раз) ---
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Слой точек ВПП
    const pointsSource = new VectorSource();
    INITIAL_RUNWAYS.forEach(({ lonLat, name }) => {
      const f = new Feature({
        geometry: new Point(fromLonLat(lonLat)),
        name,
      });
      f.setStyle(pointStyle);
      pointsSource.addFeature(f);
    });
    const pointsLayer = new VectorLayer({
      source: pointsSource,
      style: pointStyle,
    });

    // Слой полигона
    const polygonSource = new VectorSource();
    const polygonFeature = new Feature({
      geometry: new Polygon([
        INITIAL_POLYGON_LONLAT.map(([lon, lat]) => fromLonLat([lon, lat])),
      ]),
    });
    polygonFeature.setStyle(polygonStyle);
    polygonSource.addFeature(polygonFeature);
    const polygonLayer = new VectorLayer({
      source: polygonSource,
      style: polygonStyle,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        polygonLayer,
        pointsLayer,
      ],
      view: new View({
        center: fromLonLat([37.6173, 55.7558]),
        zoom: 14,
      }),
    });

    mapInstanceRef.current = map;
    pointsSourceRef.current = pointsSource;
    polygonSourceRef.current = polygonSource;

    // --- Popup: всплывающее название ВПП ---
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

    setTimeout(() => fitToFeatures(), 0);

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
      pointsSourceRef.current = null;
      polygonSourceRef.current = null;
    };
  }, [fitToFeatures]);

  // --- Управление интеракциями при смене режима ---
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
      const format = new GeoJSON();
      const geojson = format.writeGeometry(e.feature.getGeometry()!);

      if (mode === 'polygon') {
        // Удаляем все полигоны, кроме только что нарисованного
        source.getFeatures().forEach((f) => {
          if (f !== e.feature) source.removeFeature(f);
        });
        setPolygonGeoJSON(geojson);
      } else {
        const count = pointsSourceRef.current!.getFeatures().length;
        e.feature.set('name', `ВПП №${count}`);
        setPointsGeoJSON((prev) => [...prev, geojson]);
      }

      // Не вызываем finishDrawing и не добавляем фичу — Draw уже сделал это.
      // Просто выключаем и убираем интеракцию.
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === 'polygon' ? 'default' : 'outline'}
          disabled={mode === 'point'}
          onClick={() => setMode(mode === 'polygon' ? 'none' : 'polygon')}
        >
          {mode === 'polygon' ? 'Отменить рисование' : 'Нарисовать полигон'}
        </Button>
        <Button
          variant={mode === 'point' ? 'default' : 'outline'}
          disabled={mode === 'polygon'}
          onClick={() => setMode(mode === 'point' ? 'none' : 'point')}
        >
          {mode === 'point' ? 'Отменить добавление' : 'Добавить ВПП'}
        </Button>
        <Button variant="outline" onClick={fitToFeatures}>
          Показать всё
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            polygonSourceRef.current?.clear();
            pointsSourceRef.current?.clear();
            setPolygonGeoJSON(null);
            setPointsGeoJSON([]);
          }}
        >
          Очистить
        </Button>
      </div>

      <div
        ref={mapRef}
        style={{ height: '600px', width: '100%' }}
        className="rounded-lg overflow-hidden border border-border"
      />

      <div className="text-xs text-muted-foreground space-y-1">
        <div>Точек ВПП: {pointsGeoJSON.length}</div>
        <div>Полигон: {polygonGeoJSON ? 'есть' : 'нет'}</div>
      </div>
    </div>
  );
}