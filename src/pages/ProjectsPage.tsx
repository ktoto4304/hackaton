import { lazy, Suspense, useState } from 'react';
import { ProjectForm } from '@/features/projects/ProjectForm';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Map as MapIcon } from 'lucide-react';

// Ленивая загрузка карты: OpenLayers (~600 КБ) не попадёт
// в основной бандл и загрузится только при первом открытии страницы.
const SurveyMap = lazy(() =>
  import('@/features/map/SurveyMap').then((m) => ({ default: m.SurveyMap })),
);

interface RouteResult {
  droneId: number;
  lengthKm: number;
  timeMin: number;
  photos: number;
}

function MapFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Загрузка карты…
    </div>
  );
}

export function ProjectsPage() {
  const [routes, setRoutes] = useState<RouteResult[]>([]);

  const leftPanel = (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Новый проект</h2>
      <ProjectForm />
    </div>
  );

  const rightPanel = (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Результаты расчёта</h2>
      {routes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <MapIcon className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Результаты появятся здесь</p>
          <p className="text-xs mt-1">Выберите БВС и нажмите «Рассчитать маршруты»</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Борт</th>
                <th className="px-3 py-2 text-right">Длина, км</th>
                <th className="px-3 py-2 text-right">Время, мин</th>
                <th className="px-3 py-2 text-right">Снимков</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.droneId} className="border-t border-border">
                  <td className="px-3 py-2">Борт {r.droneId + 1}</td>
                  <td className="px-3 py-2 text-right">{r.lengthKm.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{r.timeMin.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{r.photos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <WorkspaceLayout
      leftPanel={leftPanel}
      centerContent={
        <Suspense fallback={<MapFallback />}>
          <SurveyMap onRoutesCalculated={setRoutes} />
        </Suspense>
      }
      rightPanel={rightPanel}
    />
  );
}