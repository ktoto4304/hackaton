import type { Feature, FeatureCollection } from 'geojson';
import type { SavedProject, RouteResult } from '@/store/projects';

// ---------- helpers ----------

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function safeName(name: string): string {
  return name.replace(/[^\wа-яА-Я0-9-_]+/gi, '_').slice(0, 60) || 'project';
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------- GeoJSON ----------

export function exportGeoJSON(project: SavedProject) {
  if (!project.routesGeoJSON) return false;
  download(
    `${safeName(project.form.name)}.geojson`,
    project.routesGeoJSON,
    'application/geo+json',
  );
  return true;
}

// ---------- KML ----------

/**
 * Принимает FeatureCollection (WGS84) и собирает KML 2.2.
 * Поддерживает LineString — этого достаточно для маршрутов.
 */
function geojsonToKml(fc: FeatureCollection, projectName: string): string {
  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
  parts.push('<Document>');
  parts.push(`<name>${escapeXml(projectName)}</name>`);

  // Палитра по бортам — совпадает с цветами на карте.
  const COLORS = ['ff1ea316', 'ff08b3ea', 'ffc93bea', 'ffc65c8b', 'ff16d9f9'];
  COLORS.forEach((c, i) => {
    parts.push(
      `<Style id="route-${i}">` +
        `<LineStyle><color>${c}</color><width>4</width></LineStyle>` +
        `</Style>`,
    );
  });

  fc.features.forEach((f: Feature, i: number) => {
    if (!f.geometry) return;
    if (f.geometry.type !== 'LineString') return;
    const coords = (f.geometry.coordinates as [number, number][])
      .map(([lon, lat]) => `${lon},${lat},0`)
      .join(' ');
    parts.push('<Placemark>');
    parts.push(`<name>Борт ${i + 1}</name>`);
    parts.push(`<styleUrl>#route-${i % COLORS.length}</styleUrl>`);
    parts.push('<LineString>');
    parts.push('<tessellate>1</tessellate>');
    parts.push(`<coordinates>${coords}</coordinates>`);
    parts.push('</LineString>');
    parts.push('</Placemark>');
  });

  parts.push('</Document>');
  parts.push('</kml>');
  return parts.join('');
}

export function exportKML(project: SavedProject) {
  if (!project.routesGeoJSON) return false;
  const fc = JSON.parse(project.routesGeoJSON) as FeatureCollection;
  const kml = geojsonToKml(fc, project.form.name);
  download(`${safeName(project.form.name)}.kml`, kml, 'application/vnd.google-earth.kml+xml');
  return true;
}

// ---------- GPX ----------

function geojsonToGpx(fc: FeatureCollection, projectName: string): string {
  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    '<gpx version="1.1" creator="БВС Планировщик" xmlns="http://www.topografix.com/GPX/1/1">',
  );
  parts.push(`<metadata><name>${escapeXml(projectName)}</name></metadata>`);

  fc.features.forEach((f: Feature, i: number) => {
    if (!f.geometry || f.geometry.type !== 'LineString') return;
    parts.push('<trk>');
    parts.push(`<name>Борт ${i + 1}</name>`);
    parts.push('<trkseg>');
    (f.geometry.coordinates as [number, number][]).forEach(([lon, lat]) => {
      parts.push(`<trkpt lat="${lat}" lon="${lon}"></trkpt>`);
    });
    parts.push('</trkseg>');
    parts.push('</trk>');
  });

  parts.push('</gpx>');
  return parts.join('');
}

export function exportGPX(project: SavedProject) {
  if (!project.routesGeoJSON) return false;
  const fc = JSON.parse(project.routesGeoJSON) as FeatureCollection;
  const gpx = geojsonToGpx(fc, project.form.name);
  download(`${safeName(project.form.name)}.gpx`, gpx, 'application/gpx+xml');
  return true;
}

// ---------- CSV ----------

export function exportCSV(project: SavedProject) {
  if (!project.routes.length) return false;

  const header = [
    'Проект',
    'Дата',
    'Борт',
    'Длина, км',
    'Время, мин',
    'Снимков',
    'Высота, м',
    'Шаг, м',
  ];
  const rows = project.routes.map((r: RouteResult) => [
    project.form.name,
    project.form.date,
    String(r.droneId + 1),
    r.lengthKm.toFixed(3),
    r.timeMin.toFixed(2),
    String(r.photos),
    String(project.form.flightHeightM),
    String(project.form.spacingM),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  // BOM — чтобы Excel не поломал кириллицу
  download(
    `${safeName(project.form.name)}.csv`,
    '\uFEFF' + csv,
    'text/csv',
  );
  return true;
}