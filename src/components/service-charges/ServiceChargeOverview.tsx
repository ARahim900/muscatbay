
import React from 'react';
import { useServiceCharges } from '@/hooks/useServiceCharges';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getExpenseCategorySummary, getZoneExpenseSummary } from '@/services/serviceChargeService';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, Pie, PieChart, Sector, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Loader2, Building2, Coins, Users } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ServiceChargeOverview: React.FC = () => {
  const { zones, expenses, loading, error } = useServiceCharges();
  
  const { data: categorySummary, isLoading: loadingCategorySummary } = useQuery({
    queryKey: ['expenseCategorySummary'],
    queryFn: getExpenseCategorySummary,
    enabled: !loading && expenses.length > 0
  });
  
  const { data: zoneSummary, isLoading: loadingZoneSummary } = useQuery({
    queryKey: ['zoneExpenseSummary'],
    queryFn: getZoneExpenseSummary,
    enabled: !loading && zones.length > 0
  });
  
  if (loading || loadingCategorySummary || loadingZoneSummary) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }
  
  const totalOperatingCost = expenses.reduce((sum, exp) => sum + exp.annualCost, 0);
  const totalProperties = zones.reduce((sum, zone) => sum + zone.unitCount, 0);
  
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Total Operating Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOperatingCost.toLocaleString()} OMR</div>
            <p className="text-xs text-muted-foreground mt-1">Annual operating costs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Total Service Charge Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.reduce((sum, zone) => sum + zone.totalBUA, 0).toLocaleString()} sqm
            </div>
            <p className="text-xs text-muted-foreground mt-1">Chargeable built-up area</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Properties Under Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {zones.length} zones</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
          <TabsTrigger value="zones">Zone Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Charge Expense Breakdown</CardTitle>
              <CardDescription>
                Distribution of operating expenses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySummary}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        nameKey="category"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categorySummary?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} OMR`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Expense Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Category</th>
                        <th className="text-right py-2">Annual (OMR)</th>
                        <th className="text-right py-2">Monthly (OMR)</th>
                        <th className="text-right py-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorySummary?.map((category, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{category.category}</td>
                          <td className="text-right py-2">{category.amount.toLocaleString()}</td>
                          <td className="text-right py-2">{(category.amount / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="text-right py-2">{category.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/30">
                        <td className="py-2">Total</td>
                        <td className="text-right py-2">{totalOperatingCost.toLocaleString()}</td>
                        <td className="text-right py-2">{(totalOperatingCost / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="text-right py-2">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone Rate Comparison</CardTitle>
              <CardDescription>
                Service charge rates by zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={zoneSummary}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <XAxis dataKey="zoneName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString()} OMR`}
                    />
                    <Legend />
                    <Bar dataKey="baseRate" name="Base Rate (OMR/sqm)" fill="#0088FE" />
                    <Bar dataKey="averageCharge" name="Avg Annual Charge" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Zone</th>
                      <th className="text-right py-2">Properties</th>
                      <th className="text-right py-2">Total Area (sqm)</th>
                      <th className="text-right py-2">Base Rate (OMR/sqm)</th>
                      <th className="text-right py-2">Avg Annual Charge (OMR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneSummary?.map((zone, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{zone.zoneName}</td>
                        <td className="text-right py-2">
                          {zones.find(z => z.code === zone.zoneCode)?.unitCount || 0}
                        </td>
                        <td className="text-right py-2">{zone.totalArea.toLocaleString()}</td>
                        <td className="text-right py-2">{zone.baseRate.toFixed(2)}</td>
                        <td className="text-right py-2">{zone.averageCharge.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceChargeOverview;
