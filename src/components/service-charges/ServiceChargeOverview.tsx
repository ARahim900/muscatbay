
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, PieChart, Home, Settings } from 'lucide-react';
import { ServiceChargeOverviewProps, OperatingExpenseDisplay } from '@/types/expenses';

const ServiceChargeOverview: React.FC<ServiceChargeOverviewProps> = ({ expenses, reserveFundRates }) => {
  // Calculate total budgeted amount
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.annual, 0);
  
  // Get expense categories for chart
  const expenseCategories = expenses.map(expense => ({
    name: expense.category,
    value: expense.annual,
    percent: (expense.annual / totalExpenses) * 100
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Annual Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} OMR
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Operating expenses only
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Largest Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenseCategories[0]?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenseCategories[0]?.percent.toFixed(1)}% of total budget
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenses.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active expense categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reserve Fund Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reserveFundRates.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              With varying rates
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseCategories.map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm font-medium">{category.percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${category.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Reserve Fund Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reserveFundRates.map((rate, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium">{rate.zoneName}</div>
                    <div className="text-sm text-muted-foreground">Effective: {new Date(rate.effectiveDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-lg font-bold">
                    {rate.rate.toFixed(2)} OMR/m²
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceChargeOverview;
