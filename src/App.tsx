import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { DronesPage } from '@/pages/DronesPage';
import { CamerasPage } from '@/pages/CamerasPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useUiStore } from '@/store/ui';
import { useEffect } from 'react';

function App() {
  const bp = useBreakpoint();
  const syncWithBreakpoint = useUiStore((s) => s.syncWithBreakpoint);

  useEffect(() => {
    syncWithBreakpoint(bp);
  }, [bp, syncWithBreakpoint]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/drones" element={<DronesPage />} />
            <Route path="/cameras" element={<CamerasPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;