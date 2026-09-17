import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  toggle: () => set((s) => ({ isDark: !s.isDark })),
  setDark: (value) => set({ isDark: value }),
}));