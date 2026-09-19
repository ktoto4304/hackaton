import type { Camera } from '@/features/drones/types';
import type Polygon from 'ol/geom/Polygon';
import { getArea } from 'ol/sphere';

export interface CameraGeometry {
  footprintWidthM: number;
  footprintHeightM: number;
  photoStepM: number;
  gsdCmPerPx: number;
}

export function computeCameraGeometry(
  camera: Camera,
  flightHeightM: number,
): CameraGeometry {
  const halfFovRad = (camera.fovDeg * Math.PI) / 180 / 2;
  const footprintM = 2 * flightHeightM * Math.tan(halfFovRad);

  const overlap = Math.min(Math.max(camera.overlapPercent, 0), 99) / 100;
  const photoStepM = Math.max(footprintM * (1 - overlap), 1);

  const sensorWidthMm = 36;
  const imageWidthPx = Math.sqrt(camera.resolutionMp * 1_000_000);
  const gsdCmPerPx =
    (flightHeightM * 100 * sensorWidthMm) / (camera.focalLengthMm * imageWidthPx);

  return {
    footprintWidthM: footprintM,
    footprintHeightM: footprintM,
    photoStepM,
    gsdCmPerPx,
  };
}

export function polygonAreaM2(polygon: Polygon): number {
  return Math.abs(getArea(polygon));
}

export function polygonAreaHa(polygon: Polygon): number {
  return polygonAreaM2(polygon) / 10_000;
}

export function estimateDeploymentMin(
  flightTimeMin: number,
  batterySwaps: number,
): number {
  const PREP_MIN = 15;
  const PER_SWAP_MIN = 5;
  const RECOVERY_MIN = 10;
  return PREP_MIN + flightTimeMin + batterySwaps * PER_SWAP_MIN + RECOVERY_MIN;
}

/** Суммарная площадь всех полигонов в гектарах. */
export function totalPolygonAreaHa(polygons: Polygon[]): number {
  return polygons.reduce((sum, p) => sum + polygonAreaHa(p), 0);
}

/** Сколько вылетов нужно на маршрут при заданном ресурсе батареи. */
export function batteryCount(timeMin: number, maxFlightTimeMin: number): number {
  return Math.max(1, Math.ceil(timeMin / maxFlightTimeMin));
}