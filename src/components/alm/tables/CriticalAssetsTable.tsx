
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Asset } from '@/types/asset';

interface CriticalAssetsTableProps {
  assets: Asset[];
}

const CriticalAssetsTable: React.FC<CriticalAssetsTableProps> = ({ assets }) => {
  // Filter and sort assets by criticality level
  const criticalAssets = assets
    .filter(asset => asset.criticalityLevel === 'High' || asset.criticalityLevel === 'Critical')
    .sort((a, b) => {
      // Sort by criticality level first (Critical > High)
      const criticalityOrder: Record<string, number> = { 'Critical': 0, 'High': 1 };
      return criticalityOrder[a.criticalityLevel] - criticalityOrder[b.criticalityLevel];
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Critical Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Criticality</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Value (OMR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criticalAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell>{asset.category}</TableCell>
                <TableCell className={asset.criticalityLevel === 'Critical' ? 'text-red-500 font-medium' : 'text-orange-500'}>
                  {asset.criticalityLevel}
                </TableCell>
                <TableCell>{asset.condition}</TableCell>
                <TableCell>{asset.value.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {criticalAssets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No critical assets found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CriticalAssetsTable;
