import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import Select from 'ol/interaction/Select';
import GeoJSON from 'ol/format/GeoJSON';
import DragPan from 'ol/interaction/DragPan';
import { ScaleLine, defaults as defaultControls } from 'ol/control';
import { click } from 'ol/events/condition';
import 'ol/ol.css';
import { Button } from '@/components/ui/button';
import { Popover, notification } from 'antd';
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Upload,
  TrendingUp,
  Wind,
} from 'lucide-react';
import { planMultiPath } from 'planefill';
import { useCatalog } from '@/store/catalog';
import { useProjectDraft } from '@/store/projectDraft';
import { useProjects } from '@/store/projects';
import { useMapView, type BasemapId } from '@/store/mapView';
import { useHotkeys } from '@/hooks/useHotkeys';
import {
  computeCameraGeometry,
  totalPolygonAreaHa,
  type CameraGeometry,
} from './geo';
import { validateRoutes, type RouteWarning } from './validation';
import { UndoRedoStack, type MapSnapshot } from './undoRedo';
import { createBasemapLayer } from './basemaps';
import { CoordinateSearch } from './CoordinateSearch';
import { MapLayersPanel } from './MapLayersPanel';
import { WeatherPanel } from './WeatherPanel';
import { importGeometryFile } from './importers';
import { fetchElevationProfile, type ElevationPoint } from './elevation';
import { exportGeoJSON } from '@/features/projects/exporters';

// ---------- Стили ----------

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

const selectedPolygonStyle = new Style({
  fill: new Fill({ color: 'rgba(234, 179, 8, 0.25)' }),
  stroke: new Stroke({ color: '#eab308', width: 3, lineDash: [8, 4] }),
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

// ---------- Начальные данные ----------

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
  onWarnings?: (warnings: RouteWarning[]) => void;
  onMetrics?: (geo: CameraGeometry | null, areaHa: number | null) => void;
  onElevation?: (points: ElevationPoint[], flightHeightM: number) => void;
}

const BASEMAP_IDS: BasemapId[] = ['voyager', 'dark', 'satellite'];

export function SurveyMap({
  onRoutesCalculated,
  onWarnings,
  onMetrics,
  onElevation,
}: SurveyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mapInstanceRef = useRef<Map | null>(null);
  const basemapLayersRef = useRef<Partial<Record<BasemapId, TileLayer<XYZ>>>>({});
  const pointsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const polygonLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const pointsSourceRef = useRef<VectorSource | null>(null);
  const polygonSourceRef = useRef<VectorSource | null>(null);
  const routeSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const selectInteractionRef = useRef<Select | null>(null);
  const undoStackRef = useRef(new UndoRedoStack());
  const selectedPolygonRef = useRef<Feature | null>(null);

  const [mode, setMode] = useState<DrawMode>('none');
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [warnings, setWarnings] = useState<RouteWarning[]>([]);
  const [hasPolygon, setHasPolygon] = useState(false);
  const [polygonCount, setPolygonCount] = useState(0);
  const [cursorCoords, setCursorCoords] = useState<{ lon: number; lat: number } | null>(null);
  const [zoom, setZoom] = useState(14);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [weatherRefreshKey, setWeatherRefreshKey] = useState(0);
  const [elevationLoading, setElevationLoading] = useState(false);
  const [areaHa, setAreaHa] = useState<number | null>(null);

  const draft = useProjectDraft((s) => s.draft);
  const { drones, cameras } = useCatalog();
  const activeId = useProjects((s) => s.activeProjectId);
  const updateProject = useProjects((s) => s.updateProject);
  const getProject = useProjects((s) => s.getProject);

  const basemap = useMapView((s) => s.basemap);
  const showRoutes = useMapView((s) => s.showRoutes);
  const showRunways = useMapView((s) => s.showRunways);
  const showPolygons = useMapView((s) => s.showPolygons);
  const topBarVisible = useMapView((s) => s.topBarVisible);
  const toggleTopBar = useMapView((s) => s.toggleTopBar);
  const secondaryOpen = useMapView((s) => s.secondaryOpen);
  const setSecondaryOpen = useMapView((s) => s.setSecondaryOpen);

  // ---------- Undo/Redo ----------

  const takeSnapshot = useCallback((): MapSnapshot => {
    const ps = polygonSourceRef.current;
    const rs = pointsSourceRef.current;
    return {
      polygons: ps ? ps.getFeatures().map((f) => f.clone() as Feature) : [],
      runways: rs ? rs.getFeatures().map((f) => f.clone() as Feature) : [],
    };
  }, []);

  const applySnapshot = useCallback((snapshot: MapSnapshot) => {
    const ps = polygonSourceRef.current;
    const rs = pointsSourceRef.current;
    if (!ps || !rs) return;
    ps.clear();
    rs.clear();
    snapshot.polygons.forEach((f) => ps.addFeature(f.clone() as Feature));
    snapshot.runways.forEach((f) => rs.addFeature(f.clone() as Feature));
    setPolygonCount(ps.getFeatures().length);
    setHasPolygon(ps.getFeatures().length > 0);
  }, []);

  const commitSnapshot = useCallback(() => {
    undoStackRef.current.push(takeSnapshot());
  }, [takeSnapshot]);

  const handleUndo = useCallback(() => {
    const snap = undoStackRef.current.undo();
    if (snap) {
      applySnapshot(snap);
      notification.info({ message: 'Отменено', placement: 'topRight', duration: 1 });
    }
  }, [applySnapshot]);

  const handleRedo = useCallback(() => {
    const snap = undoStackRef.current.redo();
    if (snap) {
      applySnapshot(snap);
      notification.info({ message: 'Повторено', placement: 'topRight', duration: 1 });
    }
  }, [applySnapshot]);

  // ---------- Утилиты карты ----------

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

  const goTo = useCallback((lon: number, lat: number, zoomLevel?: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.getView().animate({
      center: fromLonLat([lon, lat]),
      zoom: zoomLevel ?? map.getView().getZoom(),
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

  // ---------- Инициализация карты ----------

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
            '[SurveyMap] контейнер не получил размеры:',
            el.clientWidth,
            '×',
            el.clientHeight,
          );
        }
        return;
      }

      const basemaps: Partial<Record<BasemapId, TileLayer<XYZ>>> = {};
      BASEMAP_IDS.forEach((id) => {
        const layer = createBasemapLayer(id);
        layer.setVisible(id === useMapView.getState().basemap);
        layer.set('role', 'basemap');
        basemaps[id] = layer;
      });
      basemapLayersRef.current = basemaps;

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
        name: 'Область 1',
      });
      polygonFeature.setStyle(polygonStyle);
      polygonSource.addFeature(polygonFeature);

      const routeSource = new VectorSource();

      const polygonLayer = new VectorLayer({ source: polygonSource });
      const pointsLayer = new VectorLayer({ source: pointsSource, style: pointStyle });
      const routeLayer = new VectorLayer({
        source: routeSource,
        style: (feature) => makeRouteStyle(feature.get('droneId') as number),
      });

      polygonLayerRef.current = polygonLayer;
      pointsLayerRef.current = pointsLayer;
      routeLayerRef.current = routeLayer;

      const map = new Map({
        target: el,
        layers: [
          basemaps.voyager!,
          basemaps.dark!,
          basemaps.satellite!,
          polygonLayer,
          pointsLayer,
          routeLayer,
        ],
        controls: defaultControls({ attribution: false }).extend([
          new ScaleLine({ units: 'metric' }),
        ]),
        view: new View({
          center: fromLonLat([37.6173, 55.7558]),
          zoom: 14,
        }),
      });

      const select = new Select({
        layers: [polygonLayer],
        condition: click,
        style: selectedPolygonStyle,
      });
      select.on('select', (e) => {
        selectedPolygonRef.current = e.selected[0] ?? null;
      });
      map.addInteraction(select);
      selectInteractionRef.current = select;

      mapInstanceRef.current = map;
      pointsSourceRef.current = pointsSource;
      polygonSourceRef.current = polygonSource;
      routeSourceRef.current = routeSource;
      setHasPolygon(true);
      setPolygonCount(polygonSource.getFeatures().length);

      setTimeout(() => commitSnapshot(), 0);

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

      const updateView = () => {
        const z = map.getView().getZoom();
        if (z !== undefined) setZoom(z);
        const c = map.getView().getCenter();
        if (c) {
          const [lon, lat] = toLonLat(c);
          setCenter([lon, lat]);
        }
      };
      map.on('moveend', updateView);
      updateView();

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
        basemapLayersRef.current = {};
        pointsLayerRef.current = null;
        polygonLayerRef.current = null;
        routeLayerRef.current = null;
        pointsSourceRef.current = null;
        polygonSourceRef.current = null;
        routeSourceRef.current = null;
        selectInteractionRef.current = null;
      }
    };
  }, [commitSnapshot, fitToFeatures]);

  // Переключение подложки — только setVisible
  useEffect(() => {
    BASEMAP_IDS.forEach((id) => {
      const layer = basemapLayersRef.current[id];
      if (layer) layer.setVisible(id === basemap);
    });
  }, [basemap]);

  // Видимость слоёв
  useEffect(() => {
    polygonLayerRef.current?.setVisible(showPolygons);
  }, [showPolygons]);
  useEffect(() => {
    pointsLayerRef.current?.setVisible(showRunways);
  }, [showRunways]);
  useEffect(() => {
    routeLayerRef.current?.setVisible(showRoutes);
  }, [showRoutes]);

  // ---------- Draw ----------

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
        const count = polygonSourceRef.current!.getFeatures().length;
        e.feature.set('name', `Область ${count}`);
        setPolygonCount(count);
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
      setTimeout(() => {
        commitSnapshot();
        fitToFeatures();
      }, 0);
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
  }, [mode, commitSnapshot, fitToFeatures, resetDragPan]);

  // ---------- Удаление выбранного полигона ----------

  const deleteSelected = useCallback(() => {
    const sel = selectedPolygonRef.current;
    const ps = polygonSourceRef.current;
    if (!sel || !ps) return;
    ps.removeFeature(sel);
    selectedPolygonRef.current = null;
    selectInteractionRef.current?.getFeatures().clear();
    setPolygonCount(ps.getFeatures().length);
    setHasPolygon(ps.getFeatures().length > 0);
    commitSnapshot();
  }, [commitSnapshot]);

  // ---------- Импорт KML / GeoJSON ----------

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const result = await importGeometryFile(file);
    const ps = polygonSourceRef.current;
    if (!ps) return;

    if (result.features.length) {
      result.features.forEach((f) => ps.addFeature(f));
      setPolygonCount(ps.getFeatures().length);
      setHasPolygon(true);
      commitSnapshot();
      setTimeout(() => fitToFeatures(), 100);
      notification.success({
        message: 'Импорт выполнен',
        description: `Добавлено областей: ${result.features.length}`,
        placement: 'topRight',
      });
    }
    if (result.errors.length) {
      notification.warning({
        message: 'Часть данных пропущена',
        description: result.errors.slice(0, 3).join('; '),
        placement: 'topRight',
        duration: 6,
      });
    }
    if (!result.features.length && !result.errors.length) {
      notification.warning({
        message: 'Файл пуст',
        description: 'Не найдено ни одной области',
        placement: 'topRight',
      });
    }
  };

  // ---------- Погода ----------

  const handleWeatherToggle = () => {
    setWeatherOpen((v) => !v);
    setWeatherRefreshKey((k) => k + 1);
  };

  // ---------- Профиль высот ----------

  const handleElevation = useCallback(async () => {
    const routeSource = routeSourceRef.current;
    if (!routeSource) return;

    const lineFeature = routeSource.getFeatures().find((f) => {
      return f.getGeometry() instanceof LineString;
    }) as Feature | undefined;

    if (!lineFeature) {
      notification.warning({
        message: 'Нет маршрута',
        description: 'Сначала рассчитайте маршруты',
        placement: 'topRight',
      });
      return;
    }

    setElevationLoading(true);
    try {
      const geom = lineFeature.getGeometry() as LineString;
      const coords3857 = geom.getCoordinates();
      const lonLatPoints: [number, number][] = coords3857.map(
        ([x, y]) => toLonLat([x, y]) as [number, number],
      );
      const profile = await fetchElevationProfile(lonLatPoints, 50);
      onElevation?.(profile, draft.flightHeightM);
      notification.success({
        message: 'Профиль высот получен',
        description: `Точек: ${profile.length}`,
        placement: 'topRight',
      });
    } catch (e) {
      notification.error({
        message: 'Не удалось получить профиль',
        description: (e as Error).message,
        placement: 'topRight',
      });
    } finally {
      setElevationLoading(false);
    }
  }, [draft.flightHeightM, onElevation]);

  // ---------- Горячие клавиши ----------

  const hotkeys = useMemo(
    () => ({
      r: () => setMode((m) => (m === 'polygon' ? 'none' : 'polygon')),
      p: () => setMode((m) => (m === 'point' ? 'none' : 'point')),
      Escape: () => setMode('none'),
      'ctrl+z': handleUndo,
      'ctrl+shift+z': handleRedo,
      Delete: deleteSelected,
      Backspace: deleteSelected,
      'ctrl+f': () => setSearchOpen((v) => !v),
      'ctrl+h': () => toggleTopBar(),
    }),
    [handleUndo, handleRedo, deleteSelected, toggleTopBar],
  );
  useHotkeys(hotkeys);

  // ---------- Расчёт ----------

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

    const validPolygons = polygonFeatures.filter(
      (f) => f.getGeometry() instanceof Polygon,
    );
    if (!validPolygons.length) {
      notification.error({
        message: 'Некорректная область',
        description: 'Область съёмки должна быть полигоном',
        placement: 'topRight',
      });
      return;
    }

    const selectedDrones = drones.filter((d) => draft.bvsIds.includes(d.id));
    const camera = cameras.find((c) => c.id === draft.cameraId);

    if (!selectedDrones.length) {
      notification.warning({
        message: 'Не выбраны БВС',
        description: 'Выберите хотя бы один борт в форме проекта',
        placement: 'topRight',
      });
      return;
    }
    if (!camera) {
      notification.warning({
        message: 'Не выбрана камера',
        description: 'Выберите камеру в форме проекта',
        placement: 'topRight',
      });
      return;
    }

    const geo = computeCameraGeometry(camera, draft.flightHeightM);

    const areaHa = totalPolygonAreaHa(
      validPolygons.map((f) => f.getGeometry() as Polygon),
    );
    setAreaHa(areaHa);
    onMetrics?.(geo, areaHa);

    const format = new GeoJSON();
    routeSource.clear();
    const results: RouteResult[] = [];

    const polygonsCount = validPolygons.length;
    const dronesPerPolygon = Math.max(
      1,
      Math.floor(selectedDrones.length / polygonsCount),
    );

    validPolygons.forEach((polyFeature, polyIdx) => {
      const polygonGeoJSON = format.writeFeatureObject(polyFeature, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });

      const collection = planMultiPath(polygonGeoJSON as any, {
        parties: dronesPerPolygon,
        divisionStrategy: draft.divisionStrategy,
        coverageStrategy: draft.coverageStrategy,
        spacing: draft.spacingM,
      });

      collection.features.forEach((f: any, i: number) => {
        const olFeature = format.readFeature(f, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        }) as Feature;

        const globalDroneId = polyIdx * dronesPerPolygon + i;
        olFeature.set('droneId', globalDroneId);
        olFeature.set('polygonIndex', polyIdx);
        routeSource.addFeature(olFeature);

        const geom = olFeature.getGeometry();
        if (!(geom instanceof LineString)) return;
        const lengthM = geom.getLength();
        const lengthKm = lengthM / 1000;

        const drone = selectedDrones[globalDroneId] ?? selectedDrones[0];
        const speedMs = drone.cruiseSpeedMs;
        const timeMin = lengthM / speedMs / 60;
        const photos = Math.max(1, Math.round(lengthM / geo.photoStepM));

        results.push({ droneId: globalDroneId, lengthKm, timeMin, photos });
      });
    });

    setRoutes(results);
    onRoutesCalculated?.(results);

    const w = validateRoutes(results, selectedDrones);
    setWarnings(w);
    onWarnings?.(w);

    setTimeout(() => fitToFeatures(), 100);

    if (activeId) {
      const fc = format.writeFeaturesObject(routeSource.getFeatures(), {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      updateProject(activeId, {
        routes: results,
        routesGeoJSON: JSON.stringify(fc),
      });
    }

    notification.success({
      message: 'Расчёт завершён',
      description:
        `Маршрутов: ${results.length}. ` +
        `GSD ≈ ${geo.gsdCmPerPx.toFixed(1)} см/пикс, ` +
        `площадь ≈ ${areaHa.toFixed(2)} га`,
      placement: 'topRight',
      duration: 6,
    });
  }, [
    drones,
    cameras,
    draft,
    activeId,
    updateProject,
    fitToFeatures,
    onRoutesCalculated,
    onWarnings,
    onMetrics,
  ]);

  const clearAll = useCallback(() => {
    polygonSourceRef.current?.clear();
    pointsSourceRef.current?.clear();
    routeSourceRef.current?.clear();
    setRoutes([]);
    setWarnings([]);
    setHasPolygon(false);
    setPolygonCount(0);
    setAreaHa(null);
    onMetrics?.(null, null);
    onElevation?.([], draft.flightHeightM);
    commitSnapshot();
  }, [commitSnapshot, onMetrics, onElevation, draft.flightHeightM]);

  const handleQuickExport = useCallback(() => {
    if (!activeId) {
      notification.warning({
        message: 'Нет активного проекта',
        description: 'Сохраните проект или откройте существующий',
        placement: 'topRight',
      });
      return;
    }
    const project = getProject(activeId);
    if (!project || !exportGeoJSON(project)) {
      notification.warning({
        message: 'Нечего экспортировать',
        description: 'Сначала рассчитайте маршруты',
        placement: 'topRight',
      });
    }
  }, [activeId, getProject]);

  // ---------- Второстепенные кнопки (popover «Ещё») ----------

  const secondaryContent = (
    <div className="flex flex-col gap-1 min-w-[220px]">
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={handleImportClick}
      >
        <Upload className="h-3.5 w-3.5 mr-2" /> Импорт KML / GeoJSON
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={handleElevation}
        disabled={elevationLoading}
      >
        <TrendingUp className="h-3.5 w-3.5 mr-2" />
        {elevationLoading ? 'Загрузка профиля…' : 'Профиль высот'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={handleWeatherToggle}
      >
        <Wind className="h-3.5 w-3.5 mr-2" /> Погода
      </Button>
      <div className="border-t border-border my-1" />
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={handleUndo}
      >
        ↶ Отменить
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={handleRedo}
      >
        ↷ Повторить
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={deleteSelected}
      >
        Удалить выбранное
      </Button>
      <div className="border-t border-border my-1" />
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={() => setSearchOpen((v) => !v)}
      >
        Поиск координат
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={fitToFeatures}
      >
        Показать всё
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={clearAll}
      >
        Очистить
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start h-9"
        onClick={handleQuickExport}
      >
        Экспорт GeoJSON
      </Button>
    </div>
  );

  // ---------- Рендер ----------

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".kml,.geojson,.json,application/geo+json"
        className="hidden"
        onChange={handleFileChosen}
      />

      {/* Кнопка возврата плашки, если скрыта.
          left-16 — правее кнопки сворачивания левой панели. */}
      {!topBarVisible && (
        <button
          type="button"
          onClick={toggleTopBar}
          className="absolute top-4 left-16 z-20 h-9 px-3 rounded-full shadow-lg border border-border bg-background/90 backdrop-blur flex items-center gap-1 text-xs hover:bg-accent"
          title="Показать панель (Ctrl+H)"
        >
          <ChevronDown className="h-4 w-4" />
          <span className="hidden sm:inline">Панель</span>
        </button>
      )}

      {/* Верхняя плашка */}
      {topBarVisible && (
        <div className="absolute top-20 lg:top-16 left-4 right-4 lg:right-auto z-10 flex flex-wrap items-center gap-2 rounded-lg bg-background/90 p-2 shadow-lg border border-border backdrop-blur lg:max-w-[calc(100%-2rem)]">
          <Button
            variant={mode === 'polygon' ? 'default' : 'outline'}
            size="sm"
            disabled={mode === 'point'}
            onClick={() => setMode(mode === 'polygon' ? 'none' : 'polygon')}
            className="h-11 lg:h-8"
            title="R"
          >
            {mode === 'polygon' ? 'Отменить' : 'Полигон'}
          </Button>
          <Button
            variant={mode === 'point' ? 'default' : 'outline'}
            size="sm"
            disabled={mode === 'polygon'}
            onClick={() => setMode(mode === 'point' ? 'none' : 'point')}
            className="h-11 lg:h-8"
            title="P"
          >
            {mode === 'point' ? 'Отменить' : 'ВПП'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={calculateRoutes}
            className="h-11 lg:h-8"
          >
            Рассчитать
          </Button>

          <Popover
            content={secondaryContent}
            trigger="click"
            placement="bottomLeft"
            open={secondaryOpen}
            onOpenChange={setSecondaryOpen}
          >
            <Button
              variant={secondaryOpen ? 'default' : 'outline'}
              size="sm"
              className="h-11 lg:h-8"
            >
              <MoreHorizontal className="h-4 w-4 lg:hidden" />
              <span className="hidden lg:inline">Ещё</span>
            </Button>
          </Popover>

          <MapLayersPanel
            currentCenter={center}
            currentZoom={zoom}
            onGoToBookmark={(b) => goTo(b.center[0], b.center[1], b.zoom)}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={toggleTopBar}
            className="h-11 lg:h-8 ml-auto"
            title="Скрыть панель (Ctrl+H)"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Поиск координат */}
      {searchOpen && (
        <div className="absolute top-36 lg:top-28 right-4 z-10 rounded-lg bg-background/90 p-2 shadow-lg border border-border backdrop-blur">
          <CoordinateSearch
            onGoTo={(lon, lat) => {
              goTo(lon, lat, 15);
              setSearchOpen(false);
            }}
          />
        </div>
      )}

      {/* Погода */}
      {weatherOpen && center && (
        <div className="absolute top-36 lg:top-28 left-4 z-10 rounded-lg bg-background/90 p-3 shadow-lg border border-border backdrop-blur w-56">
          <div className="text-xs font-medium mb-2">Погода в центре карты</div>
          <WeatherPanel
            lat={center[1]}
            lon={center[0]}
            refreshKey={weatherRefreshKey}
          />
        </div>
      )}

      {/* Подсказка */}
      {!hasPolygon && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="rounded-lg bg-background/95 px-6 py-4 text-center shadow-lg border border-border mx-4">
            <p className="text-sm font-medium">Нарисуйте область съёмки</p>
            <p className="text-xs text-muted-foreground mt-1">
              «Полигон» или клавиша R, либо импорт KML / GeoJSON
            </p>
          </div>
        </div>
      )}

      {/* Статус-бар */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-border bg-background/90 px-3 lg:px-4 py-2 lg:py-1.5 text-xs text-muted-foreground backdrop-blur gap-2">
        <span className="truncate">
          {cursorCoords
            ? `${cursorCoords.lat.toFixed(4)}°, ${cursorCoords.lon.toFixed(4)}°`
            : 'Наведите на карту'}
        </span>
        {areaHa !== null && (
          <span className="whitespace-nowrap">Площадь: {areaHa.toFixed(2)} га</span>
        )}
        <span className="whitespace-nowrap">Масштаб: {zoom.toFixed(1)}</span>
        <span className="whitespace-nowrap">Областей: {polygonCount}</span>
        <span className="whitespace-nowrap">Маршрутов: {routes.length}</span>
        {warnings.length > 0 && (
          <span className="whitespace-nowrap text-amber-600 font-medium">
            ⚠ {warnings.length}
          </span>
        )}
      </div>
    </div>
  );
}