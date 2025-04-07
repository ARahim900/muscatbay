
import React from 'react';
import { Droplet } from 'lucide-react';

export const WaterDropIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
    <Droplet className="w-5 h-5 text-blue-600" />
  </div>
);

export const EfficiencyIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  </div>
);

export const IrrigationIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
      <path d="M8 16a4 4 0 0 1-8 0c0-2.5 4-6 4-6s4 3.5 4 6Z" />
      <path d="M16 16a4 4 0 0 1-8 0c0-2.5 4-6 4-6s4 3.5 4 6Z" />
      <path d="M24 16a4 4 0 0 1-8 0c0-2.5 4-6 4-6s4 3.5 4 6Z" />
    </svg>
  </div>
);

export const TankerIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
      <path d="M4 2a2 2 0 0 0-2 2v10a4 4 0 0 0 4 4h16" />
      <path d="M8 4V2" />
      <path d="M12 4V2" />
      <path d="M18 9v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1" />
    </svg>
  </div>
);
