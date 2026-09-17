import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '@/store/ui';

interface WorkspaceLayoutProps {
  leftPanel: React.ReactNode;
  centerContent: React.ReactNode;
  rightPanel: React.ReactNode;
}

const LEFT_WIDTH = '20rem';
const RIGHT_WIDTH = '24rem';

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
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Левая панель */}
      <div
        className={`relative h-full shrink-0 border-r border-border bg-card ${transitionClass}`}
        style={{ width: leftOpen ? LEFT_WIDTH : '0px' }}
      >
        {leftOpen && <div className="h-full overflow-auto p-4">{leftPanel}</div>}
      </div>

      {/* Кнопка сворачивания левой панели */}
      <Button
        size="icon"
        className={`absolute top-4 z-30 h-8 w-8 rounded-full shadow-lg border border-border bg-background hover:bg-accent text-foreground ${transitionClass}`}
        style={{ left: leftOpen ? `calc(${LEFT_WIDTH} - 1rem)` : '0.5rem' }}
        onClick={toggleLeft}
      >
        {leftOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Центр: h-full + flex-1 + w-full. Без min-w-0, чтобы не схлопывался */}
      <div className="relative h-full flex-1 w-full overflow-hidden">
        {centerContent}
      </div>

      {/* Правая панель */}
      <div
        className={`relative h-full shrink-0 border-l border-border bg-card ${transitionClass}`}
        style={{ width: rightOpen ? RIGHT_WIDTH : '0px' }}
      >
        {rightOpen && <div className="h-full overflow-auto p-4">{rightPanel}</div>}
      </div>

      {/* Кнопка сворачивания правой панели */}
      <Button
        size="icon"
        className={`absolute top-4 z-30 h-8 w-8 rounded-full shadow-lg border border-border bg-background hover:bg-accent text-foreground ${transitionClass}`}
        style={{ right: rightOpen ? `calc(${RIGHT_WIDTH} - 1rem)` : '0.5rem' }}
        onClick={toggleRight}
      >
        {rightOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  );
}