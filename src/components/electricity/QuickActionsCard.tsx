
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QuickActionsCard = () => {
  return (
    <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft transform hover:shadow transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-muscat-primary">Quick Actions</CardTitle>
        <CardDescription>Common electricity system tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="text-muscat-primary hover:bg-muscat-primary/5 border-muscat-primary/20 hover:border-muscat-primary/30 transition-all duration-300 group">
            <span className="group-hover:translate-x-1 transition-transform inline-block">View Consumption History</span>
          </Button>
          <Button variant="outline" className="text-muscat-primary hover:bg-muscat-primary/5 border-muscat-primary/20 hover:border-muscat-primary/30 transition-all duration-300 group">
            <span className="group-hover:translate-x-1 transition-transform inline-block">Run System Diagnostics</span>
          </Button>
          <Button variant="outline" className="text-muscat-primary hover:bg-muscat-primary/5 border-muscat-primary/20 hover:border-muscat-primary/30 transition-all duration-300 group">
            <span className="group-hover:translate-x-1 transition-transform inline-block">Generate Monthly Report</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
