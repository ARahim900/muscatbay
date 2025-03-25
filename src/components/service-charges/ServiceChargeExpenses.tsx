
import React, { useState } from 'react';
import { useServiceCharges } from '@/hooks/useServiceCharges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, PieChart as PieChartIcon, BarChart as BarChartIcon, FileText, Download } from 'lucide-react';
import { OperatingExpense } from '@/types/serviceCharges';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ServiceChargeExpenses: React.FC = () => {
  const { expenses, loading, error } = useServiceCharges();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  
  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense => 
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.serviceProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Prepare data for charts
  const getCategoryChartData = () => {
    const categoryMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const currentAmount = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, currentAmount + expense.annualCost);
    });
    
    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / getTotalExpenses()) * 100
    }));
  };
  
  const getTypeChartData = () => {
    const typeMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const currentAmount = typeMap.get(expense.serviceType) || 0;
      typeMap.set(expense.serviceType, currentAmount + expense.annualCost);
    });
    
    return Array.from(typeMap.entries()).map(([type, amount]) => ({
      type,
      amount,
      percentage: (amount / getTotalExpenses()) * 100
    }));
  };
  
  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.annualCost, 0);
  };
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
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
  
  const categoryData = getCategoryChartData();
  const typeData = getTypeChartData();
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalExpenses().toLocaleString()} OMR</div>
            <p className="text-xs text-muted-foreground mt-1">Annual operating costs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique expense categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Service Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Different service types</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(getTotalExpenses() / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} OMR</div>
            <p className="text-xs text-muted-foreground mt-1">Average monthly expenses</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
            <TabsTrigger value="category" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">By Category</span>
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center gap-1">
              <BarChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">By Type</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button variant="outline" className="flex items-center gap-1 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </div>
      
      {/* Content */}
      <div>
        {activeTab === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>Operating Expenses</CardTitle>
              <CardDescription>
                All operating expenses included in service charge calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Monthly (OMR)</TableHead>
                      <TableHead className="text-right">Annual (OMR)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.serviceProvider}</TableCell>
                        <TableCell>{expense.serviceType}</TableCell>
                        <TableCell className="text-right">{expense.monthlyCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{expense.annualCost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(expense.status)}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No expenses found matching your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'category' && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>
                Breakdown of expenses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        nameKey="category"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
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
                
                {/* Category Table */}
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
                      {categoryData.map((category, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{category.category}</td>
                          <td className="text-right py-2">{category.amount.toLocaleString()}</td>
                          <td className="text-right py-2">{(category.amount / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="text-right py-2">{category.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/30">
                        <td className="py-2">Total</td>
                        <td className="text-right py-2">{getTotalExpenses().toLocaleString()}</td>
                        <td className="text-right py-2">{(getTotalExpenses() / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="text-right py-2">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'type' && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Service Type</CardTitle>
              <CardDescription>
                Breakdown of expenses by service type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={typeData}
                      margin={{ top: 10, right: 30, left: 20, bottom: 50 }}
                    >
                      <XAxis 
                        dataKey="type" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} OMR`}
                      />
                      <Bar dataKey="amount" name="Annual Cost" fill="#82ca9d">
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Type Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Service Type</th>
                        <th className="text-right py-2">Annual (OMR)</th>
                        <th className="text-right py-2">Monthly (OMR)</th>
                        <th className="text-right py-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeData.map((type, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{type.type}</td>
                          <td className="text-right py-2">{type.amount.toLocaleString()}</td>
                          <td className="text-right py-2">{(type.amount / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="text-right py-2">{type.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/30">
                        <td className="py-2">Total</td>
                        <td className="text-right py-2">{getTotalExpenses().toLocaleString()}</td>
                        <td className="text-right py-2">{(getTotalExpenses() / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="text-right py-2">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ServiceChargeExpenses;
