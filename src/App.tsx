import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { DronesPage } from '@/pages/DronesPage';
import { CamerasPage } from '@/pages/CamerasPage';

function App() {
  return (
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
  );
}

export default App;