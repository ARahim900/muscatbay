
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, FileSpreadsheet, BarChart2, Calculator, Droplets, Zap, Settings, Building } from 'lucide-react';

type QuickAccessLinksProps = {
  className?: string;
};

const QuickAccessLinks: React.FC<QuickAccessLinksProps> = ({ className }) => {
  const links = [
    {
      title: 'STP Dashboard',
      icon: <Droplets className="h-5 w-5 text-blue-500" />,
      description: 'Monitor sewage treatment plant operations',
      url: '/stp-dashboard',
      color: 'from-blue-50 to-blue-100 border-blue-200'
    },
    {
      title: 'Electricity System',
      icon: <Zap className="h-5 w-5 text-amber-500" />,
      description: 'Track electrical consumption and distribution',
      url: '/electricity-system',
      color: 'from-amber-50 to-amber-100 border-amber-200'
    },
    {
      title: 'Water System',
      icon: <Droplets className="h-5 w-5 text-cyan-500" />,
      description: 'Monitor water distribution and consumption',
      url: '/water-system',
      color: 'from-cyan-50 to-cyan-100 border-cyan-200'
    },
    {
      title: 'Data Management',
      icon: <Database className="h-5 w-5 text-emerald-500" />,
      description: 'Enter and update utility data',
      url: '/data-management',
      color: 'from-emerald-50 to-emerald-100 border-emerald-200'
    },
    {
      title: 'Service Charges',
      icon: <Calculator className="h-5 w-5 text-violet-500" />,
      description: 'Calculate and manage service charges',
      url: '/service-charges',
      color: 'from-violet-50 to-violet-100 border-violet-200'
    },
    {
      title: 'Reserve Fund',
      icon: <BarChart2 className="h-5 w-5 text-indigo-500" />,
      description: 'Asset lifecycle and reserve fund management',
      url: '/reserve-fund-dashboard',
      color: 'from-indigo-50 to-indigo-100 border-indigo-200'
    },
    {
      title: 'Operating Expenses',
      icon: <FileSpreadsheet className="h-5 w-5 text-rose-500" />,
      description: 'Track and manage operating expenses',
      url: '/operating-expenses',
      color: 'from-rose-50 to-rose-100 border-rose-200'
    },
    {
      title: 'Admin',
      icon: <Settings className="h-5 w-5 text-gray-500" />,
      description: 'System configuration and user management',
      url: '/admin',
      color: 'from-gray-50 to-gray-100 border-gray-200'
    }
  ];

  return (
    <div className={className}>
      <h2 className="text-xl font-bold mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {links.map((link, index) => (
          <Link
            key={index}
            to={link.url}
            className={`block p-4 border rounded-lg bg-gradient-to-br ${link.color} hover:shadow-md transition-all`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                {link.icon}
                <h3 className="ml-2 font-medium">{link.title}</h3>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-2 text-sm text-gray-600">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickAccessLinks;
