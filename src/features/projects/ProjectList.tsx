import { Button } from '@/components/ui/button';
import { Popconfirm, notification } from 'antd';
import { Trash2, FolderOpen } from 'lucide-react';
import { useProjects } from '@/store/projects';
import { useProjectDraft } from '@/store/projectDraft';
import {
  exportGeoJSON,
  exportKML,
  exportGPX,
  exportCSV,
} from './exporters';

export function ProjectList() {
  const projects = useProjects((s) => s.projects);
  const activeId = useProjects((s) => s.activeProjectId);
  const setActive = useProjects((s) => s.setActive);
  const deleteProject = useProjects((s) => s.deleteProject);
  const replaceDraft = useProjectDraft((s) => s.replaceDraft);

  const openProject = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setActive(id);
    replaceDraft(p.form);
  };

  const handleExport = (
    kind: 'geojson' | 'kml' | 'gpx' | 'csv',
    id: string,
  ) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    const fns = {
      geojson: exportGeoJSON,
      kml: exportKML,
      gpx: exportGPX,
      csv: exportCSV,
    };
    const ok = fns[kind](p);
    if (!ok) {
      notification.warning({
        message: 'Нечего экспортировать',
        description: 'Сначала рассчитайте маршруты на карте',
        placement: 'topRight',
      });
    }
  };

  if (!projects.length) {
    return (
      <div className="text-sm text-muted-foreground">
        Сохранённых проектов пока нет.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((p) => (
        <div
          key={p.id}
          className={`rounded-md border p-2 ${
            p.id === activeId ? 'border-primary bg-accent/40' : 'border-border'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => openProject(p.id)}
              className="flex-1 text-left"
            >
              <div className="text-sm font-medium truncate">{p.form.name}</div>
              <div className="text-xs text-muted-foreground">
                {p.form.date} · {p.form.bvsIds.length} БВС ·{' '}
                {p.routes.length ? `${p.routes.length} маршр.` : 'без маршрутов'}
              </div>
            </button>
            <Popconfirm
              title="Удалить проект?"
              okText="Да"
              cancelText="Нет"
              onConfirm={() => deleteProject(p.id)}
            >
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Popconfirm>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => openProject(p.id)}
            >
              <FolderOpen className="h-3 w-3 mr-1" /> Открыть
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleExport('geojson', p.id)}
            >
              GeoJSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleExport('kml', p.id)}
            >
              KML
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleExport('gpx', p.id)}
            >
              GPX
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleExport('csv', p.id)}
            >
              CSV
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}