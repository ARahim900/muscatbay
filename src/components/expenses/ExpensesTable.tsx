
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchOperatingExpenses } from "@/utils/expenseUtils";
import { OperatingExpense } from "@/types/expenses";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const ExpensesTable: React.FC = () => {
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchOperatingExpenses();
        setExpenses(data);
      } catch (error) {
        console.error('Error fetching operating expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique service types for filtering
  const serviceTypes = ['All', ...new Set(expenses.map(expense => expense.service_type))];
  
  // Get unique service providers for filtering
  const serviceProviders = ['All', ...new Set(expenses.map(expense => expense.service_provider))];
  
  // Filter expenses based on selected type
  const filteredExpenses = filterType === 'All' 
    ? expenses 
    : expenses.filter(expense => expense.service_type === filterType);

  if (loading) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Operating Expenses</span>
          <div className="flex items-center space-x-2">
            <select 
              className="text-sm border rounded p-1"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {serviceTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Provider</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead className="text-right">Monthly Cost</TableHead>
              <TableHead className="text-right">Annual Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.service_provider}</TableCell>
                <TableCell>{expense.service_type}</TableCell>
                <TableCell className="text-right">{formatCurrency(expense.monthly_cost, 'OMR')}</TableCell>
                <TableCell className="text-right">{formatCurrency(expense.annual_cost, 'OMR')}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    expense.status === 'Active' ? 'bg-green-100 text-green-800' :
                    expense.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {expense.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ExpensesTable;
