
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

const ReportsTab = () => {
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft transform hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-muscat-primary flex items-center">
            <FileText className="h-5 w-5 mr-2 text-muscat-primary" />
            Reports
          </CardTitle>
          <CardDescription>Generated reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            No reports have been generated yet. Use the form below to create a new report.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Report Type</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-muscat-primary/30 focus:border-muscat-primary transition-all">
                <option>Daily Consumption</option>
                <option>Monthly Usage</option>
                <option>System Performance</option>
                <option>Efficiency Analysis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date Range</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-muscat-primary/30 focus:border-muscat-primary transition-all">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>Custom range</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Button className="w-full md:w-auto bg-gradient-to-r from-muscat-primary to-muscat-primary/90 hover:from-muscat-primary/90 hover:to-muscat-primary text-white transition-all duration-300">
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;
