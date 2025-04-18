
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Droplet, Calendar } from 'lucide-react';

interface WaterDashboardLinksProps {
  currentRoute: string;
}

const WaterDashboardLinks: React.FC<WaterDashboardLinksProps> = ({ currentRoute }) => {
  const dashboards = [
    {
      year: '2024',
      url: 'https://water-dashboard-24.lovable.app',
      route: '/water2024',
      isActive: currentRoute === '/water2024'
    },
    {
      year: '2025',
      url: 'https://water-dashboard-25.lovable.app',
      route: '/water2025',
      isActive: currentRoute === '/water2025'
    }
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      {dashboards.map((dashboard) => (
        <Card key={dashboard.year} className={dashboard.isActive ? 'border-primary border-2' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Water Dashboard {dashboard.year}
            </CardTitle>
            <CardDescription>
              Access water management data and analytics for {dashboard.year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              View comprehensive water usage statistics, conservation metrics, 
              and management tools for the year {dashboard.year}.
            </p>
            <Button 
              onClick={() => window.open(dashboard.url, '_blank')}
              className="flex items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Dashboard
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WaterDashboardLinks;
