import { Outlet, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Map as MapIcon, Plane, Camera } from 'lucide-react';
import { useThemeStore } from '@/store/theme';

export function AppLayout() {
  const { isDark, toggle } = useThemeStore();

  const navItems = [
    { to: '/projects', label: 'Проекты', icon: MapIcon },
    { to: '/drones', label: 'Парк БВС', icon: Plane },
    { to: '/cameras', label: 'Камеры', icon: Camera },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="w-56 shrink-0 border-r border-border bg-card p-4 overflow-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">БВС Планировщик</h1>
          <p className="text-xs text-muted-foreground">Расчёт полётных заданий</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'hover:bg-accent/50'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
          <span className="text-sm text-muted-foreground">
            Расчёт оптимального полётного задания для группы БВС
          </span>
          <Button variant="outline" size="icon" onClick={toggle}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        {/* flex-1 + min-h-0 даёт Outlet явную высоту.
            Раньше было calc(100vh - 3.5rem) — из-за этого высота
            не совпадала с реальной и карта схлопывалась. */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}