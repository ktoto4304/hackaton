import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '@/store/ui';

interface WorkspaceLayoutProps {
  leftPanel: React.ReactNode;
  centerContent: React.ReactNode;
  rightPanel: React.ReactNode;
}

const LEFT_WIDTH = 'clamp(16rem, 22vw, 20rem)';
const RIGHT_WIDTH = 'clamp(18rem, 26vw, 24rem)';

export function WorkspaceLayout({
  leftPanel,
  centerContent,
  rightPanel,
}: WorkspaceLayoutProps) {
  const leftOpen = useUiStore((s) => s.leftPanelOpen);
  const rightOpen = useUiStore((s) => s.rightPanelOpen);
  const toggleLeft = useUiStore((s) => s.toggleLeftPanel);
  const toggleRight = useUiStore((s) => s.toggleRightPanel);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const transitionClass = mounted ? 'transition-all duration-300' : '';

  return (
    <div
      className="relative flex h-full w-full min-h-0 overflow-hidden"
      style={
        {
          '--left-w': LEFT_WIDTH,
          '--right-w': RIGHT_WIDTH,
        } as React.CSSProperties
      }
    >
      {/* Левая панель */}
      <div
        className={`relative h-full shrink-0 border-r border-border bg-card ${transitionClass}`}
        style={{ width: leftOpen ? 'var(--left-w)' : '0px' }}
      >
        {leftOpen && <div className="h-full overflow-auto p-3 lg:p-4">{leftPanel}</div>}
      </div>

      {/* Кнопка сворачивания левой панели */}
      <Button
        size="icon"
        aria-label={leftOpen ? 'Свернуть левую панель' : 'Развернуть левую панель'}
        className={`absolute top-4 z-30 h-11 w-11 lg:h-8 lg:w-8 rounded-full shadow-lg border border-border bg-background hover:bg-accent text-foreground ${transitionClass}`}
        style={{ left: leftOpen ? 'calc(var(--left-w) - 1.25rem)' : '0.5rem' }}
        onClick={toggleLeft}
      >
        {leftOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Центр */}
      <div className="relative h-full flex-1 min-w-0 min-h-0 overflow-hidden">
        {centerContent}
      </div>

      {/* Правая панель */}
      <div
        className={`relative h-full shrink-0 border-l border-border bg-card ${transitionClass}`}
        style={{ width: rightOpen ? 'var(--right-w)' : '0px' }}
      >
        {rightOpen && <div className="h-full overflow-auto p-3 lg:p-4">{rightPanel}</div>}
      </div>

      {/* Кнопка сворачивания правой панели */}
      <Button
        size="icon"
        aria-label={rightOpen ? 'Свернуть правую панель' : 'Развернуть правую панель'}
        className={`absolute top-4 z-30 h-11 w-11 lg:h-8 lg:w-8 rounded-full shadow-lg border border-border bg-background hover:bg-accent text-foreground ${transitionClass}`}
        style={{ right: rightOpen ? 'calc(var(--right-w) - 1.25rem)' : '0.5rem' }}
        onClick={toggleRight}
      >
        {rightOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  );
}