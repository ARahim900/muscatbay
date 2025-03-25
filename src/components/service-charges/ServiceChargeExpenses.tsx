
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, DollarSign } from 'lucide-react';
import { ServiceChargeExpensesProps } from '@/types/expenses';

const ServiceChargeExpenses: React.FC<ServiceChargeExpensesProps> = ({ expenses, reserveFundRates }) => {
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.annual, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Operating Expenses
          </CardTitle>
          <CardDescription>
            These expenses are used to calculate service charges for all properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Annual Amount (OMR)</TableHead>
                <TableHead>Allocation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{expense.category}</TableCell>
                  <TableCell>{expense.supplier}</TableCell>
                  <TableCell className="text-right">{expense.annual.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                  <TableCell>{expense.allocation}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={2} className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">
                  {totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Reserve Fund Rates
          </CardTitle>
          <CardDescription>
            These rates are applied based on property zone and size
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Rate (OMR/m²)</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reserveFundRates.map((rate, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{rate.zone}</TableCell>
                  <TableCell>{rate.zoneName}</TableCell>
                  <TableCell className="text-right">{rate.rate.toFixed(2)}</TableCell>
                  <TableCell>{new Date(rate.effectiveDate).toLocaleDateString()}</TableCell>
                  <TableCell>{rate.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceChargeExpenses;
