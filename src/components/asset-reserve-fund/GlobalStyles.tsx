
import React from 'react';

const GlobalStyles: React.FC = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const trackColor = isDarkMode ? '#1f2937' : '#f1f1f1';
  const thumbColor = isDarkMode ? '#4b5563' : '#888';
  const thumbHoverColor = isDarkMode ? '#6b7280' : '#555';
  
  return (
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out forwards;
      }
      
      .dark {
        color-scheme: dark;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${trackColor};
        border-radius: 10px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${thumbColor};
        border-radius: 10px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: ${thumbHoverColor};
      }
    `}</style>
  );
};

export default GlobalStyles;
