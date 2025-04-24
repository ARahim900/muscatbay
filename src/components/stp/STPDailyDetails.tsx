
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STPDailyRecord } from '@/types/stp';
import { fetchSTPDailyData, processData } from '@/services/stpService';
import { formatNumber } from '@/lib/utils';

export interface STPDailyDetailsProps {
  recordId?: string;
  date?: string;
  plantId?: string;
  selectedMonth?: string;
}

export const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ 
  recordId, 
  date, 
  plantId,
  selectedMonth 
}) => {
  const [record, setRecord] = React.useState<STPDailyRecord | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchSTPDailyData();
        let records = processData(data);
        
        // Filter by plant ID if provided
        if (plantId) {
          records = records.filter((r: STPDailyRecord) => r.plantId === plantId);
        }
        
        // Filter by date if provided
        if (date) {
          records = records.filter((r: STPDailyRecord) => r.date === date);
        }
        
        // Filter by record ID if provided
        if (recordId) {
          const foundRecord = records.find((r: STPDailyRecord) => r.id === recordId);
          if (foundRecord) {
            setRecord(foundRecord);
          } else {
            setError('Record not found');
          }
        } else if (records.length > 0) {
          // If no specific record is requested, use the first one
          setRecord(records[0]);
        } else {
          setError('No records found');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching STP record:', err);
        setError('Failed to load STP data');
        setLoading(false);
      }
    };
    
    fetchRecord();
  }, [recordId, date, plantId]);

  if (loading) {
    return <div>Loading STP data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!record) {
    return <div>No STP record found</div>;
  }

  return (
    <div className="space-y-6">
      {selectedMonth && <div className="text-sm text-muted-foreground">Month: {selectedMonth}</div>}
      
      <Card>
        <CardHeader>
          <CardTitle>STP Daily Record: {record.date}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Plant Information</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Plant ID</TableCell>
                    <TableCell>{record.plantId}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Plant Name</TableCell>
                    <TableCell>{record.plantName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Date</TableCell>
                    <TableCell>{record.date}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Flow Metrics</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Influent Flow</TableCell>
                    <TableCell>{formatNumber(record.influentFlow)} m³/day</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Effluent Flow</TableCell>
                    <TableCell>{formatNumber(record.effluentFlow)} m³/day</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Efficiency</TableCell>
                    <TableCell>
                      {formatNumber((record.effluentFlow / record.influentFlow) * 100, 1)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-2">Water Quality Parameters</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parameter</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total Suspended Solids (TSS)</TableCell>
                <TableCell>{formatNumber(record.totalSuspendedSolids, 1)}</TableCell>
                <TableCell>mg/L</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Biochemical Oxygen Demand (BOD)</TableCell>
                <TableCell>{formatNumber(record.biochemicalOxygenDemand, 1)}</TableCell>
                <TableCell>mg/L</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Chemical Oxygen Demand (COD)</TableCell>
                <TableCell>{formatNumber(record.chemicalOxygenDemand, 1)}</TableCell>
                <TableCell>mg/L</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>pH</TableCell>
                <TableCell>{formatNumber(record.pH, 1)}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Dissolved Oxygen (DO)</TableCell>
                <TableCell>{formatNumber(record.dissolvedOxygen, 1)}</TableCell>
                <TableCell>mg/L</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Temperature</TableCell>
                <TableCell>{formatNumber(record.temperature, 1)}</TableCell>
                <TableCell>°C</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          {record.remarks && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Remarks</h3>
              <p className="text-sm text-muted-foreground">{record.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default STPDailyDetails;
