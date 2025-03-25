
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOperatingExpenses } from '@/utils/expenseUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { OperatingExpense } from '@/types/expenses';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ExpensesTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['operating-expenses'],
    queryFn: fetchOperatingExpenses
  });

  // Extract unique statuses and types for filters
  const uniqueStatuses = [...new Set(expenses?.map(expense => expense.status) || [])];
  const uniqueTypes = [...new Set(expenses?.map(expense => expense.service_type) || [])];

  // Filter expenses
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.service_provider.toLowerCase().includes(searchTerm.toLowerCase()) || 
      expense.service_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
      expense.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || expense.status === statusFilter;
    const matchesType = typeFilter === '' || expense.service_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operating Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full sm:w-1/4" />
              <Skeleton className="h-10 w-full sm:w-1/4" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operating Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Service Type</SelectLabel>
                  <SelectItem value="">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Provider</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead className="text-right">Monthly Cost</TableHead>
                  <TableHead className="text-right">Annual Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No expenses found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses?.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.service_provider}</TableCell>
                      <TableCell>{expense.service_type}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.monthly_cost, 'OMR')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.annual_cost, 'OMR')}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${expense.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            expense.status === 'Estimate' ? 'bg-blue-100 text-blue-800' : 
                            expense.status === 'Critical Gap' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'}`
                        }>
                          {expense.status}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={expense.notes || ''}>
                        {expense.notes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesTable;
