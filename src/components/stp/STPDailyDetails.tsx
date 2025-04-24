
import React from 'react';

interface STPRecord {
  id: string;
  date: string;
  plantId: string;
  plantName: string;
  influentFlow: number;
  effluentFlow: number;
  totalSuspendedSolids: number;
  biochemicalOxygenDemand: number;
  chemicalOxygenDemand: number;
  pH: number;
  dissolvedOxygen: number;
  temperature: number;
  remarks?: string;
}

interface STPDailyDetailsProps {
  record: STPRecord;
}

export const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ record }) => {
  if (!record) {
    return <div>No data available</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-medium text-lg mb-2">Plant Information</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-500">Plant ID</div>
          <div>{record.plantId}</div>
          <div className="text-sm text-gray-500">Plant Name</div>
          <div>{record.plantName}</div>
          <div className="text-sm text-gray-500">Date</div>
          <div>{new Date(record.date).toLocaleDateString()}</div>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium text-lg mb-2">Flow Measurements</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-500">Influent Flow</div>
          <div>{record.influentFlow} m³/day</div>
          <div className="text-sm text-gray-500">Effluent Flow</div>
          <div>{record.effluentFlow} m³/day</div>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium text-lg mb-2">Water Parameters</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-500">TSS</div>
          <div>{record.totalSuspendedSolids} mg/L</div>
          <div className="text-sm text-gray-500">BOD</div>
          <div>{record.biochemicalOxygenDemand} mg/L</div>
          <div className="text-sm text-gray-500">COD</div>
          <div>{record.chemicalOxygenDemand} mg/L</div>
          <div className="text-sm text-gray-500">pH</div>
          <div>{record.pH}</div>
          <div className="text-sm text-gray-500">Dissolved Oxygen</div>
          <div>{record.dissolvedOxygen} mg/L</div>
          <div className="text-sm text-gray-500">Temperature</div>
          <div>{record.temperature} °C</div>
        </div>
      </div>
      
      {record.remarks && (
        <div>
          <h3 className="font-medium text-lg mb-2">Remarks</h3>
          <div className="border p-2 rounded">{record.remarks}</div>
        </div>
      )}
    </div>
  );
};
