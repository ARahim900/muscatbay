
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ className, children, delay = 0 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const card = cardRef.current;
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(15px)';
      
      setTimeout(() => {
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, delay);
    }
  }, [delay]);
  
  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white border border-muscat-primary/5 rounded-xl shadow-soft p-5 transition-all hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
};

export default DashboardCard;
