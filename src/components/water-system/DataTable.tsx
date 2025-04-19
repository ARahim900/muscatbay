
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { waterData } from '@/data/water-data';
import { formatNumber } from '@/lib/utils';

export function DataTable() {
  return (
    <Table>
      <TableCaption>Water consumption by zone</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Zone</TableHead>
          <TableHead className="text-right">Consumption (m³)</TableHead>
          <TableHead className="text-right">Loss (m³)</TableHead>
          <TableHead className="text-right">Loss %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {waterData.zones.map((zone) => (
          <TableRow key={zone.name}>
            <TableCell className="font-medium">{zone.name}</TableCell>
            <TableCell className="text-right">{formatNumber(zone.consumption)}</TableCell>
            <TableCell className="text-right">{formatNumber(zone.loss)}</TableCell>
            <TableCell className="text-right">
              {((zone.loss / zone.consumption) * 100).toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
