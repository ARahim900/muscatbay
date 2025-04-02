
import React from 'react';

export const PumpStationIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 17h4v-6H3v6z" />
    <path d="M7 17h4V7H7v10z" />
    <path d="M11 17h4v-6h-4v6z" />
    <path d="M15 17h4V7h-4v10z" />
    <path d="M5 11V9c0-1 1-2 3-2s3 1 3 2v2" />
    <path d="M13 11V9c0-1 1-2 3-2s3 1 3 2v2" />
  </svg>
);

export const Calculator = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="8" x2="8" y1="12" y2="12" />
    <line x1="12" x2="12" y1="12" y2="12" />
    <line x1="16" x2="16" y1="12" y2="12" />
    <line x1="8" x2="8" y1="16" y2="16" />
    <line x1="12" x2="12" y1="16" y2="16" />
    <line x1="16" x2="16" y1="16" y2="16" />
  </svg>
);
