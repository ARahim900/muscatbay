
import React from 'react';
import { InfoIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  darkMode?: boolean;
  description?: string;
  actionButton?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  children, 
  darkMode = false, 
  description,
  actionButton
}) => {
  return (
    <div className={`overflow-hidden shadow-md rounded-lg transform transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-[#AD9BBD]' : 'text-[#4E4456]'}`}>{title}</h3>
          {description && (
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
          )}
        </div>
        {actionButton ? (
          actionButton
        ) : (
          <button className={`p-1 rounded-full hover:bg-opacity-10 hover:bg-gray-500 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <InfoIcon size={16} />
          </button>
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
