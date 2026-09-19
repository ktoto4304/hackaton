import { useState } from 'react';
import { Input, Button } from 'antd';
import { Search } from 'lucide-react';

interface CoordinateSearchProps {
  onGoTo: (lon: number, lat: number) => void;
}

export function CoordinateSearch({ onGoTo }: CoordinateSearchProps) {
  const [value, setValue] = useState('');

  const handleGo = () => {
    // Принимаем "lat, lon" или "lat lon"
    const parts = value.trim().split(/[,\s]+/).map(Number);
    if (parts.length !== 2 || parts.some((n) => !isFinite(n))) return;
    const [lat, lon] = parts;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;
    onGoTo(lon, lat);
  };

  return (
    <div className="flex gap-2">
      <Input
        size="small"
        placeholder="55.7558, 37.6173"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleGo}
        style={{ width: 180 }}
      />
      <Button
        size="small"
        icon={<Search className="h-3.5 w-3.5" />}
        onClick={handleGo}
      />
    </div>
  );
}