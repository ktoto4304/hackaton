import { useEffect } from 'react';

type Handler = (e: KeyboardEvent) => void;

interface HotkeyMap {
  [combo: string]: Handler;
}

/**
 * Комбо пишутся так: 'r', 'p', 'Escape', 'ctrl+z', 'ctrl+shift+z', 'Delete'.
 * Модификаторы: ctrl, shift, alt, meta.
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      // Игнорируем ввод в полях
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');

      let key = e.key;
      if (key.length === 1) key = key.toLowerCase();
      parts.push(key);

      const combo = parts.join('+');
      const handler = map[combo];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [map, enabled]);
}