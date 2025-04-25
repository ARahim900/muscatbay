
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AssetStatus = {
  total: number;
  operational: number;
  maintenance: number;
  critical: number;
};

interface AssetStatusCardProps {
  status: AssetStatus;
}

const AssetStatusCard: React.FC<AssetStatusCardProps> = ({ status }) => {
  const operationalPercentage = Math.round((status.operational / status.total) * 100);
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Asset Status
          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
            Total: {status.total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Operational</span>
            <div className="flex items-center">
              <span className="font-semibold mr-2">{status.operational}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                {operationalPercentage}%
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">In Maintenance</span>
            <div className="flex items-center">
              <span className="font-semibold mr-2">{status.maintenance}</span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                {Math.round((status.maintenance / status.total) * 100)}%
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Critical Issues</span>
            <div className="flex items-center">
              <span className="font-semibold mr-2">{status.critical}</span>
              <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
                {Math.round((status.critical / status.total) * 100)}%
              </Badge>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${operationalPercentage}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetStatusCard;
