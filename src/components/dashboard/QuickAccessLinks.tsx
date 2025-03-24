
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  Zap, 
  Factory, 
  Wind, 
  FileText, 
  AirVent, 
  Shield, 
  FolderKanban,
  Clock,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickAccessLink {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  color: string;
  bgColor: string;
}

const quickLinks: QuickAccessLink[] = [
  {
    id: 'electricity',
    title: 'Electricity System',
    description: 'View electricity consumption data',
    icon: <Zap className="h-5 w-5 text-amber-500" />,
    url: '/electricity-system',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50'
  },
  {
    id: 'water',
    title: 'Water System',
    description: 'Monitor water usage and distribution',
    icon: <Droplets className="h-5 w-5 text-blue-500" />,
    url: '/water-system',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'stp',
    title: 'STP Plant',
    description: 'Sewage treatment plant monitoring',
    icon: <Factory className="h-5 w-5 text-green-500" />,
    url: '/stp',
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  },
  {
    id: 'hvac',
    title: 'HVAC/BMS',
    description: 'Building management systems',
    icon: <AirVent className="h-5 w-5 text-orange-500" />,
    url: '/hvac',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'contracts',
    title: 'Contracts',
    description: 'Contract management and tracking',
    icon: <FileText className="h-5 w-5 text-purple-500" />,
    url: '/contracts',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'asset-lifecycle',
    title: 'Asset Lifecycle',
    description: 'Manage asset lifecycle and maintenance',
    icon: <Clock className="h-5 w-5 text-sky-500" />,
    url: '/alm',
    color: 'text-sky-500',
    bgColor: 'bg-sky-50'
  }
];

interface QuickAccessLinksProps {
  className?: string;
}

const QuickAccessLinks: React.FC<QuickAccessLinksProps> = ({ className = '' }) => {
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Star className="h-5 w-5 mr-2 text-amber-500" />
          Quick Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {quickLinks.map(link => (
            <Link 
              key={link.id} 
              to={link.url}
              className="block w-full"
            >
              <div className={`flex flex-col items-start p-3 rounded-lg border ${link.bgColor} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 h-full`}>
                <div className={`mb-2 rounded-full ${link.bgColor} p-2`}>
                  {link.icon}
                </div>
                <h3 className={`font-medium mb-1 ${link.color}`}>{link.title}</h3>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" className="text-xs">
            Customize Quick Access
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAccessLinks;
