import { Button, Popover, Segmented, Checkbox } from 'antd';
import { Layers, Bookmark } from 'lucide-react';
import {
  useMapView,
  type BasemapId,
  type ViewBookmark,
} from '@/store/mapView';

interface MapLayersPanelProps {
  currentCenter: [number, number] | null;
  currentZoom: number;
  onGoToBookmark: (b: ViewBookmark) => void;
}

const BASEMAPS: { value: BasemapId; label: string }[] = [
  { value: 'voyager', label: 'Схема' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'satellite', label: 'Спутник' },
];

export function MapLayersPanel({
  currentCenter,
  currentZoom,
  onGoToBookmark,
}: MapLayersPanelProps) {
  const basemap = useMapView((s) => s.basemap);
  const setBasemap = useMapView((s) => s.setBasemap);
  const showRoutes = useMapView((s) => s.showRoutes);
  const toggleRoutes = useMapView((s) => s.toggleRoutes);
  const showRunways = useMapView((s) => s.showRunways);
  const toggleRunways = useMapView((s) => s.toggleRunways);
  const showPolygons = useMapView((s) => s.showPolygons);
  const togglePolygons = useMapView((s) => s.togglePolygons);
  const rawBookmarks = useMapView((s) => s.bookmarks);
  const addBookmark = useMapView((s) => s.addBookmark);
  const removeBookmark = useMapView((s) => s.removeBookmark);

  // Защита от старого/битого persisted-состояния.
  const bookmarks: ViewBookmark[] = Array.isArray(rawBookmarks) ? rawBookmarks : [];

  const layersContent = (
    <div className="space-y-3 w-56">
      <div>
        <div className="text-xs text-muted-foreground mb-1">Подложка</div>
        <Segmented
          size="small"
          options={BASEMAPS}
          value={basemap}
          onChange={(v) => setBasemap(v as BasemapId)}
          block
        />
      </div>
      <div className="space-y-1">
        <Checkbox checked={showPolygons} onChange={togglePolygons}>
          Области съёмки
        </Checkbox>
        <Checkbox checked={showRunways} onChange={toggleRunways}>
          ВПП
        </Checkbox>
        <Checkbox checked={showRoutes} onChange={toggleRoutes}>
          Маршруты
        </Checkbox>
      </div>
    </div>
  );

  const bookmarksContent = (
    <div className="space-y-2 w-64">
      <Button
        size="small"
        block
        disabled={!currentCenter}
        onClick={() => {
          if (!currentCenter) return;
          const name = prompt('Название закладки', 'Вид 1');
          if (!name) return;
          addBookmark({ name, center: currentCenter, zoom: currentZoom });
        }}
      >
        Сохранить текущий вид
      </Button>
      {bookmarks.length === 0 ? (
        <div className="text-xs text-muted-foreground">Закладок пока нет</div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-auto">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-accent"
            >
              <button
                className="flex-1 text-left text-sm truncate"
                onClick={() => onGoToBookmark(b)}
              >
                {b.name}
              </button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => removeBookmark(b.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex gap-1">
      <Popover content={layersContent} title="Слои" trigger="click" placement="bottomLeft">
        <Button size="small" icon={<Layers className="h-3.5 w-3.5" />} className="h-11 lg:h-8">
          Слои
        </Button>
      </Popover>
      <Popover content={bookmarksContent} title="Закладки" trigger="click" placement="bottomLeft">
        <Button size="small" icon={<Bookmark className="h-3.5 w-3.5" />} className="h-11 lg:h-8">
          Виды
        </Button>
      </Popover>
    </div>
  );
}