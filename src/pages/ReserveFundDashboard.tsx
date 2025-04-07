
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Building, Landmark, BarChart2, PieChart as PieChartIcon,
  Calendar, Download, Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Sample data
const sampleData = [
  { name: 'Zone 1', value: 400 },
  { name: 'Zone 2', value: 300 },
  { name: 'Zone 3', value: 300 },
  { name: 'Zone 4', value: 200 }
];

const monthlyData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ReserveFundDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState('2025');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reserve Fund Dashboard</h1>
          <p className="text-gray-600">Manage and monitor reserve fund allocations and expenditures</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Reserve Fund</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,450,000 OMR</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +5.2% from last year
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Annual Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">540,000 OMR</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +2.8% from last year
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <Building className="h-3 w-3 mr-1" /> Across 4 zones
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fund Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Excellent</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <Calendar className="h-3 w-3 mr-1" /> Last updated April 3, 2025
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reserve Fund Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zone Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sampleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {sampleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="zones">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Zone Analysis</h3>
              <p>Zone content will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="properties">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Property Analysis</h3>
              <p>Properties content will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projections">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Future Projections</h3>
              <p>Projections content will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReserveFundDashboard;
