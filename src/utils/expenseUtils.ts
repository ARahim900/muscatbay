
import { OperatingExpense, ExpenseSummaryByType, ExpenseSummaryByStatus } from '@/types/expenses';

// Helper function to group expenses by service type and calculate totals
export const getExpensesByType = (expenses: OperatingExpense[]): ExpenseSummaryByType[] => {
  const groupedExpenses: { [key: string]: ExpenseSummaryByType } = {};
  
  expenses.forEach(expense => {
    const serviceType = expense.service_type;
    
    if (!groupedExpenses[serviceType]) {
      groupedExpenses[serviceType] = {
        service_type: serviceType,
        count: 0,
        total_monthly_cost: 0,
        total_annual_cost: 0
      };
    }
    
    groupedExpenses[serviceType].count += 1;
    groupedExpenses[serviceType].total_monthly_cost += expense.monthly_cost;
    groupedExpenses[serviceType].total_annual_cost += expense.annual_cost;
  });
  
  return Object.values(groupedExpenses).sort((a, b) => b.total_annual_cost - a.total_annual_cost);
};

// Helper function to group expenses by status and calculate totals
export const getExpensesByStatus = (expenses: OperatingExpense[]): ExpenseSummaryByStatus[] => {
  const groupedExpenses: { [key: string]: ExpenseSummaryByStatus } = {};
  
  expenses.forEach(expense => {
    const status = expense.status;
    
    if (!groupedExpenses[status]) {
      groupedExpenses[status] = {
        status: status,
        count: 0,
        total_monthly_cost: 0,
        total_annual_cost: 0
      };
    }
    
    groupedExpenses[status].count += 1;
    groupedExpenses[status].total_monthly_cost += expense.monthly_cost;
    groupedExpenses[status].total_annual_cost += expense.annual_cost;
  });
  
  return Object.values(groupedExpenses);
};

// Mock data for testing
export const getMockExpensesData = (): OperatingExpense[] => {
  return [
    {
      id: '1',
      service_provider: 'Kalhat',
      service_type: 'Facility Management',
      monthly_cost: 32200.81,
      annual_cost: 386409.72,
      status: 'Active',
      notes: 'Primary facility management contract',
      created_at: '2023-10-01T00:00:00Z',
      updated_at: '2023-10-01T00:00:00Z'
    },
    {
      id: '2',
      service_provider: 'OWATCO',
      service_type: 'STP Operations',
      monthly_cost: 3103.78,
      annual_cost: 37245.40,
      status: 'Active',
      notes: 'STP maintenance and operations',
      created_at: '2023-11-15T00:00:00Z',
      updated_at: '2023-11-15T00:00:00Z'
    },
    {
      id: '3',
      service_provider: 'KONE Assarain LLC',
      service_type: 'Lift Maintenance',
      monthly_cost: 1010.63,
      annual_cost: 12127.50,
      status: 'Active',
      notes: 'Elevator maintenance for all buildings',
      created_at: '2023-09-10T00:00:00Z',
      updated_at: '2023-12-05T00:00:00Z'
    },
    {
      id: '4',
      service_provider: 'Muna Noor',
      service_type: 'Pest Control',
      monthly_cost: 1400.00,
      annual_cost: 16800.00,
      status: 'Active',
      notes: 'Monthly pest control services for all properties',
      created_at: '2023-10-20T00:00:00Z',
      updated_at: '2023-10-20T00:00:00Z'
    },
    {
      id: '5',
      service_provider: 'Gulf Expert',
      service_type: 'HVAC',
      monthly_cost: 770.00,
      annual_cost: 9240.00,
      status: 'Active',
      notes: 'Cooling systems maintenance',
      created_at: '2023-08-01T00:00:00Z',
      updated_at: '2023-11-30T00:00:00Z'
    },
    {
      id: '6',
      service_provider: 'Bahwan Engineering',
      service_type: 'Fire Systems',
      monthly_cost: 743.75,
      annual_cost: 8925.00,
      status: 'Active',
      notes: 'Fire safety systems checks and maintenance',
      created_at: '2023-07-15T00:00:00Z',
      updated_at: '2023-10-10T00:00:00Z'
    },
    {
      id: '7',
      service_provider: 'Utility Provider',
      service_type: 'Water Consumption',
      monthly_cost: 4166.67,
      annual_cost: 50000.00,
      status: 'Active',
      notes: 'Estimated common area water consumption',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-12-31T00:00:00Z'
    },
    {
      id: '8',
      service_provider: 'Utility Provider',
      service_type: 'Electricity',
      monthly_cost: 2916.67,
      annual_cost: 35000.00,
      status: 'Active',
      notes: 'Estimated common area electricity consumption',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-12-31T00:00:00Z'
    },
    {
      id: '9',
      service_provider: 'Various',
      service_type: 'Miscellaneous',
      monthly_cost: 937.70,
      annual_cost: 11252.38,
      status: 'Active',
      notes: 'Various smaller operational expenses',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-12-31T00:00:00Z'
    }
  ];
};
