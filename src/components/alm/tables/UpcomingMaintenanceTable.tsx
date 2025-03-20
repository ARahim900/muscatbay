
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task ID</TableHead>
            <TableHead>Asset Name</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Estimated Cost (OMR)</TableHead>
            <TableHead>Duration (Days)</TableHead>
            <TableHead>Resource Requirements</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.id}</TableCell>
              <TableCell>{task.assetName}</TableCell>
              <TableCell>{task.zone}</TableCell>
              <TableCell>{formatDate(task.scheduledDate)}</TableCell>
              <TableCell>{task.maintenanceType}</TableCell>
              <TableCell className="text-right">{task.estimatedCost.toLocaleString()}</TableCell>
              <TableCell>{task.duration}</TableCell>
              <TableCell>{task.resourceRequirements}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
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
