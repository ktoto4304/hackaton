import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">БВС Планировщик</h1>
          <p className="text-sm text-muted-foreground">
            Расчёт полётных заданий
          </p>
        </div>

        <nav className="space-y-1">
          <a href="/projects" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Проекты
          </a>
          <a href="/bvs" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Парк БВС
          </a>
          <a href="/settings" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
            Настройки
          </a>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border px-6">
          <span className="text-sm text-muted-foreground">
            Расчёт оптимального полётного задания
          </span>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}