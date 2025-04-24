
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Asset } from '@/types/asset';
import { formatNumber } from '@/lib/utils';

export interface CriticalAssetsTableProps {
  assets: Asset[];
}

export const CriticalAssetsTable: React.FC<CriticalAssetsTableProps> = ({ assets }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset Name</TableHead>
          <TableHead>Criticality</TableHead>
          <TableHead>Condition</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead>Next Maintenance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell>{asset.criticality}</TableCell>
            <TableCell>{asset.condition}</TableCell>
            <TableCell className="text-right">{formatNumber(asset.value)} OMR</TableCell>
            <TableCell>{asset.nextMaintenanceDate}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CriticalAssetsTable;
