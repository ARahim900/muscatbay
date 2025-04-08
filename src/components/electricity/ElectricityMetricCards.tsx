
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, CircleDollarSign, BarChart2, TrendingUp } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/utils/electricityDataUtils';
import { ElectricityDataSummary } from '@/types/electricity';

interface ElectricityMetricCardsProps {
  data: ElectricityDataSummary;
}

const ElectricityMetricCards: React.FC<ElectricityMetricCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Total Consumption</p>
              <h3 className="text-2xl font-bold">{formatNumber(data.totalConsumption)} kWh</h3>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                {formatCurrency(data.totalCost)} OMR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400">Average Consumption</p>
              <h3 className="text-2xl font-bold">{formatNumber(data.averageConsumption)} kWh</h3>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                {formatCurrency(data.averageConsumption * 0.025)} OMR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Electricity Rate</p>
              <h3 className="text-2xl font-bold">0.025 OMR</h3>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                per kWh
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Highest Consumer</p>
              <h3 className="text-lg font-bold">{data.maxConsumer}</h3>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                {formatNumber(data.maxConsumption)} kWh
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityMetricCards;
