import { z } from 'zod';

export const droneTypeSchema = z.enum([
  'quadcopter',
  'fixed-wing',
  'helicopter',
  'vtol',
]);

export const droneSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, 'Название слишком короткое').max(100),
  maxFlightTimeMin: z.number().min(1).max(2000),
  cruiseSpeedMs: z.number().min(1).max(200),
  maxTakeoffWeightG: z.number().min(1).max(100000),
  type: droneTypeSchema,
});

export const cameraSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, 'Название слишком короткое').max(100),
  fovDeg: z.number().min(1).max(360),
  resolutionMp: z.number().min(1).max(500),
  focalLengthMm: z.number().min(1).max(2000),
  overlapPercent: z.number().min(0).max(99),
});

export type DroneInput = z.infer<typeof droneSchema>;
export type CameraInput = z.infer<typeof cameraSchema>;