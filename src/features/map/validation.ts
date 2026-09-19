import type { RouteResult } from '@/store/projects';
import type { Drone } from '@/features/drones/types';

export interface RouteWarning {
  droneId: number;
  severity: 'warning' | 'error';
  message: string;
}

export function validateRoutes(
  routes: RouteResult[],
  drones: Drone[],
): RouteWarning[] {
  const warnings: RouteWarning[] = [];

  routes.forEach((r, i) => {
    const drone = drones[i] ?? drones[0];
    if (!drone) return;

    // Запас 20% — стандарт для планирования БВС
    const maxSafeMin = drone.maxFlightTimeMin * 0.8;

    if (r.timeMin > drone.maxFlightTimeMin) {
      warnings.push({
        droneId: r.droneId,
        severity: 'error',
        message: `Борт ${r.droneId + 1}: время ${r.timeMin.toFixed(
          1,
        )} мин > максимума ${drone.maxFlightTimeMin} мин. Нужна дозаправка/замена батареи.`,
      });
    } else if (r.timeMin > maxSafeMin) {
      warnings.push({
        droneId: r.droneId,
        severity: 'warning',
        message: `Борт ${r.droneId + 1}: время ${r.timeMin.toFixed(
          1,
        )} мин > 80% ресурса (${maxSafeMin.toFixed(
          0,
        )} мин). Рекомендуется запас.`,
      });
    }

    if (r.lengthKm > 100) {
      warnings.push({
        droneId: r.droneId,
        severity: 'warning',
        message: `Борт ${r.droneId + 1}: длина ${r.lengthKm.toFixed(
          1,
        )} км — проверьте дальность связи.`,
      });
    }
  });

  return warnings;
}