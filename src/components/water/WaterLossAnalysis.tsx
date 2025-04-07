
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ZoneMetrics, LevelMetrics, WaterConsumptionData } from '@/types/waterSystem';

interface WaterLossAnalysisProps {
  zoneMetrics: ZoneMetrics[];
  levelMetrics: LevelMetrics;
  selectedMonth: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#66BCFE'];

const WaterLossAnalysis: React.FC<WaterLossAnalysisProps> = ({
  zoneMetrics,
  levelMetrics,
  selectedMonth
}) => {
  // Prepare data for loss breakdown pie chart
  const lossBreakdownData = [
    { name: 'Stage 1 Loss', value: levelMetrics.stage1Loss },
    { name: 'Stage 2 Loss', value: levelMetrics.stage2Loss }
  ];
  
  // Create data for the level comparison
  const levelComparisonData = [
    { name: 'L1 Supply', value: levelMetrics.l1Supply, fill: '#0088FE' },
    { name: 'L2 Volume', value: levelMetrics.l2Volume, fill: '#00C49F' },
    { name: 'L3 Consumption', value: levelMetrics.l3Volume, fill: '#FFBB28' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stage Loss Analysis</CardTitle>
            <CardDescription>
              Distribution of water loss by stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={levelComparisonData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} m³`, 'Volume']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Volume (m³)" 
                    radius={[4, 4, 0, 0]}
                    fill="#0088FE"
                  >
                    {levelComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Stage 1 Loss</h3>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-blue-700">Volume:</span>
                  <span className="text-sm font-medium">{levelMetrics.stage1Loss.toLocaleString()} m³</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-blue-700">Percentage:</span>
                  <span className="text-sm font-medium">{levelMetrics.stage1LossPercentage.toFixed(1)}% of L1</span>
                </div>
                <div className="mt-3 text-xs text-blue-700">
                  <p>Stage 1 loss occurs between the main supply (L1) and zone distribution points (L2).</p>
                </div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h3 className="text-lg font-medium text-amber-800 mb-2">Stage 2 Loss</h3>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-amber-700">Volume:</span>
                  <span className="text-sm font-medium">{levelMetrics.stage2Loss.toLocaleString()} m³</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-amber-700">Percentage:</span>
                  <span className="text-sm font-medium">{levelMetrics.stage2LossPercentage.toFixed(1)}% of L2</span>
                </div>
                <div className="mt-3 text-xs text-amber-700">
                  <p>Stage 2 loss occurs between zone distribution points (L2) and end user meters (L3).</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Loss Distribution</CardTitle>
            <CardDescription>
              Proportional breakdown of water losses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lossBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    <Cell fill="#0088FE" />
                    <Cell fill="#00C49F" />
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} m³`, 'Loss Volume']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 bg-red-50 p-4 rounded-lg border border-red-100">
              <h3 className="text-lg font-medium text-red-800 mb-2">Total System Loss</h3>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-red-700">Volume:</span>
                <span className="text-sm font-medium">{levelMetrics.totalLoss.toLocaleString()} m³</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-red-700">Percentage:</span>
                <span className="text-sm font-medium">{levelMetrics.totalLossPercentage.toFixed(1)}% of L1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Zone Loss Breakdown</CardTitle>
          <CardDescription>
            Detailed analysis of losses by zone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted text-left text-muted-foreground text-xs">
                  <th className="p-2 whitespace-nowrap">Zone</th>
                  <th className="p-2 whitespace-nowrap text-right">Bulk Supply (m³)</th>
                  <th className="p-2 whitespace-nowrap text-right">Individual Meters (m³)</th>
                  <th className="p-2 whitespace-nowrap text-right">Loss Volume (m³)</th>
                  <th className="p-2 whitespace-nowrap text-right">Loss Percentage</th>
                  <th className="p-2 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {zoneMetrics.map((zone, index) => (
                  <tr 
                    key={index}
                    className="border-b border-gray-200 hover:bg-muted/50"
                  >
                    <td className="p-2 whitespace-nowrap font-medium">{zone.zone}</td>
                    <td className="p-2 whitespace-nowrap text-right">{zone.bulkSupply.toLocaleString()}</td>
                    <td className="p-2 whitespace-nowrap text-right">{zone.individualMeters.toLocaleString()}</td>
                    <td className="p-2 whitespace-nowrap text-right">{zone.loss.toLocaleString()}</td>
                    <td className="p-2 whitespace-nowrap text-right font-medium">{zone.lossPercentage.toFixed(1)}%</td>
                    <td className="p-2 whitespace-nowrap">
                      <Badge 
                        className={
                          zone.lossPercentage > 20 ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                          zone.lossPercentage > 10 ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                          'bg-green-100 text-green-800 hover:bg-green-200'
                        }
                      >
                        {zone.lossPercentage > 20 ? 'Critical' :
                         zone.lossPercentage > 10 ? 'Warning' :
                         'Good'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            <h3 className="font-medium mb-2">Understanding Zone Loss</h3>
            <p>Zones with loss percentages above 20% should be prioritized for investigation. Potential causes include:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Leaking pipes within the zone</li>
              <li>Malfunctioning meters</li>
              <li>Unauthorized connections</li>
              <li>Data recording issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterLossAnalysis;
