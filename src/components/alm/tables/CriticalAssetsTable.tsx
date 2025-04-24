
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Asset } from '@/types/asset';
import { format } from 'date-fns';

export interface CriticalAssetsTableProps {
  assets: Asset[];
}

export const CriticalAssetsTable: React.FC<CriticalAssetsTableProps> = ({ assets }) => {
  // Filter to only show critical assets
  const criticalAssets = assets.filter(asset => 
    asset.criticality === 'High' || asset.criticality === 'Critical'
  ).sort((a, b) => a.nextMaintenanceDate.localeCompare(b.nextMaintenanceDate));

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Next Maintenance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {criticalAssets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No critical assets found</TableCell>
            </TableRow>
          ) : (
            criticalAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>{asset.category}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    asset.condition === 'Good' ? 'bg-green-100 text-green-800' :
                    asset.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {asset.condition}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(asset.nextMaintenanceDate), 'MMM dd, yyyy')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CriticalAssetsTable;
