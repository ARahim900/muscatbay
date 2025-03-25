
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ExpenseStatusCard from './ExpenseStatusCard';
import { ExpenseSummaryByStatus } from '@/types/expenses';
import { fetchExpenseSummaryByStatus, fetchOperatingExpenses } from '@/utils/expenseUtils';

const ExpenseSummaryCards: React.FC = () => {
  const [expensesByStatus, setExpensesByStatus] = useState<ExpenseSummaryByStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchExpenseSummaryByStatus();
        setExpensesByStatus(data);
      } catch (error) {
        console.error('Error fetching expense summary data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate summary metrics
  const totalAnnualCost = expensesByStatus.reduce((sum, item) => sum + item.total_annual_cost, 0);
  const totalMonthlyCost = expensesByStatus.reduce((sum, item) => sum + item.total_monthly_cost, 0);
  const totalServiceCount = expensesByStatus.reduce((sum, item) => sum + item.count, 0);

  // Find specific statuses
  const activeExpenses = expensesByStatus.find(item => item.status === 'Active');
  const pendingExpenses = expensesByStatus.find(item => item.status === 'Pending');
  const expiredExpenses = expensesByStatus.find(item => item.status === 'Expired');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <ExpenseStatusCard
        title="Total Operating Expenses"
        amount={totalAnnualCost}
        count={totalServiceCount}
        description="Annual budget for all services"
        className="border-l-4 border-blue-500"
      />
      
      <ExpenseStatusCard
        title="Active Contracts"
        amount={activeExpenses?.total_annual_cost || 0}
        count={activeExpenses?.count || 0}
        description="Currently active service contracts"
        className="border-l-4 border-green-500"
      />
      
      <ExpenseStatusCard
        title="Pending Approval"
        amount={pendingExpenses?.total_annual_cost || 0}
        count={pendingExpenses?.count || 0}
        description="Contracts awaiting approval"
        className="border-l-4 border-yellow-500"
      />
      
      <ExpenseStatusCard
        title="Monthly Operating Cost"
        amount={totalMonthlyCost}
        count={totalServiceCount}
        description="Average monthly expenses"
        className="border-l-4 border-purple-500"
      />
    </div>
  );
};

export default ExpenseSummaryCards;
