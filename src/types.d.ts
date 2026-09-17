// src/types.d.ts
declare module '*.css';

declare module 'planefill' {
  export function planPath(
    polygon: any,
    options?: { strategy?: string; spacing?: number; [key: string]: any }
  ): any;

  export function planMultiPath(
    polygon: any,
    options?: {
      parties?: number;
      divisionStrategy?: string;
      coverageStrategy?: string;
      spacing?: number;
      [key: string]: any;
    }
  ): any;
}