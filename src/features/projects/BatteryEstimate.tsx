import { useMemo } from 'react';
import { Battery, Plane } from 'lucide-react';
import type { RouteResult } from '@/store/projects';
import type { Drone } from '@/features/drones/types';
import { estimateDeploymentMin } from '@/features/map/geo';

interface BatteryEstimateProps {
  routes: RouteResult[];
  drones: Drone[];
}

interface BatteryRow {
  droneId: number;
  droneName: string;
  totalTimeMin: number;
  maxPerBattery: number;
  flights: number;
  swaps: number;
  deploymentMin: number;
  feasible: boolean;
}

export function BatteryEstimate({ routes, drones }: BatteryEstimateProps) {
  const rows = useMemo<BatteryRow[]>(() => {
    return routes.map((r) => {
      const drone = drones[r.droneId] ?? drones[0];
      const maxPerBattery = drone.maxFlightTimeMin;
      const flights = Math.max(1, Math.ceil(r.timeMin / maxPerBattery));
      const swaps = flights - 1;
      const deploymentMin = estimateDeploymentMin(r.timeMin, swaps);
      return {
        droneId: r.droneId,
        droneName: drone.name,
        totalTimeMin: r.timeMin,
        maxPerBattery,
        flights,
        swaps,
        deploymentMin,
        feasible: flights <= 5, // больше 5 вылетов — почти наверняка нереально
      };
    });
  }, [routes, drones]);

  if (!rows.length) return null;

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.droneId}
          className={`rounded-md border p-2 text-xs space-y-1 ${
            row.feasible ? 'border-border' : 'border-amber-500/50 bg-amber-500/5'
          }`}
        >
          <div className="flex items-center gap-1.5 font-medium">
            <Plane className="h-3.5 w-3.5" />
            Борт {row.droneId + 1}
            <span className="text-muted-foreground font-normal truncate">
              · {row.droneName}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-muted-foreground">
            <span>Время полёта:</span>
            <span className="text-right">{row.totalTimeMin.toFixed(1)} мин</span>

            <span className="flex items-center gap-1">
              <Battery className="h-3 w-3" /> Батарей:
            </span>
            <span className="text-right">
              {row.flights} {row.swaps > 0 && `(+${row.swaps} замен)`}
            </span>

            <span>Время миссии:</span>
            <span className="text-right">{row.deploymentMin.toFixed(0)} мин</span>
          </div>
          {!row.feasible && (
            <div className="text-[10px] text-amber-700 dark:text-amber-400">
              Много вылетов — проверьте план
            </div>
          )}
        </div>
      ))}
    </div>
  );
}