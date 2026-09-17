export type DroneType = 'quadcopter' | 'fixed-wing' | 'helicopter' | 'vtol';

export interface Drone {
  id: string;
  name: string;
  maxFlightTimeMin: number;
  cruiseSpeedMs: number;
  maxTakeoffWeightG: number;
  type: DroneType;
}

export interface Camera {
  id: string;
  name: string;
  fovDeg: number;
  resolutionMp: number;
  focalLengthMm: number;
  overlapPercent: number;
}