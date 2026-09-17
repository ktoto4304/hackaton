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
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Сайдбар: на узких экранах — только иконки (w-14),
          на lg и шире — с подписями (w-56). */}
      <aside className="w-14 lg:w-56 shrink-0 border-r border-border bg-card p-2 lg:p-4 overflow-auto">
        <div className="mb-6 hidden lg:block">
          <h1 className="text-lg font-semibold">БВС Планировщик</h1>
          <p className="text-xs text-muted-foreground">Расчёт полётных заданий</p>
        </div>
        <div className="mb-4 lg:hidden flex justify-center">
          <MapIcon className="h-5 w-5 text-muted-foreground" />
        </div>

        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              title={label}
              className={({ isActive }) =>
                `flex items-center justify-center lg:justify-start gap-2 rounded-md px-2 lg:px-3 py-2.5 lg:py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'hover:bg-accent/50'
                }`
              }
            >
              <Icon className="h-5 w-5 lg:h-4 lg:w-4 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 lg:px-6 gap-3">
          <span className="text-sm text-muted-foreground truncate">
            Расчёт оптимального полётного задания для группы БВС
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            className="h-10 w-10 lg:h-9 lg:w-9 shrink-0"
            aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <div className="relative flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}