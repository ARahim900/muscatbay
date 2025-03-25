
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building, DollarSign, LineChart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { OperatingExpense, ReserveFundRate } from '@/types/expenses';

interface ServiceChargeOverviewProps {
  zones: { id: string, name: string }[];
  operatingExpenses: OperatingExpense[];
  reserveFundRates: ReserveFundRate[];
  properties: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ServiceChargeOverview: React.FC<ServiceChargeOverviewProps> = ({ 
  zones, 
  operatingExpenses, 
  reserveFundRates,
  properties
}) => {
  // Calculate totals
  const totalExpenses = operatingExpenses.reduce((sum, expense) => sum + expense.annual, 0);
  const totalBUA = properties.reduce((sum, prop) => sum + prop.size, 0);

  // Prepare data for charts
  const expenseData = operatingExpenses.map(expense => ({
    name: expense.category,
    value: expense.annual,
    percentage: ((expense.annual / totalExpenses) * 100).toFixed(1)
  }));

  // Zone data
  const zoneData = zones.map(zone => {
    const zoneProps = properties.filter(p => p.zone === zone.id);
    const zoneBUA = zoneProps.reduce((sum, prop) => sum + prop.size, 0);
    return {
      name: zone.name,
      properties: zoneProps.length,
      area: zoneBUA,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building className="h-5 w-5 text-teal-500 mr-2" />
              <div className="text-2xl font-bold">{properties.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all zones</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{formatCurrency(totalExpenses, 'OMR')}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Operating expenses only</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Built-up Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <LineChart className="h-5 w-5 text-purple-500 mr-2" />
              <div className="text-2xl font-bold">{totalBUA.toLocaleString()} sqm</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all properties</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Zone Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={zoneData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="properties" name="Properties" fill="#0088FE" />
                  <Bar dataKey="area" name="Area (sqm)" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number, 'OMR')} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reserve Fund Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Rate (OMR/sqm)</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reserveFundRates.map((rate, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{rate.zoneName}</TableCell>
                    <TableCell>{rate.rate.toFixed(2)}</TableCell>
                    <TableCell>{rate.effectiveDate}</TableCell>
                    <TableCell>{rate.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceChargeOverview;
