
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const InfoAlert = () => {
  return (
    <Alert className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-800/10 dark:border-amber-800 backdrop-blur-sm shadow-soft">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-400">Information</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        Welcome to the Electricity System management dashboard. This interface provides monitoring capabilities for electrical systems throughout Muscat Bay.
      </AlertDescription>
    </Alert>
  );
};

export default InfoAlert;
