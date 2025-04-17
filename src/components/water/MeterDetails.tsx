
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Droplet, Settings, Clock, AlertTriangle, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MeterDetailsProps {
  meter: any;
  formatNumber: (num: number) => string;
  goBack: () => void;
}

export const MeterDetails: React.FC<MeterDetailsProps> = ({
  meter,
  formatNumber,
  goBack
}) => {
  if (!meter) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="py-12">
            <h3 className="text-lg font-medium text-gray-900">Meter details not found</h3>
            <p className="mt-2 text-sm text-gray-500">The selected meter information could not be retrieved.</p>
            <Button onClick={goBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Meters
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Mock reading history data for visualization
  const readingHistory = [
    { month: 'Jan', reading: 32 },
    { month: 'Feb', reading: 48 },
    { month: 'Mar', reading: 51 },
    { month: 'Apr', reading: 47 },
    { month: 'May', reading: 63 },
    { month: 'Jun', reading: 59 },
  ];
  
  return (
    <>
      <div className="mb-6">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{meter.meter_label}</CardTitle>
              <CardDescription>Meter Details</CardDescription>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block">Account Number</label>
                  <div className="mt-1 text-sm font-medium">{meter.account_number}</div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 block">Zone</label>
                  <div className="mt-1 text-sm">{meter.zone || 'Not assigned'}</div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 block">Meter Type</label>
                  <div className="mt-1 text-sm">{meter.type}</div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 block">Level</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={`
                      ${meter.level === 'L1' ? 'bg-purple-50 text-purple-700' : ''}
                      ${meter.level === 'L2' ? 'bg-blue-50 text-blue-700' : ''}
                      ${meter.level === 'L3' ? 'bg-green-50 text-green-700' : ''}
                      ${meter.level === 'DC' ? 'bg-amber-50 text-amber-700' : ''}
                    `}>
                      {meter.level}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 block">Parent Meter</label>
                  <div className="mt-1 text-sm">{meter.parent_meter || 'None'}</div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 block">Status</label>
                  <div className="mt-1">
                    <Badge className="bg-green-100 text-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="text-sm flex-1 justify-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="default" size="sm" className="text-sm flex-1 justify-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Log Reading
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Technical Specifications</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Meter Model</span>
                  <span className="text-sm font-medium">FlowMaster X300</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Manufacturer</span>
                  <span className="text-sm font-medium">WaterTech Solutions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Installation Date</span>
                  <span className="text-sm font-medium">June 15, 2022</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Calibration</span>
                  <span className="text-sm font-medium">January 10, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Calibration Due</span>
                  <span className="text-sm font-medium">January 10, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Reading Method</span>
                  <span className="text-sm font-medium">Manual</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Measurement Unit</span>
                  <span className="text-sm font-medium">Cubic Meters (m³)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Reading History</CardTitle>
              <CardDescription>Monthly consumption readings and trend analysis</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={readingHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} m³`, 'Reading']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #E2E8F0'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="reading" 
                      name="Reading" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      activeDot={{ r: 8, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }}
                      dot={{ r: 4, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reading (m³)</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption (m³)</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Read By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {readingHistory.map((reading, index) => {
                      const previousReading = index > 0 ? readingHistory[index - 1].reading : 0;
                      const consumption = reading.reading - previousReading;
                      
                      return (
                        <tr key={reading.month}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{reading.month} 15, 2024</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">{reading.reading}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            {index === 0 ? '—' : consumption}
                            {consumption > 15 && index > 0 && (
                              <span className="ml-2 text-red-500">
                                <AlertTriangle className="h-4 w-4 inline-block" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <Badge variant="outline" className="bg-green-50 text-green-600">
                              Verified
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">John Operator</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800 text-sm">Reading Insights</h5>
                <p className="mt-1 text-sm text-blue-700">
                  This meter shows regular consumption patterns with a notable spike in May. The average monthly consumption is 10.5 m³, which is within normal range for this meter type and zone.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Maintenance History</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-green-50 text-green-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">Calibration Check</p>
                      <span className="text-xs text-gray-500">Jan 10, 2024</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Regular calibration check. Meter reading accuracy confirmed at ±1.5%.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">Preventive Maintenance</p>
                      <span className="text-xs text-gray-500">Jul 5, 2023</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Check for leaks, clearance of debris, valve inspection. All components in good condition.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">Issue Resolution</p>
                      <span className="text-xs text-gray-500">Mar 18, 2023</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Fixed minor leak at connection point. Replaced gasket and tightened fittings.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
