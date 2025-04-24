
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ReserveCalculator: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Reserve Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This feature is under development. It will allow calculation of reserve funds needed for future asset maintenance and replacement.</p>
      </CardContent>
    </Card>
  );
};

export default ReserveCalculator;
