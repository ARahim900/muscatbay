
import React from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpenseSummaryCards from '@/components/expenses/ExpenseSummaryCards';
import ExpenseTypePieChart from '@/components/expenses/ExpenseTypePieChart';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import { BarChart3, PieChart, ListChecks, FileSpreadsheet } from 'lucide-react';

const OperatingExpenses: React.FC = () => {
  return (
    <StandardPageLayout
      title="Operating Expenses"
      icon={<FileSpreadsheet className="h-8 w-8 text-blue-600" />}
      description="Track and analyze property operating costs"
    >
      <div className="space-y-8">
        <ExpenseSummaryCards />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="by-type" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">By Type</span>
            </TabsTrigger>
            <TabsTrigger value="all-expenses" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">All Expenses</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExpenseTypePieChart />
              <div className="space-y-4">
                <ExpensesTable />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="by-type" className="space-y-4">
            <ExpenseTypePieChart />
          </TabsContent>

          <TabsContent value="all-expenses" className="space-y-4">
            <ExpensesTable />
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
};

export default OperatingExpenses;
