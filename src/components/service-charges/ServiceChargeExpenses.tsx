
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { OperatingExpense, ReserveFundRate } from '@/types/expenses';

interface ServiceChargeExpensesProps {
  operatingExpenses: OperatingExpense[];
  reserveFundRates: ReserveFundRate[];
}

const ServiceChargeExpenses: React.FC<ServiceChargeExpensesProps> = ({ 
  operatingExpenses,
  reserveFundRates 
}) => {
  const totalExpenses = operatingExpenses.reduce((sum, expense) => sum + expense.annual, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operating Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            These expenses are used to calculate service charges for all properties in Muscat Bay.
          </div>
          
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Annual Amount (OMR)</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operatingExpenses.map((expense, index) => {
                  const percentage = (expense.annual / totalExpenses) * 100;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell>{expense.supplier}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.annual, 'OMR')}</TableCell>
                      <TableCell>{expense.allocation}</TableCell>
                      <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold" colSpan={2}>Total</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalExpenses, 'OMR')}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-bold">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reserve Fund Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Reserve fund contribution rates are applied to each property based on its zone and size.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reserveFundRates.map((rate, index) => (
              <div key={index} className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Zone</div>
                <div className="font-medium mb-2">{rate.zoneName}</div>
                <div className="text-sm text-muted-foreground">Rate (OMR/sqm)</div>
                <div className="font-bold text-lg">{rate.rate.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-2">Effective from: {rate.effectiveDate}</div>
                {rate.notes && <div className="text-xs text-muted-foreground mt-2">{rate.notes}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceChargeExpenses;
