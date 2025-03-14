
import React from 'react';

interface QualityParameterCardProps {
  name: string;
  value: string;
  target: string;
  status: 'optimal' | 'warning' | 'critical';
}

const QualityParameterCard: React.FC<QualityParameterCardProps> = ({ name, value, target, status }) => (
  <div className="flex justify-between items-center p-3 rounded-md bg-gray-50">
    <div>
      <p className="text-sm font-medium text-gray-900">{name}</p>
      <p className="text-xs text-gray-500">Target: {target}</p>
    </div>
    <div className="flex items-center">
      <p className="text-sm font-medium mr-2">{value}</p>
      <span className={`w-3 h-3 rounded-full ${
        status === 'optimal' ? 'bg-green-500' :
        status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
      }`}></span>
    </div>
  </div>
);

export default QualityParameterCard;
