
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AssetCondition } from '@/types/alm';

export interface AssetConditionsTableProps {
  data: AssetCondition[];
}

const AssetConditionsTable: React.FC<AssetConditionsTableProps> = ({ data = [] }) => {
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
    <div className="bg-white rounded-md shadow">
      <h3 className="text-lg font-medium p-4 border-b">Asset Conditions</h3>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm">ID</TableHead>
              <TableHead className="text-sm">Condition Rating</TableHead>
              <TableHead className="text-sm">Description</TableHead>
              <TableHead className="text-sm">Asset Count</TableHead>
              <TableHead className="text-sm">Percentage</TableHead>
              <TableHead className="text-sm">Recommended Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((condition) => (
                <TableRow key={condition.id}>
                  <TableCell className="text-sm font-medium">{condition.id}</TableCell>
                  <TableCell>
                    <span className={`text-xs inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${getConditionColor(condition.conditionRating)}`}>
                      {condition.conditionRating}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{condition.description}</TableCell>
                  <TableCell className="text-sm">{condition.assetCount}</TableCell>
                  <TableCell className="text-sm">{condition.percentage}%</TableCell>
                  <TableCell className="text-sm">{condition.recommendedAction}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No condition data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AssetConditionsTable;
