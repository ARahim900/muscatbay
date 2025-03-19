
import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock, DownloadCloud, Zap } from "lucide-react";

const PageHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
      <div className="flex items-center">
        <div className="bg-gradient-to-br from-muscat-primary to-muscat-lavender p-3 rounded-xl shadow-lg mr-4 transform hover:scale-105 transition-all">
          <Zap className="h-6 w-6 text-white animate-pulse-subtle" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-muscat-primary bg-gradient-to-r from-muscat-primary to-muscat-lavender bg-clip-text text-transparent">Electricity System</h1>
          <p className="text-muted-foreground">Real-time monitoring and management</p>
        </div>
      </div>
      <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="flex items-center gap-1 border-muscat-primary/20 hover:border-muscat-primary/40 transition-all duration-300">
          <Clock className="h-4 w-4 text-muscat-primary" />
          <span className="hidden sm:inline">Last Update:</span> Just now
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-1 border-muscat-primary/20 hover:border-muscat-primary/40 transition-all duration-300">
          <DownloadCloud className="h-4 w-4 text-muscat-primary" />
          <span>Export</span>
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
