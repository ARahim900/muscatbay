
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  compactView?: boolean;
  darkMode?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  description, 
  trend, 
  icon, 
  compactView = false, 
  darkMode = false 
}) => {
  return (
    <div className={`overflow-hidden shadow-md rounded-lg transform transition-transform hover:scale-[1.02] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`${compactView ? 'p-4' : 'p-5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</h3>
            <div className="mt-1 flex items-baseline">
              <p className={`${compactView ? 'text-xl' : 'text-2xl'} font-semibold ${darkMode ? 'text-white' : 'text-[#4E4456]'}`}>{value}</p>
              {trend && (
                <span className={`ml-2 flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {trend === 'up' ? (
                    <svg 
                      className="self-center flex-shrink-0 h-4 w-4 text-green-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 10l7-7m0 0l7 7m-7-7v18" 
                      />
                    </svg>
                  ) : (
                    <svg 
                      className="self-center flex-shrink-0 h-4 w-4 text-red-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                      />
                    </svg>
                  )}
                </span>
              )}
            </div>
            {description && <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>}
          </div>
          <div className={`rounded-md p-3 ${darkMode ? 'bg-[#4E4456]/30 text-[#AD9BBD]' : 'bg-[#4E4456]/10 text-[#4E4456]'}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
