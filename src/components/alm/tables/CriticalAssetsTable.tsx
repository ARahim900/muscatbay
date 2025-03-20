
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
import { AlertTriangle } from 'lucide-react';

interface CriticalAssetsTableProps {
  data: CriticalAsset[];
}

const CriticalAssetsTable: React.FC<CriticalAssetsTableProps> = ({ data }) => {
  // Helper function to get appropriate color based on criticality
  const getCriticalityColor = (rating: number) => {
    switch (rating) {
      case 5:
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 4:
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 3:
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400';
      case 2:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 1:
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Helper function to get appropriate color based on condition
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return 'text-green-600';
      case 'Good':
        return 'text-blue-600';
      case 'Fair':
        return 'text-amber-600';
      case 'Poor':
        return 'text-orange-600';
      case 'Critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-sm">Asset ID</TableHead>
            <TableHead className="text-sm">Asset Name</TableHead>
            <TableHead className="text-sm">Zone</TableHead>
            <TableHead className="text-sm">Condition</TableHead>
            <TableHead className="text-sm text-right">Replacement Cost (OMR)</TableHead>
            <TableHead className="text-sm">Criticality</TableHead>
            <TableHead className="text-sm">Failure Impact</TableHead>
            <TableHead className="text-sm">Recommended Action</TableHead>
            <TableHead className="text-sm">Target Completion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="text-sm font-medium">{asset.id}</TableCell>
              <TableCell className="text-sm">{asset.assetName}</TableCell>
              <TableCell className="text-sm">{asset.zone}</TableCell>
              <TableCell className={`text-sm ${getConditionColor(asset.currentCondition)}`}>
                {asset.currentCondition}
              </TableCell>
              <TableCell className="text-sm text-right">{asset.replacementCost.toLocaleString()}</TableCell>
              <TableCell>
                <span className={`text-xs inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${getCriticalityColor(asset.criticalityRating)}`}>
                  {asset.criticalityRating === 5 && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {asset.criticalityRating}
                </span>
              </TableCell>
              <TableCell className="text-sm">{asset.failureImpact}</TableCell>
              <TableCell className="text-sm">{asset.recommendedAction}</TableCell>
              <TableCell className="text-sm">{asset.targetCompletion}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CriticalAssetsTable;
