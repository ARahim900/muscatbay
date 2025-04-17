
import React from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  AlertTriangle, TrendingUp, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface WaterLossAnalysisProps {
  waterLossData: any[];
  formatNumber: (num: number) => string;
}

export const WaterLossAnalysis: React.FC<WaterLossAnalysisProps> = ({
  waterLossData,
  formatNumber
}) => {
  const latestData = waterLossData.length > 0 ? waterLossData[waterLossData.length - 1] : null;
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-50 mr-4">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Loss Rate</p>
                <h3 className="text-2xl font-bold text-gray-800">{latestData?.totalLossPercent.toFixed(1)}%</h3>
                <p className="text-xs text-red-600 mt-1">Above target threshold (45%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-50 mr-4">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Stage 1 Loss (Supply → Distribution)</p>
                <h3 className="text-2xl font-bold text-gray-800">{latestData?.stage1LossPercent.toFixed(1)}%</h3>
                <p className="text-xs text-orange-600 mt-1">Critical attention required</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-amber-50 mr-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Stage 2 Loss (Distribution → End-User)</p>
                <h3 className="text-2xl font-bold text-gray-800">{latestData?.stage2LossPercent.toFixed(1)}%</h3>
                <p className="text-xs text-amber-600 mt-1">Within acceptable range</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <CardTitle className="text-xl">Water Loss Trend Analysis</CardTitle>
              <CardDescription>Track and analyze water loss metrics over time</CardDescription>
            </div>
            
            <div className="flex items-center space-x-3 mt-3 sm:mt-0">
              <Select defaultValue="lastMonth">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="lastQuarter">Last Quarter</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={waterLossData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="right" orientation="right" stroke="#F97316" />
                <Tooltip formatter={(value: any, name: any) => {
                  if (typeof name === 'string' && name.includes('Percent')) return [`${Number(value).toFixed(1)}%`, name];
                  return [`${formatNumber(Number(value))} m³`, name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="totalSupply" name="Total Supply (m³)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="totalDistribution" name="Total Distribution (m³)" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="totalConsumption" name="Total Consumption (m³)" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="totalLossPercent" name="Total Loss (%)" stroke="#EF4444" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="stage1LossPercent" name="Stage 1 Loss (%)" stroke="#F97316" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="stage2LossPercent" name="Stage 2 Loss (%)" stroke="#EAB308" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Water Loss Breakdown</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stage 1 Loss</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stage 2 Loss</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Loss</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waterLossData.map((data) => (
                    <tr key={data.period}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{data.period}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatNumber(data.stage1Loss)} m³
                        <div className="text-xs text-orange-600">{data.stage1LossPercent.toFixed(1)}%</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatNumber(data.stage2Loss)} m³
                        <div className="text-xs text-amber-600">{data.stage2LossPercent.toFixed(1)}%</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatNumber(data.totalSupply - data.totalConsumption)} m³
                        <div className="text-xs text-red-600">{data.totalLossPercent.toFixed(1)}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Loss Analysis Insights</h4>
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <h5 className="text-red-800 font-medium text-sm flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" /> Critical Stage 1 Loss
                </h5>
                <p className="mt-1 text-sm text-red-700">
                  Stage 1 loss remains critically high, indicating potential major leaks or metering issues in the main supply infrastructure. Investigation required in:
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  <li>Main transmission lines between source and L2 meters</li>
                  <li>Bulk meter calibration at source (L1)</li>
                  <li>Possible unmeasured withdrawals</li>
                </ul>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-4 mb-4">
                <h5 className="text-amber-800 font-medium text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" /> Loss Trend Analysis
                </h5>
                <p className="mt-1 text-sm text-amber-700">
                  Total water loss has shown some improvement over the measured periods, but remains significantly above the industry standard target of 45%. Continued efforts needed to identify and address major sources of loss.
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-blue-800 font-medium text-sm flex items-center">
                  <Check className="h-4 w-4 mr-2" /> Recommended Actions
                </h5>
                <ul className="mt-1 text-sm text-blue-700 list-disc list-inside">
                  <li>Conduct complete leak detection survey in main transmission lines</li>
                  <li>Verify calibration of L1 and L2 meters</li>
                  <li>Implement pressure management in high-loss zones</li>
                  <li>Investigate potential unauthorized connections</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
