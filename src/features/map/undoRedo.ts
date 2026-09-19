import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';

export interface MapSnapshot {
  polygons: Feature<Geometry>[];
  runways: Feature<Geometry>[];
}

const MAX_HISTORY = 50;

export class UndoRedoStack {
  private past: MapSnapshot[] = [];
  private future: MapSnapshot[] = [];

  push(snapshot: MapSnapshot) {
    this.past.push(snapshot);
    if (this.past.length > MAX_HISTORY) this.past.shift();
    this.future = [];
  }

  undo(): MapSnapshot | null {
    if (this.past.length < 2) return null;
    const current = this.past.pop()!;
    this.future.push(current);
    return this.past[this.past.length - 1];
  }

  redo(): MapSnapshot | null {
    if (!this.future.length) return null;
    const next = this.future.pop()!;
    this.past.push(next);
    return next;
  }

  canUndo(): boolean {
    return this.past.length > 1;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  reset() {
    this.past = [];
    this.future = [];
  }
}