import { Ruler, Square, Clock } from 'lucide-react';

interface GsdAreaPanelProps {
  gsdCmPerPx: number | null;
  footprintM: number | null;
  photoStepM: number | null;
  polygonAreaHa: number | null;
  totalTimeMin: number | null;
  deploymentMin: number | null;
}

export function GsdAreaPanel({
  gsdCmPerPx,
  footprintM,
  photoStepM,
  polygonAreaHa,
  totalTimeMin,
  deploymentMin,
}: GsdAreaPanelProps) {
  if (!gsdCmPerPx && !polygonAreaHa) return null;

  return (
    <div className="rounded-md border border-border bg-card p-2 text-xs space-y-1.5">
      {polygonAreaHa !== null && (
        <div className="flex items-center gap-2">
          <Square className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Площадь:</span>
          <span className="ml-auto font-medium">
            {polygonAreaHa < 1
              ? `${(polygonAreaHa * 100).toFixed(1)} а`
              : `${polygonAreaHa.toFixed(2)} га`}
          </span>
        </div>
      )}
      {gsdCmPerPx !== null && (
        <div className="flex items-center gap-2">
          <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">GSD:</span>
          <span className="ml-auto font-medium">{gsdCmPerPx.toFixed(1)} см/пикс</span>
        </div>
      )}
      {footprintM !== null && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground ml-5">Кадр:</span>
          <span className="ml-auto">
            {footprintM.toFixed(0)} м · шаг {photoStepM?.toFixed(1)} м
          </span>
        </div>
      )}
      {totalTimeMin !== null && (
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Полёт:</span>
          <span className="ml-auto font-medium">{totalTimeMin.toFixed(0)} мин</span>
        </div>
      )}
      {deploymentMin !== null && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground ml-5">Миссия:</span>
          <span className="ml-auto">≈ {deploymentMin.toFixed(0)} мин</span>
        </div>
      )}
    </div>
  );
}