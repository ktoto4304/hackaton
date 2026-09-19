import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';

export interface ImportResult {
  features: Feature[];
  errors: string[];
  format: 'kml' | 'geojson' | 'unknown';
}

const geojsonFormat = new GeoJSON();

/**
 * Парсит KML 2.2 и извлекает все Polygon.
 * Ожидаемые элементы: <Placemark> → <Polygon><outerBoundaryIs><LinearRing><coordinates>
 * Координаты в KML — lon,lat,alt через запятую, пары через пробел.
 */
function parseKml(text: string): ImportResult {
  const errors: string[] = [];
  const features: Feature[] = [];

  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { features: [], errors: ['Некорректный XML в KML'], format: 'kml' };
  }

  const placemarks = doc.getElementsByTagName('Placemark');
  if (!placemarks.length) {
    return { features: [], errors: ['В KML нет элементов Placemark'], format: 'kml' };
  }

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const name =
      pm.getElementsByTagName('name')[0]?.textContent?.trim() || `Область ${i + 1}`;

    const outerRings = pm.getElementsByTagName('outerBoundaryIs');
    for (let j = 0; j < outerRings.length; j++) {
      const coordsEl = outerRings[j].getElementsByTagName('coordinates')[0];
      if (!coordsEl?.textContent) continue;

      const coords: [number, number][] = [];
      const pairs = coordsEl.textContent.trim().split(/\s+/);
      for (const pair of pairs) {
        const [lonStr, latStr] = pair.split(',');
        const lon = Number(lonStr);
        const lat = Number(latStr);
        if (!isFinite(lon) || !isFinite(lat)) continue;
        coords.push([lon, lat]);
      }
      if (coords.length < 3) {
        errors.push(`Placemark «${name}»: меньше 3 точек`);
        continue;
      }

      // KML-полигон может быть не замкнут — замыкаем
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push(first);
      }

      const olCoords = coords.map(([lon, lat]) => fromLonLat([lon, lat]));
      const feature = new Feature({
        geometry: new Polygon([olCoords]),
        name,
      });
      feature.set('imported', true);
      features.push(feature);
    }
  }

  return { features, errors, format: 'kml' };
}

function parseGeoJSON(text: string): ImportResult {
  const errors: string[] = [];
  const features: Feature[] = [];

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return { features: [], errors: ['Некорректный JSON'], format: 'geojson' };
  }

  const objects: any[] =
    data.type === 'FeatureCollection'
      ? data.features
      : data.type === 'Feature'
        ? [data]
        : [data];

  for (const obj of objects) {
    try {
      const olFeature = geojsonFormat.readFeature(obj, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }) as Feature;
      const geom = olFeature.getGeometry();
      if (geom instanceof Polygon) {
        olFeature.set('name', olFeature.get('name') || `Область ${features.length + 1}`);
        olFeature.set('imported', true);
        features.push(olFeature);
      } else {
        errors.push(`Пропущен объект типа ${geom?.getType()}`);
      }
    } catch (e) {
      errors.push(`Ошибка разбора фичи: ${(e as Error).message}`);
    }
  }

  return { features, errors, format: 'geojson' };
}

export function importGeometryFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () =>
      resolve({ features: [], errors: ['Не удалось прочитать файл'], format: 'unknown' });
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const isKml =
        file.name.toLowerCase().endsWith('.kml') || text.trimStart().startsWith('<?xml');
      const result = isKml ? parseKml(text) : parseGeoJSON(text);
      resolve(result);
    };
    reader.readAsText(file);
  });
}