
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STPDailyRecord } from '@/types/stp';

interface STPDailyDetailsProps {
  record: STPDailyRecord;
}

const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ record }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>STP Daily Details - {record.plantName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parameter</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Influent Flow</TableCell>
              <TableCell>{record.influentFlow} m³</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Effluent Flow</TableCell>
              <TableCell>{record.effluentFlow} m³</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Total Suspended Solids</TableCell>
              <TableCell>{record.totalSuspendedSolids} mg/L</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>BOD</TableCell>
              <TableCell>{record.biochemicalOxygenDemand} mg/L</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>COD</TableCell>
              <TableCell>{record.chemicalOxygenDemand} mg/L</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>pH</TableCell>
              <TableCell>{record.pH}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Dissolved Oxygen</TableCell>
              <TableCell>{record.dissolvedOxygen} mg/L</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Temperature</TableCell>
              <TableCell>{record.temperature} °C</TableCell>
            </TableRow>
            {record.remarks && (
              <TableRow>
                <TableCell>Remarks</TableCell>
                <TableCell>{record.remarks}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default STPDailyDetails;
