import { BVS_FLEET } from './types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BvsSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function BvsSelector({ selectedIds, onChange }: BvsSelectorProps) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Выбор БВС для группы</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Модель</TableHead>
              <TableHead className="text-right">
                Макс. время полёта (мин)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BVS_FLEET.map((bvs) => (
              <TableRow key={bvs.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(bvs.id)}
                    onCheckedChange={() => toggle(bvs.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{bvs.model}</TableCell>
                <TableCell className="text-right">{bvs.maxFlightTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}