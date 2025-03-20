
import React from 'react';
import { AssetCondition } from '@/types/alm';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface AssetConditionsTableProps {
  data: AssetCondition[];
}

const AssetConditionsTable: React.FC<AssetConditionsTableProps> = ({ data }) => {
  // Helper function to get appropriate color based on condition
  const getConditionColor = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'Good':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Fair':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400';
      case 'Poor':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Condition Rating</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Asset Count</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Recommended Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((condition) => (
            <TableRow key={condition.id}>
              <TableCell className="font-medium">{condition.id}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(condition.conditionRating)}`}>
                  {condition.conditionRating}
                </span>
              </TableCell>
              <TableCell>{condition.description}</TableCell>
              <TableCell>{condition.assetCount}</TableCell>
              <TableCell>{condition.percentage}%</TableCell>
              <TableCell>{condition.recommendedAction}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetConditionsTable;
