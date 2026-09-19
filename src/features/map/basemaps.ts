import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import type { BasemapId } from '@/store/mapView';

export function createBasemapLayer(id: BasemapId): TileLayer<XYZ> {
  const configs: Record<BasemapId, { url: string; attributions: string }> = {
    voyager: {
      url: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      attributions: '© OpenStreetMap contributors © CARTO',
    },
    dark: {
      url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      attributions: '© OpenStreetMap contributors © CARTO',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
    },
  };

  const cfg = configs[id];
  return new TileLayer({
    source: new XYZ({ url: cfg.url, attributions: cfg.attributions }),
    properties: { role: 'basemap' },
  });
}