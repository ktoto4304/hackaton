// src/store/mapView.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type BasemapId = 'voyager' | 'dark' | 'satellite';

export interface ViewBookmark {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

interface MapViewState {
  basemap: BasemapId;
  showRoutes: boolean;
  showRunways: boolean;
  showPolygons: boolean;
  topBarVisible: boolean;
  secondaryOpen: boolean;
  bookmarks: ViewBookmark[];
  setBasemap: (b: BasemapId) => void;
  toggleRoutes: () => void;
  toggleRunways: () => void;
  togglePolygons: () => void;
  toggleTopBar: () => void;
  setSecondaryOpen: (v: boolean) => void;
  addBookmark: (b: Omit<ViewBookmark, 'id'>) => void;
  removeBookmark: (id: string) => void;
}

const DEFAULT_STATE = {
  basemap: 'voyager' as BasemapId,
  showRoutes: true,
  showRunways: true,
  showPolygons: true,
  topBarVisible: true,
  secondaryOpen: false,
  bookmarks: [] as ViewBookmark[],
};

export const useMapView = create<MapViewState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setBasemap: (b) => set({ basemap: b }),
      toggleRoutes: () => set((s) => ({ showRoutes: !s.showRoutes })),
      toggleRunways: () => set((s) => ({ showRunways: !s.showRunways })),
      togglePolygons: () => set((s) => ({ showPolygons: !s.showPolygons })),
      toggleTopBar: () => set((s) => ({ topBarVisible: !s.topBarVisible })),
      setSecondaryOpen: (v) => set({ secondaryOpen: v }),
      addBookmark: (b) =>
        set((s) => ({
          bookmarks: [
            ...(Array.isArray(s.bookmarks) ? s.bookmarks : []),
            { ...b, id: crypto.randomUUID() },
          ],
        })),
      removeBookmark: (id) =>
        set((s) => ({
          bookmarks: (Array.isArray(s.bookmarks) ? s.bookmarks : []).filter(
            (b) => b.id !== id,
          ),
        })),
    }),
    {
      name: 'bvs-map-view',
      version: 3, // ← подняли, чтобы миграция сработала у всех
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: any, version) => {
        // v < 3: гарантируем наличие всех полей и корректные типы.
        const base = { ...DEFAULT_STATE, ...(persisted ?? {}) };
        return {
          ...base,
          basemap:
            base.basemap === 'voyager' ||
            base.basemap === 'dark' ||
            base.basemap === 'satellite'
              ? base.basemap
              : 'voyager',
          showRoutes: Boolean(base.showRoutes ?? true),
          showRunways: Boolean(base.showRunways ?? true),
          showPolygons: Boolean(base.showPolygons ?? true),
          topBarVisible: Boolean(base.topBarVisible ?? true),
          secondaryOpen: Boolean(base.secondaryOpen ?? false),
          bookmarks: Array.isArray(base.bookmarks) ? base.bookmarks : [],
        };
      },
      /**
       * Кастомный merge: берём дефолт как основу, поверх — persisted,
       * но НИКОГДА не даём undefined из persisted перекрыть дефолт.
       * Это защищает от старых записей, где поле отсутствовало или было null.
       */
      merge: (persisted: any, current) => {
        const p = persisted ?? {};
        return {
          ...current,
          basemap:
            p.basemap === 'voyager' ||
            p.basemap === 'dark' ||
            p.basemap === 'satellite'
              ? p.basemap
              : current.basemap,
          showRoutes:
            typeof p.showRoutes === 'boolean' ? p.showRoutes : current.showRoutes,
          showRunways:
            typeof p.showRunways === 'boolean' ? p.showRunways : current.showRunways,
          showPolygons:
            typeof p.showPolygons === 'boolean' ? p.showPolygons : current.showPolygons,
          topBarVisible:
            typeof p.topBarVisible === 'boolean'
              ? p.topBarVisible
              : current.topBarVisible,
          secondaryOpen:
            typeof p.secondaryOpen === 'boolean'
              ? p.secondaryOpen
              : current.secondaryOpen,
          bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks : current.bookmarks,
        };
      },
    },
  ),
);