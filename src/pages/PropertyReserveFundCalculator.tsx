
import React from 'react';
import { Calculator } from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import ReserveCalculatorPage from '@/components/ReserveCalculatorPage';

const PropertyReserveFundCalculator: React.FC = () => {
  return (
    <StandardPageLayout
      title="Reserve Fund Calculator"
      icon={<Calculator className="h-8 w-8 text-green-600" />}
      description="Calculate and analyze reserve fund contributions for Muscat Bay properties"
    >
      <ReserveCalculatorPage />
    </StandardPageLayout>
  );
};

export default PropertyReserveFundCalculator;
