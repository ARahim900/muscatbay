
import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  darkMode?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, darkMode = false }) => {
  return (
    <div className={`overflow-hidden shadow-md rounded-lg transform transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-medium ${darkMode ? 'text-[#AD9BBD]' : 'text-[#4E4456]'}`}>{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
