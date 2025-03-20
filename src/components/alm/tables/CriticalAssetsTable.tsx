
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset ID</TableHead>
            <TableHead>Asset Name</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead className="text-right">Replacement Cost (OMR)</TableHead>
            <TableHead>Criticality</TableHead>
            <TableHead>Failure Impact</TableHead>
            <TableHead>Recommended Action</TableHead>
            <TableHead>Target Completion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.id}</TableCell>
              <TableCell>{asset.assetName}</TableCell>
              <TableCell>{asset.zone}</TableCell>
              <TableCell className={getConditionColor(asset.currentCondition)}>
                {asset.currentCondition}
              </TableCell>
              <TableCell className="text-right">{asset.replacementCost.toLocaleString()}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(asset.criticalityRating)}`}>
                  {asset.criticalityRating === 5 && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {asset.criticalityRating}
                </span>
              </TableCell>
              <TableCell>{asset.failureImpact}</TableCell>
              <TableCell>{asset.recommendedAction}</TableCell>
              <TableCell>{asset.targetCompletion}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CriticalAssetsTable;
