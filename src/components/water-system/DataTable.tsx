
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { waterData } from '@/data/water-data';
import { formatNumber } from '@/lib/utils';

export function DataTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Zone</TableHead>
          <TableHead className="text-right">Consumption (m³)</TableHead>
          <TableHead className="text-right">Loss (m³)</TableHead>
          <TableHead className="text-right">Efficiency (%)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {waterData.zones.map((zone, index) => {
          const efficiency = ((zone.consumption - zone.loss) / zone.consumption * 100).toFixed(1);
          
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{zone.name}</TableCell>
              <TableCell className="text-right">{formatNumber(zone.consumption)}</TableCell>
              <TableCell className="text-right">{formatNumber(zone.loss)}</TableCell>
              <TableCell className="text-right">{efficiency}%</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
