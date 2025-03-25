
import { supabase } from "@/integrations/supabase/client";
import { OperatingExpense, ExpenseSummaryByType, ExpenseSummaryByStatus } from "@/types/expenses";
import { toast } from "@/components/ui/use-toast";

export async function fetchOperatingExpenses(): Promise<OperatingExpense[]> {
  try {
    const { data, error } = await supabase
      .from('operating_expenses')
      .select('*')
      .order('annual_cost', { ascending: false });
    
    if (error) {
      console.error('Error fetching operating expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load operating expenses",
        variant: "destructive",
      });
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching operating expenses:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
    return [];
  }
}

export async function fetchExpenseSummaryByType(): Promise<ExpenseSummaryByType[]> {
  try {
    const { data, error } = await supabase
      .from('expense_summary_by_type')
      .select('*');
    
    if (error) {
      console.error('Error fetching expense summary by type:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching expense summary by type:', error);
    return [];
  }
}

export async function fetchExpenseSummaryByStatus(): Promise<ExpenseSummaryByStatus[]> {
  try {
    const { data, error } = await supabase
      .from('expense_summary_by_status')
      .select('*');
    
    if (error) {
      console.error('Error fetching expense summary by status:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching expense summary by status:', error);
    return [];
  }
}
