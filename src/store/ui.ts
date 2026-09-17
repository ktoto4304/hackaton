import { create } from 'zustand';
import type { Breakpoint } from '@/hooks/useBreakpoint';

interface UiState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  /** Текущий определённый брейкпоинт. Синхронизируется из App. */
  breakpoint: Breakpoint;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  /**
   * Вызывается при смене брейкпоинта. На десктопе панели открыты,
   * на планшете и мобильном — свёрнуты, чтобы карта занимала экран.
   */
  syncWithBreakpoint: (bp: Breakpoint) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  // Стартовые значения — консервативные (свёрнуто).
  // Реальный брейкпоинт определится в App и вызовет syncWithBreakpoint.
  leftPanelOpen: true,
  rightPanelOpen: true,
  breakpoint: 'desktop',
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  syncWithBreakpoint: (bp) => {
    const prev = get().breakpoint;
    if (prev === bp) return;
    set({
      breakpoint: bp,
      leftPanelOpen: bp === 'desktop',
      rightPanelOpen: bp === 'desktop',
    });
  },
}));