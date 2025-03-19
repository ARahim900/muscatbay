
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MonitoringTab = () => {
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft transform hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-muscat-primary">Real-time Monitoring</CardTitle>
          <CardDescription>Live power metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Real-time monitoring dashboard will be displayed here. The monitoring system is currently being upgraded.
          </p>
          <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-md flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-muscat-primary/30 border-t-muscat-primary mb-3"></div>
            <p className="text-gray-500 dark:text-gray-400">Monitoring dashboard loading...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringTab;
