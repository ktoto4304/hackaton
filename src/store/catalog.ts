import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { INITIAL_DRONES, INITIAL_CAMERAS } from '@/features/drones/mock-data';
import type { Drone, Camera } from '@/features/drones/types';

interface CatalogState {
  drones: Drone[];
  cameras: Camera[];
  addDrone: (d: Drone) => void;
  updateDrone: (d: Drone) => void;
  removeDrone: (id: string) => void;
  replaceDrones: (list: Drone[]) => void;
  addCamera: (c: Camera) => void;
  updateCamera: (c: Camera) => void;
  removeCamera: (id: string) => void;
  replaceCameras: (list: Camera[]) => void;
}

export const useCatalog = create<CatalogState>()(
  persist(
    (set) => ({
      drones: INITIAL_DRONES,
      cameras: INITIAL_CAMERAS,
      addDrone: (d) => set((s) => ({ drones: [...s.drones, d] })),
      updateDrone: (d) =>
        set((s) => ({ drones: s.drones.map((x) => (x.id === d.id ? d : x)) })),
      removeDrone: (id) =>
        set((s) => ({ drones: s.drones.filter((x) => x.id !== id) })),
      replaceDrones: (list) => set({ drones: list }),
      addCamera: (c) => set((s) => ({ cameras: [...s.cameras, c] })),
      updateCamera: (c) =>
        set((s) => ({ cameras: s.cameras.map((x) => (x.id === c.id ? c : x)) })),
      removeCamera: (id) =>
        set((s) => ({ cameras: s.cameras.filter((x) => x.id !== id) })),
      replaceCameras: (list) => set({ cameras: list }),
    }),
    {
      name: 'bvs-catalog',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Если схема справочника поменяется в будущем — миграция здесь.
      migrate: (state) => state as CatalogState,
    },
  ),
);