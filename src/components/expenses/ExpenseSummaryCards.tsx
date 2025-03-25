
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ExpenseStatusCard from './ExpenseStatusCard';
import { fetchExpenseSummaryByStatus, fetchOperatingExpenses } from '@/utils/expenseUtils';
import { Skeleton } from '@/components/ui/skeleton';

const ExpenseSummaryCards: React.FC = () => {
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['operating-expenses'],
    queryFn: fetchOperatingExpenses
  });

  const { data: statusSummary, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['expense-summary-by-status'],
    queryFn: fetchExpenseSummaryByStatus
  });

  const isLoading = isLoadingExpenses || isLoadingStatus;

  // Calculate totals
  const totalMonthly = expenses?.reduce((sum, expense) => sum + expense.monthly_cost, 0) || 0;
  const totalAnnual = expenses?.reduce((sum, expense) => sum + expense.annual_cost, 0) || 0;
  const totalCount = expenses?.length || 0;

  // Get status summaries
  const activeExpenses = statusSummary?.find(s => s.status === 'Active');
  const estimateExpenses = statusSummary?.find(s => s.status === 'Estimate');
  const criticalExpenses = statusSummary?.find(s => s.status === 'Critical Gap');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <ExpenseStatusCard
        title="Total Annual Expense"
        amount={totalAnnual}
        count={totalCount}
        description="All operating expenses combined"
        className="border-blue-200 bg-blue-50"
      />
      <ExpenseStatusCard
        title="Monthly Operating Cost"
        amount={totalMonthly}
        count={totalCount}
        description="Monthly operating budget"
        className="border-green-200 bg-green-50"
      />
      <ExpenseStatusCard
        title="Active Service Contracts"
        amount={activeExpenses?.total_annual_cost || 0}
        count={activeExpenses?.count || 0}
        description="Current service agreements"
        className="border-teal-200 bg-teal-50"
      />
      <ExpenseStatusCard
        title="Estimated & Pending"
        amount={(estimateExpenses?.total_annual_cost || 0) + (criticalExpenses?.total_annual_cost || 0)}
        count={(estimateExpenses?.count || 0) + (criticalExpenses?.count || 0)}
        description="Estimated and critical expense gaps"
        className="border-amber-200 bg-amber-50"
      />
    </div>
  );
};

export default ExpenseSummaryCards;
