
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface MaintenanceTask {
  id: string;
  assetName: string;
  location: string;
  scheduledDate: string;
  taskType: string;
  assignedTo: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
}

interface AssetMaintenanceScheduleProps {
  tasks: MaintenanceTask[];
}

const AssetMaintenanceSchedule: React.FC<AssetMaintenanceScheduleProps> = ({ tasks }) => {
  const getStatusBadge = (status: MaintenanceTask['status']) => {
    switch(status) {
      case 'Scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'In Progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'Overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Maintenance Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.assetName}</TableCell>
                <TableCell>{task.location}</TableCell>
                <TableCell>{task.scheduledDate}</TableCell>
                <TableCell>{task.taskType}</TableCell>
                <TableCell>{task.assignedTo}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AssetMaintenanceSchedule;
