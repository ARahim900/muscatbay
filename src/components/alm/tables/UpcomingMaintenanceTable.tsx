
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssetMaintenance } from '@/types/asset';
import { formatNumber } from '@/lib/utils';

export interface UpcomingMaintenanceTableProps {
  maintenance: AssetMaintenance[];
}

export const UpcomingMaintenanceTable: React.FC<UpcomingMaintenanceTableProps> = ({ maintenance }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead>Maintenance Type</TableHead>
          <TableHead>Scheduled Date</TableHead>
          <TableHead className="text-right">Estimated Cost</TableHead>
          <TableHead>Priority</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {maintenance.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.assetName}</TableCell>
            <TableCell>{item.maintenanceType}</TableCell>
            <TableCell>{item.scheduledDate}</TableCell>
            <TableCell className="text-right">{formatNumber(item.estimatedCost)} OMR</TableCell>
            <TableCell>{item.priority}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UpcomingMaintenanceTable;
