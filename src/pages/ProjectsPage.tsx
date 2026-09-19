import { lazy, Suspense, useState, useCallback } from 'react';
import { ProjectForm } from '@/features/projects/ProjectForm';
import { ProjectList } from '@/features/projects/ProjectList';
import { RouteWarnings } from '@/features/projects/RouteWarnings';
import { DraggableRouteTable } from '@/features/projects/DraggableRouteTable';
import { BatteryEstimate } from '@/features/projects/BatteryEstimate';
import { GsdAreaPanel } from '@/features/projects/GsdAreaPanel';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Map as MapIcon } from 'lucide-react';
import type { RouteResult } from '@/store/projects';
import type { RouteWarning } from '@/features/map/validation';
import type { ElevationPoint } from '@/features/map/elevation';
import type { CameraGeometry } from '@/features/map/geo';
import { useCatalog } from '@/store/catalog';

const SurveyMap = lazy(() =>
  import('@/features/map/SurveyMap').then((m) => ({ default: m.SurveyMap })),
);

const ElevationProfile = lazy(() =>
  import('@/features/map/ElevationProfile').then((m) => ({
    default: m.ElevationProfile,
  })),
);

function MapFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Загрузка карты…
    </div>
  );
}

interface MapMetrics {
  geo: CameraGeometry | null;
  areaHa: number | null;
}

export function ProjectsPage() {
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [warnings, setWarnings] = useState<RouteWarning[]>([]);
  const [droneOrder, setDroneOrder] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<MapMetrics>({ geo: null, areaHa: null });
  const [elevation, setElevation] = useState<ElevationPoint[]>([]);
  const [elevationFlightHeight, setElevationFlightHeight] = useState(100);

  const { drones } = useCatalog();

  const leftPanel = (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Новый проект</h2>
        <ProjectForm />
      </div>
      <div className="space-y-3 border-t border-border pt-4">
        <h2 className="text-lg font-semibold">Сохранённые проекты</h2>
        <ProjectList />
      </div>
    </div>
  );

  const totalFlightMin = routes.reduce((s, r) => s + r.timeMin, 0);
  const maxBattery = Math.max(...routes.map((r) => drones[r.droneId]?.maxFlightTimeMin ?? 0), 0);
  const swapsTotal = routes.reduce((s, r) => {
    const d = drones[r.droneId];
    if (!d) return s;
    return s + Math.max(0, Math.ceil(r.timeMin / d.maxFlightTimeMin) - 1);
  }, 0);
  const deploymentMin = routes.length
    ? 15 + totalFlightMin + swapsTotal * 5 + 10
    : null;

  const rightPanel = (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Результаты расчёта</h2>
      {routes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <MapIcon className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Результаты появятся здесь</p>
          <p className="text-xs mt-1">Заполните форму и нажмите «Рассчитать»</p>
        </div>
      ) : (
        <>
          {warnings.length > 0 && <RouteWarnings warnings={warnings} />}
          <GsdAreaPanel
            gsdCmPerPx={metrics.geo?.gsdCmPerPx ?? null}
            footprintM={metrics.geo?.footprintWidthM ?? null}
            photoStepM={metrics.geo?.photoStepM ?? null}
            polygonAreaHa={metrics.areaHa}
            totalTimeMin={totalFlightMin}
            deploymentMin={deploymentMin}
          />
          <div>
            <h3 className="text-sm font-medium mb-2">Батареи и время миссии</h3>
            <BatteryEstimate routes={routes} drones={drones} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Маршруты</h3>
            <DraggableRouteTable routes={routes} onReorder={setDroneOrder} />
          </div>
          {elevation.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Профиль высот</h3>
              <Suspense fallback={<div className="text-xs">Загрузка…</div>}>
                <ElevationProfile
                  points={elevation}
                  flightHeightM={elevationFlightHeight}
                  width={380}
                  height={130}
                />
              </Suspense>
            </div>
          )}
        </>
      )}
    </div>
  );

  const handleRoutes = useCallback((r: RouteResult[]) => {
    setRoutes(r);
  }, []);

  return (
    <WorkspaceLayout
      leftPanel={leftPanel}
      centerContent={
        <div className="h-full w-full">
          <Suspense fallback={<MapFallback />}>
            <SurveyMap
              onRoutesCalculated={handleRoutes}
              onWarnings={setWarnings}
              droneOrder={droneOrder}
              onMetrics={(geo, areaHa) => setMetrics({ geo, areaHa })}
              onElevation={(points, flightHeightM) => {
                setElevation(points);
                setElevationFlightHeight(flightHeightM);
              }}
            />
          </Suspense>
        </div>
      }
      rightPanel={rightPanel}
    />
  );
}