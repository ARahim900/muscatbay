
import { ExpenseDisplay } from '@/types/expenses';

// Mock expense data for demonstration
export const getMockExpenseDisplayData = (): ExpenseDisplay[] => {
  return [
    {
      category: 'Utilities',
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
      quarterly: [23500, 23500, 23500, 23500],
      monthly: [7833, 7833, 7834, 7833, 7833, 7834, 7833, 7833, 7834, 7833, 7833, 7834],
      annual: 94000,
      percentage: 5.7,
      previousYear: 90000,
      trend: 'up',
      change: 4.4
    }
  ];
};
