import { useMediaQuery } from './useMediaQuery';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * Определяет «логический» брейкпоинт с учётом тач-ввода.
 *
 * - desktop: ширина ≥ 1280 и нет coarse pointer (мышь/трекпад)
 * - tablet:  ширина ≥ 768 (включая iPad Pro в ландшафте — там coarse pointer)
 * - mobile:  всё, что уже 768
 *
 * Тач-устройства даже с широким экраном получают 'tablet',
 * потому что интерфейс под палец отличается от интерфейса под мышь.
 */
export function useBreakpoint(): Breakpoint {
  const isDesktopWidth = useMediaQuery('(min-width: 1280px)');
  const isTabletWidth = useMediaQuery('(min-width: 768px)');
  const hasCoarsePointer = useMediaQuery('(pointer: coarse)');

  if (isDesktopWidth && !hasCoarsePointer) return 'desktop';
  if (isTabletWidth) return 'tablet';
  return 'mobile';
}