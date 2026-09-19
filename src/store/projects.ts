import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProjectFormData } from '@/features/projects/schema';

export interface RouteResult {
  droneId: number;
  lengthKm: number;
  timeMin: number;
  photos: number;
}

/** GeoJSON FeatureCollection как строка — так проще хранить в localStorage. */
export type RoutesGeoJSON = string;

export interface SavedProject {
  id: string;
  createdAt: string;
  updatedAt: string;
  form: ProjectFormData;
  routes: RouteResult[];
  routesGeoJSON: RoutesGeoJSON | null;
}

interface ProjectsState {
  projects: SavedProject[];
  activeProjectId: string | null;
  createProject: (form: ProjectFormData) => SavedProject;
  updateProject: (
    id: string,
    patch: Partial<Omit<SavedProject, 'id' | 'createdAt'>>,
  ) => void;
  deleteProject: (id: string) => void;
  setActive: (id: string | null) => void;
  getProject: (id: string) => SavedProject | undefined;
}

export const useProjects = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      createProject: (form) => {
        const now = new Date().toISOString();
        const project: SavedProject = {
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          form,
          routes: [],
          routesGeoJSON: null,
        };
        set((s) => ({
          projects: [project, ...s.projects],
          activeProjectId: project.id,
        }));
        return project;
      },
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, ...patch, updatedAt: new Date().toISOString() }
              : p,
          ),
        })),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        })),
      setActive: (id) => set({ activeProjectId: id }),
      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    {
      name: 'bvs-projects',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);