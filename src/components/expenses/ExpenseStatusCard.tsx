
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface ExpenseStatusCardProps {
  title: string;
  amount: number;
  count: number;
  description?: string;
  className?: string;
}

const ExpenseStatusCard: React.FC<ExpenseStatusCardProps> = ({ 
  title, 
  amount, 
  count, 
  description, 
  className 
}) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(amount, 'OMR')}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {count} {count === 1 ? 'service' : 'services'}
        </p>
      </CardContent>
      {description && (
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardFooter>
      )}
    </Card>
  );
};

export default ExpenseStatusCard;
