
import React from 'react';
import ReserveFundLookup from './ReserveFundLookup';

interface DashboardProps {
  compactView?: boolean;
  darkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ compactView = false, darkMode = false }) => {
  return (
    <div className="space-y-6">
      {/* Reserve Fund Lookup Component */}
      <ReserveFundLookup compactView={compactView} darkMode={darkMode} />
    </div>
  );
};

export default Dashboard;
