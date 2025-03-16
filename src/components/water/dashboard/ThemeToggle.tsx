
import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, setDarkMode }) => {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`p-2 rounded-md transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
          : 'bg-gray-200 text-blue-900 hover:bg-gray-300'
      }`}
      aria-label="Toggle theme"
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
