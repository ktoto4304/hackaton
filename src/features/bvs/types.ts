export interface Bvs {
  id: string;
  model: string;
  maxFlightTime: number; // минуты
}

export const BVS_FLEET: Bvs[] = [
  { id: '1', model: 'DJI Matrice 300 RTK', maxFlightTime: 55 },
  { id: '2', model: 'DJI Mavic 3 Enterprise', maxFlightTime: 45 },
  { id: '3', model: 'Autel EVO II Pro', maxFlightTime: 40 },
  { id: '4', model: 'Геоскан 201', maxFlightTime: 180 },
];