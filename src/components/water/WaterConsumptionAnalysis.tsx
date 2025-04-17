
import React, { useState } from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface WaterConsumptionAnalysisProps {
  consumptionData: any[];
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  formatNumber: (num: number) => string;
}

export const WaterConsumptionAnalysis: React.FC<WaterConsumptionAnalysisProps> = ({
  consumptionData,
  selectedZone,
  setSelectedZone,
  formatNumber
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('lastMonth');
  
  // Extract available zones from the data
  const availableZones = ['all', ...new Set(
    Object.keys(consumptionData[0] || {})
      .filter(key => key !== 'month' && key !== 'year' && key !== 'total')
  )];
  
  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <CardTitle className="text-xl">Consumption Analysis</CardTitle>
              <CardDescription>Analyze water consumption patterns across zones</CardDescription>
            </div>
            
            <div className="flex items-center space-x-3 mt-3 sm:mt-0">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary/10' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Select defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
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
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableZones.map(zone => (
                      <SelectItem key={zone} value={zone}>
                        {zone === 'all' ? 'All Zones' : zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meter Type</label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bulk">Bulk Supply</SelectItem>
                    <SelectItem value="zone">Bulk Zone</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consumption Range</label>
                <div className="flex items-center space-x-2">
                  <Input type="number" placeholder="Min" />
                  <span className="text-gray-500">—</span>
                  <Input type="number" placeholder="Max" />
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">m³</span>
                </div>
              </div>
              
              <div className="md:col-span-3 flex justify-end mt-2">
                <Button variant="outline" className="mr-3">
                  Reset
                </Button>
                <Button>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={consumptionData.slice(-4)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="right" orientation="right" stroke="#F97316" />
                <Tooltip formatter={(value, name) => [`${formatNumber(value)} m³`, name]} />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="total" 
                  name="Total Consumption" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]} 
                />
                {Object.keys(consumptionData[0] || {})
                  .filter(key => key !== 'month' && key !== 'year' && key !== 'total')
                  .filter(zone => selectedZone === 'all' || zone === selectedZone)
                  .map((zone, index) => {
                    const colors = ['#F97316', '#EAB308', '#10B981', '#6366F1', '#A855F7'];
                    return (
                      <Line 
                        key={zone}
                        yAxisId="right" 
                        type="monotone" 
                        dataKey={zone} 
                        name={zone} 
                        stroke={colors[index % colors.length]} 
                        strokeWidth={2}
                      />
                    );
                  })
                }
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Consumption by Zone (Current Month)</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption (m³)</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consumptionData.length > 0 && 
                    Object.keys(consumptionData[consumptionData.length - 1])
                      .filter(key => key !== 'month' && key !== 'year' && key !== 'total')
                      .filter(zone => selectedZone === 'all' || zone === selectedZone)
                      .map(zone => {
                        const zoneValue = consumptionData[consumptionData.length - 1][zone] || 0;
                        const totalValue = consumptionData[consumptionData.length - 1].total || 1;
                        const percentage = (zoneValue / totalValue * 100).toFixed(1);
                        
                        return (
                          <tr key={zone}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{zone}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(zoneValue)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{percentage}%</td>
                          </tr>
                        );
                      })
                  }
                  {consumptionData.length > 0 && (
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatNumber(consumptionData[consumptionData.length - 1].total || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">100.0%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Monthly Trend Analysis</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consumptionData.map((data, index) => {
                    // Calculate change from previous month
                    const previousValue = index > 0 ? consumptionData[index - 1].total : null;
                    const change = previousValue ? ((data.total - previousValue) / previousValue * 100).toFixed(1) : '-';
                    
                    return (
                      <tr key={`${data.month}-${data.year}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{data.month} {data.year}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(data.total)} m³</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${change !== '-' ? (parseFloat(change) >= 0 ? 'text-red-600' : 'text-green-600') : 'text-gray-500'}`}>
                          {change !== '-' ? (parseFloat(change) >= 0 ? `+${change}%` : `${change}%`) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800 text-sm">Analysis Insights</h5>
                <p className="mt-1 text-sm text-blue-700">
                  Consumption increased significantly in the last period, with seasonal usage patterns consistent with historical data. The highest consumption zone remains consistent month over month.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
