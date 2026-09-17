import type { Drone, Camera } from './types';

export const INITIAL_DRONES: Drone[] = [
  { id: 'm3e', name: 'DJI Mavic 3 Enterprise', maxFlightTimeMin: 45, cruiseSpeedMs: 21, maxTakeoffWeightG: 1050, type: 'quadcopter' },
  { id: 'm300', name: 'DJI Matrice 300 RTK', maxFlightTimeMin: 55, cruiseSpeedMs: 23, maxTakeoffWeightG: 3600, type: 'quadcopter' },
  { id: 's350', name: 'Supercam S350', maxFlightTimeMin: 270, cruiseSpeedMs: 33, maxTakeoffWeightG: 15500, type: 'fixed-wing' },
  { id: 'orlan10', name: 'Орлан-10', maxFlightTimeMs: 960, cruiseSpeedMs: 42, maxTakeoffWeightG: 18000, type: 'fixed-wing' } as any,
];

export const INITIAL_CAMERAS: Camera[] = [
  { id: 'm3e-wide', name: 'Mavic 3E Wide (4/3 CMOS)', fovDeg: 84, resolutionMp: 20, focalLengthMm: 24, overlapPercent: 70 },
  { id: 'h20t', name: 'Zenmuse H20T', fovDeg: 82.9, resolutionMp: 20, focalLengthMm: 24, overlapPercent: 75 },
  { id: 's350-pf1b', name: 'Supercam S350 Photo 24Mp', fovDeg: 73, resolutionMp: 24, focalLengthMm: 20, overlapPercent: 80 },
];