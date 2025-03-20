
import React from 'react';
import { UpcomingMaintenance } from '@/types/alm';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface UpcomingMaintenanceTableProps {
  data: UpcomingMaintenance[];
}

const UpcomingMaintenanceTable: React.FC<UpcomingMaintenanceTableProps> = ({ data }) => {
  // Helper function to get appropriate color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  // Format date for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-sm">Task ID</TableHead>
            <TableHead className="text-sm">Asset Name</TableHead>
            <TableHead className="text-sm">Zone</TableHead>
            <TableHead className="text-sm">Scheduled Date</TableHead>
            <TableHead className="text-sm">Type</TableHead>
            <TableHead className="text-sm text-right">Estimated Cost (OMR)</TableHead>
            <TableHead className="text-sm">Duration (Days)</TableHead>
            <TableHead className="text-sm">Resource Requirements</TableHead>
            <TableHead className="text-sm">Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="text-sm font-medium">{task.id}</TableCell>
              <TableCell className="text-sm">{task.assetName}</TableCell>
              <TableCell className="text-sm">{task.zone}</TableCell>
              <TableCell className="text-sm">{formatDate(task.scheduledDate)}</TableCell>
              <TableCell className="text-sm">{task.maintenanceType}</TableCell>
              <TableCell className="text-sm text-right">{task.estimatedCost.toLocaleString()}</TableCell>
              <TableCell className="text-sm">{task.duration}</TableCell>
              <TableCell className="text-sm">{task.resourceRequirements}</TableCell>
              <TableCell>
                <span className={`text-xs inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UpcomingMaintenanceTable;
