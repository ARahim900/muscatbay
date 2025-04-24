
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AssetLifecycleForecast } from '@/types/asset';

export interface MaintenanceForecastTableProps {
  forecasts: AssetLifecycleForecast[];
}

export const MaintenanceForecastTable: React.FC<MaintenanceForecastTableProps> = ({ forecasts }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead className="text-right">Replacements</TableHead>
            <TableHead className="text-right">Maintenance Costs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forecasts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">No forecast data available</TableCell>
            </TableRow>
          ) : (
            forecasts.map((forecast) => (
              <TableRow key={forecast.year}>
                <TableCell className="font-medium">{forecast.year}</TableCell>
                <TableCell className="text-right">{forecast.replacements}</TableCell>
                <TableCell className="text-right">{forecast.maintenanceCosts.toLocaleString()} OMR</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaintenanceForecastTable;
