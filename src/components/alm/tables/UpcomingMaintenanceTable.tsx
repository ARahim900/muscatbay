
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AssetMaintenance } from '@/types/asset';
import { format, differenceInDays } from 'date-fns';

export interface UpcomingMaintenanceTableProps {
  maintenance: AssetMaintenance[];
}

export const UpcomingMaintenanceTable: React.FC<UpcomingMaintenanceTableProps> = ({ maintenance }) => {
  // Sort maintenance by date, upcoming first
  const sortedMaintenance = [...maintenance].sort((a, b) => 
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  const getPriorityColor = (priority: 'Low' | 'Medium' | 'High' | 'Critical'): string => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-amber-100 text-amber-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysToMaintenance = (date: string): number => {
    return differenceInDays(new Date(date), new Date());
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Scheduled Date</TableHead>
            <TableHead className="text-right">Est. Cost</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMaintenance.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No scheduled maintenance</TableCell>
            </TableRow>
          ) : (
            sortedMaintenance.map((item) => {
              const daysToMaintenance = getDaysToMaintenance(item.scheduledDate);
              
              return (
                <TableRow key={item.id} className={daysToMaintenance <= 7 ? "bg-amber-50" : ""}>
                  <TableCell className="font-medium">{item.assetName}</TableCell>
                  <TableCell>{item.maintenanceType}</TableCell>
                  <TableCell className="text-right">
                    {format(new Date(item.scheduledDate), 'MMM dd, yyyy')}
                    <div className="text-xs text-gray-500">
                      {daysToMaintenance === 0 ? 'Today' : 
                       daysToMaintenance < 0 ? `${Math.abs(daysToMaintenance)} days ago` :
                       `in ${daysToMaintenance} days`}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.estimatedCost.toLocaleString()} OMR</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UpcomingMaintenanceTable;
