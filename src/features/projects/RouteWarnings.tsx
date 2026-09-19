import { Alert } from 'antd';
import type { RouteWarning } from '@/features/map/validation';

interface RouteWarningsProps {
  warnings: RouteWarning[];
}

export function RouteWarnings({ warnings }: RouteWarningsProps) {
  if (!warnings.length) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <Alert
          key={i}
          type={w.severity === 'error' ? 'error' : 'warning'}
          message={w.message}
          showIcon
          className="text-xs"
        />
      ))}
    </div>
  );
}