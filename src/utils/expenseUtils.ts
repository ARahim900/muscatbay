
import { ExpenseDisplay, OperatingExpense, ExpenseSummaryByStatus, ExpenseSummaryByType, OperatingExpenseDisplay } from '@/types/expenses';

// Mock expense data for demonstration
export const getMockExpenseDisplayData = (): OperatingExpenseDisplay[] => {
  return [
    {
      category: 'Utilities',
      supplier: 'Muscat Electricity Company',
      allocation: 'All Properties',
      quarterly: [125000, 132000, 128000, 135000],
      monthly: [41000, 42000, 42000, 44000, 44000, 44000, 42000, 43000, 43000, 45000, 45000, 45000],
      annual: 520000,
      percentage: 31.5,
      previousYear: 490000,
      trend: 'up',
      change: 6.1
    },
    {
      category: 'Maintenance',
      supplier: 'Tech Solutions LLC',
      allocation: 'Common Areas',
      quarterly: [95000, 98000, 97000, 100000],
      monthly: [31500, 32000, 31500, 32500, 33000, 32500, 32000, 32500, 32500, 33500, 33500, 33000],
      annual: 390000,
      percentage: 23.6,
      previousYear: 380000,
      trend: 'up',
      change: 2.6
    },
    {
      category: 'Landscaping',
      supplier: 'Green Gardens Co',
      allocation: 'Common Areas',
      quarterly: [65000, 68000, 70000, 67000],
      monthly: [21500, 22000, 21500, 22500, 23000, 22500, 23500, 23000, 23500, 22500, 22000, 22500],
      annual: 270000,
      percentage: 16.4,
      previousYear: 260000,
      trend: 'up',
      change: 3.8
    },
    {
      category: 'Security',
      supplier: 'Shield Security Services',
      allocation: 'All Properties',
      quarterly: [55000, 55000, 55000, 55000],
      monthly: [18333, 18333, 18334, 18333, 18333, 18334, 18333, 18333, 18334, 18333, 18333, 18334],
      annual: 220000,
      percentage: 13.3,
      previousYear: 220000,
      trend: 'stable',
      change: 0
    },
    {
      category: 'Administration',
      supplier: 'Admin Solutions Co',
      allocation: 'All Properties',
      quarterly: [38000, 39000, 39000, 40000],
      monthly: [12500, 12750, 12750, 13000, 13000, 13000, 13000, 13000, 13000, 13250, 13250, 13500],
      annual: 156000,
      percentage: 9.4,
      previousYear: 150000,
      trend: 'up',
      change: 4.0
    },
    {
      category: 'Insurance',
      supplier: 'Oman Insurance Co',
      allocation: 'All Properties',
      quarterly: [23500, 23500, 23500, 23500],
      monthly: [7833, 7833, 7834, 7833, 7833, 7834, 7833, 7833, 7834, 7833, 7833, 7834],
      annual: 94000,
      percentage: 5.7,
      previousYear: 90000,
      trend: 'up',
      change: 4.4
    },
    {
      category: 'Lift Maintenance',
      supplier: 'Elevator Experts LLC',
      allocation: 'Properties with Lifts',
      quarterly: [19000, 19000, 19000, 19000],
      monthly: [6333, 6333, 6334, 6333, 6333, 6334, 6333, 6333, 6334, 6333, 6333, 6334],
      annual: 76000,
      percentage: 4.6,
      previousYear: 76000,
      trend: 'stable',
      change: 0
    }
  ];
};

// Mock operating expenses data
export const fetchOperatingExpenses = async (): Promise<OperatingExpense[]> => {
  // Simulate API call with timeout
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          category: 'Facilities',
          description: 'Electrical maintenance contract',
          service_provider: 'ElectroCorp LLC',
          service_type: 'Utilities',
          monthly_cost: 15000,
          annual_cost: 180000,
          status: 'Active',
          year: 2024
        },
        {
          id: '2',
          category: 'Grounds',
          description: 'Landscaping services',
          service_provider: 'Green Gardens Co',
          service_type: 'Landscaping',
          monthly_cost: 22500,
          annual_cost: 270000,
          status: 'Active',
          year: 2024
        },
        {
          id: '3',
          category: 'Security',
          description: 'Security services contract',
          service_provider: 'Shield Security',
          service_type: 'Security',
          monthly_cost: 18500,
          annual_cost: 222000,
          status: 'Active',
          year: 2024
        },
        {
          id: '4',
          category: 'Facilities',
          description: 'Plumbing maintenance',
          service_provider: 'Plumb Perfect',
          service_type: 'Maintenance',
          monthly_cost: 12000,
          annual_cost: 144000,
          status: 'Pending',
          year: 2024
        },
        {
          id: '5',
          category: 'Admin',
          description: 'Administration services',
          service_provider: 'Admin Solutions',
          service_type: 'Administration',
          monthly_cost: 13000,
          annual_cost: 156000,
          status: 'Active',
          year: 2024
        }
      ]);
    }, 1000);
  });
};

// Mock expense summary by status
export const fetchExpenseSummaryByStatus = async (): Promise<ExpenseSummaryByStatus[]> => {
  // Simulate API call with timeout
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          status: 'Active',
          count: 4,
          total_monthly_cost: 69000,
          total_annual_cost: 828000
        },
        {
          status: 'Pending',
          count: 1,
          total_monthly_cost: 12000,
          total_annual_cost: 144000
        },
        {
          status: 'Expired',
          count: 0,
          total_monthly_cost: 0,
          total_annual_cost: 0
        }
      ]);
    }, 1000);
  });
};

// Mock expense summary by type
export const fetchExpenseSummaryByType = async (): Promise<ExpenseSummaryByType[]> => {
  // Simulate API call with timeout
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          service_type: 'Utilities',
          count: 1,
          total_monthly_cost: 15000,
          total_annual_cost: 180000
        },
        {
          service_type: 'Landscaping',
          count: 1,
          total_monthly_cost: 22500,
          total_annual_cost: 270000
        },
        {
          service_type: 'Security',
          count: 1,
          total_monthly_cost: 18500,
          total_annual_cost: 222000
        },
        {
          service_type: 'Maintenance',
          count: 1,
          total_monthly_cost: 12000,
          total_annual_cost: 144000
        },
        {
          service_type: 'Administration',
          count: 1,
          total_monthly_cost: 13000,
          total_annual_cost: 156000
        }
      ]);
    }, 1000);
  });
};
