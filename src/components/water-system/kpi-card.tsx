
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface KPI_CardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  theme: Record<string, string>;
  bgColor?: string;
}

const KPI_Card: React.FC<KPI_CardProps> = ({ title, value, description, icon: Icon, theme, bgColor }) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-xl group">
      <CardHeader className="pb-2" style={{ backgroundColor: bgColor || theme.primary }}>
        <CardDescription className="text-white flex items-center">
          <Icon className="h-4 w-4 mr-1" />
          {title}
        </CardDescription>
        <CardTitle className="text-2xl font-bold text-white flex items-center justify-between">
          {value}
          <span className="text-xs font-normal bg-white/20 px-2 py-1 rounded-full">
            {description}
          </span>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default KPI_Card;
