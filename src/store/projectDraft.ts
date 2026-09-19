import { create } from 'zustand';
import type { ProjectFormData, SurveyParams } from '@/features/projects/schema';

const DEFAULT_DRAFT: ProjectFormData = {
  name: '',
  date: '',
  description: '',
  bvsIds: [],
  cameraId: '',
  flightHeightM: 120,
  spacingM: 30,
  coverageStrategy: 'boustrophedon',
  divisionStrategy: 'balanced',
};

interface ProjectDraftState {
  draft: ProjectFormData;
  setDraft: (patch: Partial<ProjectFormData>) => void;
  replaceDraft: (draft: ProjectFormData) => void;
  reset: () => void;
  /** Возвращает параметры для SurveyMap или null, если данных не хватает. */
  toSurveyParams: () => SurveyParams | null;
}

export const useProjectDraft = create<ProjectDraftState>((set, get) => ({
  draft: DEFAULT_DRAFT,
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  replaceDraft: (draft) => set({ draft }),
  reset: () => set({ draft: DEFAULT_DRAFT }),
  toSurveyParams: () => {
    const d = get().draft;
    if (!d.bvsIds.length) return null;
    if (!d.cameraId) return null;
    return {
      bvsIds: d.bvsIds,
      cameraId: d.cameraId,
      flightHeightM: d.flightHeightM,
      spacingM: d.spacingM,
      coverageStrategy: d.coverageStrategy,
      divisionStrategy: d.divisionStrategy,
    };
  },
}));