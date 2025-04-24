
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssetLifecycleForecast } from '@/types/asset';
import { formatNumber } from '@/lib/utils';

export interface MaintenanceForecastTableProps {
  forecast: AssetLifecycleForecast[];
}

export const MaintenanceForecastTable: React.FC<MaintenanceForecastTableProps> = ({ forecast }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          <TableHead className="text-right">Replacements</TableHead>
          <TableHead className="text-right">Maintenance Costs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {forecast.map((item) => (
          <TableRow key={item.year}>
            <TableCell className="font-medium">{item.year}</TableCell>
            <TableCell className="text-right">{item.replacements}</TableCell>
            <TableCell className="text-right">{formatNumber(item.maintenanceCosts)} OMR</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MaintenanceForecastTable;
