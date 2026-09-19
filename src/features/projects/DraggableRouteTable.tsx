import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { RouteResult } from '@/store/projects';
import { ROUTE_COLORS_ARRAY } from './routeColors';

interface DraggableRouteTableProps {
  routes: RouteResult[];
  onReorder?: (order: number[]) => void;
}

export function DraggableRouteTable({
  routes,
  onReorder,
}: DraggableRouteTableProps) {
  const [order, setOrder] = useState<number[]>(() => routes.map((_, i) => i));
  const [dragging, setDragging] = useState<number | null>(null);

  const handleDragStart = (i: number) => setDragging(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragging === null || dragging === i) return;
    const next = [...order];
    const [moved] = next.splice(dragging, 1);
    next.splice(i, 0, moved);
    setOrder(next);
    setDragging(i);
    onReorder?.(next);
  };
  const handleDragEnd = () => setDragging(null);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="w-6"></th>
            <th className="px-3 py-2 text-left">Борт</th>
            <th className="px-3 py-2 text-right">Длина, км</th>
            <th className="px-3 py-2 text-right">Время, мин</th>
            <th className="px-3 py-2 text-right">Снимков</th>
          </tr>
        </thead>
        <tbody>
          {order.map((idx, visualPos) => {
            const r = routes[idx];
            if (!r) return null;
            const color = ROUTE_COLORS_ARRAY[r.droneId % ROUTE_COLORS_ARRAY.length];
            return (
              <tr
                key={r.droneId}
                draggable
                onDragStart={() => handleDragStart(visualPos)}
                onDragOver={(e) => handleDragOver(e, visualPos)}
                onDragEnd={handleDragEnd}
                className={`border-t border-border cursor-move ${
                  dragging === visualPos ? 'bg-accent/50' : ''
                }`}
              >
                <td className="pl-2 text-muted-foreground">
                  <GripVertical className="h-3.5 w-3.5" />
                </td>
                <td className="px-3 py-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ background: color }}
                  />
                  Борт {r.droneId + 1}
                </td>
                <td className="px-3 py-2 text-right">{r.lengthKm.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{r.timeMin.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{r.photos}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}