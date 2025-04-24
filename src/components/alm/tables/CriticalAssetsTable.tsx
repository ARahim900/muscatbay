
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Asset } from '@/types/asset';

interface CriticalAssetsTableProps {
  assets: Asset[];
}

const CriticalAssetsTable: React.FC<CriticalAssetsTableProps> = ({ assets }) => {
  // Filter for critical assets (you might have different criteria)
  const criticalAssets = assets.filter(asset => 
    asset.condition === 'Poor' || 
    (asset.maintenanceStatus === 'Overdue')
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Maintenance Status</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {criticalAssets.length > 0 ? (
            criticalAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    asset.condition === 'Poor' ? 'bg-red-100 text-red-800' : 
                    asset.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {asset.condition}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    asset.maintenanceStatus === 'Overdue' ? 'bg-red-100 text-red-800' : 
                    asset.maintenanceStatus === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {asset.maintenanceStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    asset.priority === 'High' ? 'bg-red-100 text-red-800' : 
                    asset.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {asset.priority}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">No critical assets found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CriticalAssetsTable;
