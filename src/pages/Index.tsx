
import React from 'react';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { CalendarIcon, Droplets, Zap, BarChart3, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIsMobile } from '@/hooks/use-mobile';
import StatCard from '@/components/dashboard/StatCard';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-muscat-primary dark:text-white">Dashboard</h1>
          <ThemeToggle />
        </div>

        {/* Quick Stats */}
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-4"} gap-4 mb-6`}>
          <StatCard
            title="Electricity Consumption"
            value="693,320 kWh"
            description="Last month: 70,000 kWh"
            icon={Zap}
            color="primary"
            trend={{ value: 5.2, isPositive: true }}
          />
          
          <StatCard
            title="Water Consumption"
            value="481,310 m³"
            description="Last month: 40,107 m³"
            icon={Droplets}
            color="teal"
            trend={{ value: 3.8, isPositive: true }}
          />
          
          <StatCard
            title="Active Projects"
            value="7"
            description="2 pending approval"
            icon={BarChart3}
            color="lavender"
          />
          
          <StatCard
            title="Upcoming Maintenance"
            value="12"
            description="Next: Pump Station (3 days)"
            icon={Clock}
            color="gold"
          />
        </div>

        {/* Quick Access Cards */}
        <h2 className="text-xl font-bold mb-4 text-muscat-primary dark:text-white">Quick Access</h2>
        <div className={`grid ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"} gap-4 mb-8`}>
          {/* Electricity System Card */}
          <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg">Electricity System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Monitor electricity consumption and analyze trends across facilities.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" onClick={() => navigate('/electricity-system')} className="w-full">
                View Dashboard
              </Button>
            </CardFooter>
          </Card>

          {/* Water System Card */}
          <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Droplets className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg">Water System</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Track water usage, monitor loss, and manage consumption by zone.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" onClick={() => navigate('/water-system')} className="w-full">
                View Dashboard
              </Button>
            </CardFooter>
          </Card>

          {/* STP Card */}
          <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500 rounded-lg">
                  <svg 
                    className="h-5 w-5 text-white" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 14.25h14.25m0 0A3.75 3.75 0 0121 18m-6.75-3.75h-1.5m1.5 0v-1.5m0 1.5v1.5m4.5-3h-1.5m1.5 0V10.5m0 5.25v-1.5M4.5 7.5h12a1.5 1.5 0 110 3h-12a1.5 1.5 0 110-3z" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg">STP Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Monitor wastewater treatment plant operations and quality metrics.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" onClick={() => navigate('/stp')} className="w-full">
                View Dashboard
              </Button>
            </CardFooter>
          </Card>

          {/* Projects Card */}
          <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <svg 
                    className="h-5 w-5 text-white" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <CardTitle className="text-lg">Projects</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage infrastructure projects, timelines, and resources.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" onClick={() => navigate('/projects')} className="w-full">
                View Projects
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Recent Activity */}
        <h2 className="text-xl font-bold mb-4 text-muscat-primary dark:text-white">Recent Activity</h2>
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle>System Updates</CardTitle>
            <CardDescription>Latest updates and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: Zap, color: 'bg-amber-100 dark:bg-amber-900', textColor: 'text-amber-800 dark:text-amber-300', title: 'Electricity System Update', description: 'The electricity dashboard has been enhanced with dark mode support.', time: '2 hours ago' },
                { icon: Droplets, color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-800 dark:text-blue-300', title: 'Water System Update', description: 'Water system dashboard has been redesigned for better mobile compatibility.', time: '3 hours ago' },
                { icon: FileText, color: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-800 dark:text-green-300', title: 'New Feature: Dark Mode', description: 'Dark mode has been added to all dashboards for better visibility.', time: '5 hours ago' },
                { icon: BarChart3, color: 'bg-purple-100 dark:bg-purple-900', textColor: 'text-purple-800 dark:text-purple-300', title: 'Dashboard Integration', description: 'All system dashboards now share consistent design and navigation.', time: '1 day ago' }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`${item.color} p-2 rounded-full mt-1`}>
                    <item.icon className={`h-4 w-4 ${item.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium dark:text-white">{item.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
