
import React from 'react'
import { Droplet, Layers, ArrowDownRight, Percent } from "lucide-react"

export interface FeatureProps {
  title: string
  value: string
  description: string
  icon: string
  color: string
  index?: number
}

interface FeaturesSectionProps {
  features: Omit<FeatureProps, "index">[]
}

export const FeaturesSectionWithHoverEffects: React.FC<FeaturesSectionProps> = ({ features }) => {
  // Map of icon strings to Lucide React components
  const iconMap: Record<string, React.ReactNode> = {
    "Droplet": <Droplet className="h-6 w-6" />,
    "Layers": <Layers className="h-6 w-6" />,
    "ArrowDownRight": <ArrowDownRight className="h-6 w-6" />,
    "Percent": <Percent className="h-6 w-6" />
  };

  // Map of color names to tailwind color classes
  const colorMap: Record<string, string> = {
    "blue": "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
    "green": "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300",
    "amber": "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
    "red": "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300",
    "purple": "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300"
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 gap-x-8">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-1 hover:border-gray-300 dark:hover:border-gray-600"
          >
            <div 
              className={`inline-flex p-3 rounded-lg mb-4 ${colorMap[feature.color] || colorMap.blue}`}
            >
              {iconMap[feature.icon] || <Droplet className="h-6 w-6" />}
            </div>
            
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{feature.title}</h3>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{feature.value}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
