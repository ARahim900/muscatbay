
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchExpenseSummaryByType } from '@/utils/expenseUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const ExpenseTypePieChart: React.FC = () => {
  const { data: expensesByType, isLoading } = useQuery({
    queryKey: ['expense-summary-by-type'],
    queryFn: fetchExpenseSummaryByType
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Type</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatTooltip = (value: any, name: any, props: any) => {
    return formatCurrency(value, 'OMR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Type</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expensesByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_annual_cost"
                nameKey="service_type"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {expensesByType?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseTypePieChart;
