
import React from 'react';
import { CriticalAsset } from '@/types/alm';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface CriticalAssetsTableProps {
  data: CriticalAsset[];
}

const CriticalAssetsTable: React.FC<CriticalAssetsTableProps> = ({ data }) => {
  // Helper function to get appropriate color based on criticality
  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'High':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'Medium':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400';
      case 'Low':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-sm">ID</TableHead>
            <TableHead className="text-sm">Asset Name</TableHead>
            <TableHead className="text-sm">Location</TableHead>
            <TableHead className="text-sm">Criticality</TableHead>
            <TableHead className="text-sm">Risk Score</TableHead>
            <TableHead className="text-sm">Last Inspection</TableHead>
            <TableHead className="text-sm">Next Inspection</TableHead>
            <TableHead className="text-sm text-right">Replacement Value (OMR)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="text-sm font-medium">{asset.id}</TableCell>
              <TableCell className="text-sm">{asset.assetName}</TableCell>
              <TableCell className="text-sm">{asset.location}</TableCell>
              <TableCell>
                <span className={`text-xs inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${getCriticalityColor(asset.criticality)}`}>
                  {asset.criticality}
                </span>
              </TableCell>
              <TableCell className="text-sm">{asset.riskScore}</TableCell>
              <TableCell className="text-sm">{asset.lastInspectionDate}</TableCell>
              <TableCell className="text-sm">{asset.nextInspectionDate}</TableCell>
              <TableCell className="text-sm text-right">{asset.replacementValue.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CriticalAssetsTable;
