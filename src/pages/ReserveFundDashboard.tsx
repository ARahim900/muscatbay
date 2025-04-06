
import React, { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
} from 'recharts';
import { 
  TrendingUp, Wallet, PiggyBank, BarChart2, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Download, Calendar, Building
} from 'lucide-react';

const ReserveFundDashboard = () => {
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const currentYear = new Date().getFullYear();

  // Sample Reserve Fund Data
  const reserveFundData = useMemo(() => [
    { year: "2022", collected: 481310, spent: 346200, allocated: 520000, balance: 135110 },
    { year: "2023", collected: 552750, spent: 398120, allocated: 580000, balance: 154630 },
    { year: "2024", collected: 648340, spent: 485900, allocated: 670000, balance: 162440 },
    { year: "2025", collected: 731200, spent: 512500, allocated: 750000, balance: 218700 },
  ], []);
  
  // Projected Reserve Fund Data
  const projectedData = useMemo(() => [
    { year: "2025", amount: 218700 },
    { year: "2026", amount: 328050 },
    { year: "2027", amount: 458470 },
    { year: "2028", amount: 607980 },
    { year: "2029", amount: 778650 },
    { year: "2030", amount: 970120 }
  ], []);
  
  // Asset Categories Data
  const assetCategoriesData = useMemo(() => [
    { name: "Building Envelope", value: 35 },
    { name: "Mechanical Systems", value: 25 },
    { name: "Electrical Systems", value: 15 },
    { name: "Common Areas", value: 12 },
    { name: "Landscaping", value: 8 },
    { name: "Other", value: 5 }
  ], []);
  
  // Monthly Contribution Data
  const monthlyContributionData = useMemo(() => [
    { month: "Jan", amount: 62500 },
    { month: "Feb", amount: 62500 },
    { month: "Mar", amount: 62500 },
    { month: "Apr", amount: 62500 },
    { month: "May", amount: 62500 },
    { month: "Jun", amount: 62500 },
    { month: "Jul", amount: 62500 },
    { month: "Aug", amount: 62500 },
    { month: "Sep", amount: 62500 },
    { month: "Oct", amount: 62500 },
    { month: "Nov", amount: 62500 },
    { month: "Dec", amount: 62500 }
  ], []);
  
  // Monthly Expenditure Data
  const monthlyExpenditureData = useMemo(() => [
    { month: "Jan", amount: 42300 },
    { month: "Feb", amount: 38650 },
    { month: "Mar", amount: 47220 },
    { month: "Apr", amount: 52940 },
    { month: "May", amount: 31250 },
    { month: "Jun", amount: 44320 },
    { month: "Jul", amount: 48750 },
    { month: "Aug", amount: 55300 },
    { month: "Sep", amount: 61200 },
    { month: "Oct", amount: 35670 },
    { month: "Nov", amount: 29580 },
    { month: "Dec", amount: 25320 }
  ], []);
  
  // Expenditure Categories Data
  const expenditureCategoriesData = useMemo(() => [
    { name: "Maintenance", value: 203500 },
    { name: "Replacements", value: 168300 },
    { name: "Upgrades", value: 115200 },
    { name: "Emergency Repairs", value: 25500 }
  ], []);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Get filtered data based on selected year
  const filteredData = useMemo(() => 
    reserveFundData.find(item => item.year === selectedYear) || reserveFundData[3], 
  [reserveFundData, selectedYear]);
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-muscat-primary flex items-center">
              <PiggyBank className="mr-2 h-6 w-6" />
              Reserve Fund Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Comprehensive overview of the reserve fund status and projections</p>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0 space-x-2">
            <div className="flex items-center">
              <Select 
                value={selectedYear} 
                onValueChange={setSelectedYear}
              >
                <SelectTrigger className="w-[120px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {reserveFundData.map(item => (
                    <SelectItem key={item.year} value={item.year}>
                      {item.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Collection</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.collected.toLocaleString()} OMR</div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((filteredData.collected / filteredData.allocated) * 100)}% of allocation
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Expenditure</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.spent.toLocaleString()} OMR</div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((filteredData.spent / filteredData.collected) * 100)}% of collections
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.balance.toLocaleString()} OMR</div>
              <p className="text-xs text-muted-foreground mt-1">
                As of end of {selectedYear}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funding Level</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((filteredData.balance / (filteredData.allocated * 5)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on 5-year target
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="projections">Projections</TabsTrigger>
            </TabsList>
            
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                Showing: {selectedTab === "overview" ? "Fund Overview" : 
                  selectedTab === "analysis" ? "Detailed Analysis" : "Future Projections"}
              </Badge>
            </div>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Historical Performance</CardTitle>
                        <CardDescription>Reserve fund trend over years</CardDescription>
                      </div>
                      <LineChartIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={reserveFundData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, ""]} />
                        <Legend />
                        <Line type="monotone" dataKey="collected" name="Collected" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="spent" name="Spent" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="balance" name="Balance" stroke="#ffc658" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Expenditure Categories</CardTitle>
                        <CardDescription>Breakdown by category in {selectedYear}</CardDescription>
                      </div>
                      <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={expenditureCategoriesData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {expenditureCategoriesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Monthly Contributions</CardTitle>
                        <CardDescription>Contribution trend for {selectedYear}</CardDescription>
                      </div>
                      <BarChart2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={monthlyContributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, ""]} />
                        <Legend />
                        <Bar dataKey="amount" name="Contribution" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Monthly Expenditures</CardTitle>
                        <CardDescription>Expenditure trend for {selectedYear}</CardDescription>
                      </div>
                      <BarChart2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={monthlyExpenditureData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, ""]} />
                        <Legend />
                        <Bar dataKey="amount" name="Expenditure" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Asset Category Allocation</CardTitle>
                        <CardDescription>Reserve fund allocation by asset category</CardDescription>
                      </div>
                      <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={assetCategoriesData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {assetCategoriesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="projections" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>5-Year Reserve Fund Projection</CardTitle>
                        <CardDescription>Estimated reserve fund balance for next 5 years</CardDescription>
                      </div>
                      <LineChartIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={projectedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, ""]} />
                        <Legend />
                        <Bar dataKey="amount" name="Projected Balance" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Projections are based on historical trends and planned maintenance schedules
                    </div>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Funding Level Assessment</CardTitle>
                    <CardDescription>
                      Current funding status against industry benchmarks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Current Funding Level</span>
                          <span className="text-sm font-medium">{Math.round((filteredData.balance / (filteredData.allocated * 5)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(Math.round((filteredData.balance / (filteredData.allocated * 5)) * 100), 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Based on 5-year target of {(filteredData.allocated * 5).toLocaleString()} OMR</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Industry Recommended (70%)</span>
                          <span className="text-sm font-medium">70%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Minimum recommended funding level</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Optimal Level (100%)</span>
                          <span className="text-sm font-medium">100%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-violet-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Fully funded reserve</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Assessment based on current balance of {filteredData.balance.toLocaleString()} OMR
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ReserveFundDashboard;
