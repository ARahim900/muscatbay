
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Calendar, BarChart2, Droplet, Zap, Home, Shield, FileText, Briefcase, Activity, ThermometerSun, PieChart, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [animatedItems, setAnimatedItems] = useState({});

  // Brand color
  const brandColor = "#4E4456";
  
  // Define the navigation categories and their subsections
  const navigationCategories = [
    {
      id: 'utilities',
      title: 'UTILITIES',
      icon: <Activity size={22} className="text-blue-500" />,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-indigo-600',
      bgGradient: 'bg-gradient-to-r from-blue-500/10 to-indigo-600/10',
      shadowColor: 'shadow-blue-200/50',
      accentColor: 'bg-blue-500',
      textColor: 'text-blue-500',
      subsections: [
        { 
          name: 'Electricity System', 
          icon: <Zap size={22} />, 
          color: 'from-amber-400 to-amber-600',
          bgColor: 'bg-amber-500',
          lightBg: 'bg-amber-50',
          textColor: 'text-amber-600',
          iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
          metrics: [
            { label: 'Consumption', value: '12.6 MW', trend: '+3%' },
            { label: 'Distribution', value: '98.2%', trend: '-0.5%' }
          ],
          path: '/electricity-system',
          description: 'Monitor power consumption and distribution'
        },
        { 
          name: 'Water System', 
          icon: <Droplet size={22} />, 
          color: 'from-cyan-400 to-blue-500',
          bgColor: 'bg-cyan-500',
          lightBg: 'bg-cyan-50',
          textColor: 'text-cyan-600',
          iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-500',
          metrics: [
            { label: 'Consumption', value: '325 m³', trend: '-1.2%' },
            { label: 'Quality Index', value: '97.8%', trend: '+0.3%' }
          ],
          path: '/water-system',
          description: 'Track usage and water management systems'
        }
      ]
    },
    {
      id: 'facilities',
      title: 'FACILITIES',
      icon: <Home size={22} className="text-emerald-500" />,
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-teal-600',
      bgGradient: 'bg-gradient-to-r from-emerald-500/10 to-teal-600/10',
      shadowColor: 'shadow-emerald-200/50',
      accentColor: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      subsections: [
        { 
          name: 'STP Plant', 
          icon: <Droplet size={22} />, 
          color: 'from-green-400 to-green-600',
          bgColor: 'bg-green-500',
          lightBg: 'bg-green-50',
          textColor: 'text-green-600',
          iconBg: 'bg-gradient-to-br from-green-400 to-green-600',
          metrics: [
            { label: 'Processing', value: '92.3%', trend: '+1.2%' },
            { label: 'Efficiency', value: '88.7%', trend: '+2.5%' }
          ],
          path: '/stp',
          description: 'Sewage treatment plant operations dashboard'
        },
        { 
          name: 'Pumping Stations', 
          icon: <Activity size={22} />, 
          color: 'from-blue-400 to-indigo-600',
          bgColor: 'bg-blue-500',
          lightBg: 'bg-blue-50',
          textColor: 'text-blue-600',
          iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-600',
          metrics: [
            { label: 'Operational', value: '14/15', trend: '0%' },
            { label: 'Efficiency', value: '94.2%', trend: '+0.7%' }
          ],
          path: '/water-system',
          description: 'Monitor performance and operational status'
        },
        { 
          name: 'HVAC/BMS', 
          icon: <ThermometerSun size={22} />, 
          color: 'from-orange-400 to-red-500',
          bgColor: 'bg-orange-500',
          lightBg: 'bg-orange-50', 
          textColor: 'text-orange-600',
          iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
          metrics: [
            { label: 'Energy Usage', value: '8.4 MW', trend: '-2.1%' },
            { label: 'Performance', value: '91.5%', trend: '+1.3%' }
          ],
          path: '/hvac',
          description: 'Building management and climate control'
        }
      ]
    },
    {
      id: 'management',
      title: 'MANAGEMENT',
      icon: <Briefcase size={22} />,
      gradientFrom: `from-[${brandColor}]`,
      gradientTo: `to-[${brandColor}]`,
      bgGradient: `bg-gradient-to-r from-[${brandColor}]/10 to-[${brandColor}]/10`,
      shadowColor: `shadow-[${brandColor}]/20`,
      accentColor: `bg-[${brandColor}]`,
      textColor: `text-[${brandColor}]`,
      subsections: [
        { 
          name: 'Contracts', 
          icon: <FileText size={22} />, 
          color: `from-[${brandColor}]/80 to-[${brandColor}]`,
          bgColor: `bg-[${brandColor}]`,
          lightBg: `bg-[${brandColor}]/5`,
          textColor: `text-[${brandColor}]`,
          iconBg: `bg-gradient-to-br from-[${brandColor}]/80 to-[${brandColor}]`,
          metrics: [
            { label: 'Active', value: '23', trend: '+3' },
            { label: 'Expiring', value: '2', trend: '-1' }
          ],
          path: '/contracts',
          description: 'Vendor agreements and service contracts'
        },
        { 
          name: 'Projects', 
          icon: <BarChart2 size={22} />, 
          color: `from-[${brandColor}]/70 to-[${brandColor}]/90`,
          bgColor: `bg-[${brandColor}]`,
          lightBg: `bg-[${brandColor}]/5`,
          textColor: `text-[${brandColor}]`,
          iconBg: `bg-gradient-to-br from-[${brandColor}]/70 to-[${brandColor}]/90`,
          metrics: [
            { label: 'In Progress', value: '7', trend: '+1' },
            { label: 'Completed', value: '12', trend: '+2' }
          ],
          path: '/projects',
          description: 'Development and maintenance project tracking'
        },
        { 
          name: 'Asset Lifecycle', 
          icon: <PieChart size={22} />, 
          color: `from-[${brandColor}]/60 to-[${brandColor}]/80`,
          bgColor: `bg-[${brandColor}]`,
          lightBg: `bg-[${brandColor}]/5`,
          textColor: `text-[${brandColor}]`,
          iconBg: `bg-gradient-to-br from-[${brandColor}]/60 to-[${brandColor}]/80`,
          metrics: [
            { label: 'New Assets', value: '12', trend: '+5' },
            { label: 'Maintenance', value: '36', trend: '+2' }
          ],
          path: '/alm',
          description: 'Track assets throughout their lifecycle'
        },
        { 
          name: 'Security', 
          icon: <Shield size={22} />, 
          color: `from-[${brandColor}]/50 to-[${brandColor}]/70`,
          bgColor: `bg-[${brandColor}]`,
          lightBg: `bg-[${brandColor}]/5`,
          textColor: `text-[${brandColor}]`,
          iconBg: `bg-gradient-to-br from-[${brandColor}]/50 to-[${brandColor}]/70`,
          metrics: [
            { label: 'Alerts', value: '0', trend: '-3' },
            { label: 'Systems', value: '100%', trend: '0%' }
          ],
          path: '/security',
          description: 'Security systems monitoring and management'
        }
      ]
    }
  ];
  
  useEffect(() => {
    // Initialize animation states for all items
    const allAnimations = {};
    navigationCategories.forEach((category, catIndex) => {
      category.subsections.forEach((_, idx) => {
        allAnimations[`${catIndex}-${idx}`] = false;
      });
    });
    
    // Set timeout to animate items with a staggered effect
    const timeouts = [];
    navigationCategories.forEach((category, catIndex) => {
      category.subsections.forEach((_, idx) => {
        const timeout = setTimeout(() => {
          setAnimatedItems(prev => ({
            ...prev,
            [`${catIndex}-${idx}`]: true
          }));
        }, 100 + (catIndex * 100) + (idx * 150));
        timeouts.push(timeout);
      });
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const handleCardClick = (path) => {
    navigate(path);
  };

  const NavigationCard = ({ subsection, index, categoryIdx }) => {
    const isHovered = hoveredCard === `${categoryIdx}-${index}`;
    const hasAnimated = animatedItems[`${categoryIdx}-${index}`];
    
    return (
      <div 
        className={`relative bg-white dark:bg-gray-800 backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80 rounded-xl shadow-lg transition-all duration-500 cursor-pointer overflow-hidden h-full border border-gray-100 dark:border-gray-700
                  ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  ${isHovered ? `shadow-xl ${subsection.lightBg} dark:bg-gray-700 scale-105` : 'scale-100'}`}
        onMouseEnter={() => setHoveredCard(`${categoryIdx}-${index}`)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => handleCardClick(subsection.path)}
      >
        <div className={`h-1 bg-gradient-to-r ${subsection.color}`}></div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${subsection.iconBg} text-white shadow-lg shadow-${subsection.bgColor}/20 transform transition-transform duration-500 ${isHovered ? 'rotate-6 scale-110' : 'rotate-0'}`}>
              {subsection.icon}
            </div>
            
            <div className={`flex items-center justify-center transition-all duration-500 opacity-0 ${isHovered ? 'opacity-100 scale-100' : 'scale-0'}`}>
              <span className={`text-xs font-semibold ${subsection.textColor} mr-1`}>View</span>
              <ArrowRight className={`h-4 w-4 ${subsection.textColor}`} />
            </div>
          </div>
          
          <h3 className={`text-xl font-bold text-gray-800 dark:text-white mb-2 transition-transform duration-500 ${isHovered ? 'translate-x-2' : 'translate-x-0'}`}>
            {subsection.name}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{subsection.description}</p>
          
          {subsection.metrics && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {subsection.metrics.map((metric, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">{metric.value}</span>
                    <span className={`text-xs font-medium flex items-center ${metric.trend.startsWith('+') ? 'text-green-500' : metric.trend.startsWith('-') ? 'text-red-500' : 'text-gray-500'}`}>
                      {metric.trend}
                      {metric.trend.startsWith('+') && <TrendingUp className="ml-1 h-3 w-3" />}
                      {metric.trend.startsWith('-') && <TrendingUp className="ml-1 h-3 w-3 rotate-180" />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Main Content */}
        <main className="pb-6">
          <div className="mb-6">
            <h2 style={{ color: brandColor }} className="text-3xl font-bold mb-2">
              Operations Dashboard
            </h2>
            <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Sunday, March 16, 2025 • Daily Overview</span>
            </div>
          </div>
          
          {/* Show all sections without tabs */}
          {navigationCategories.map((category, categoryIdx) => (
            <div key={category.id} className="mb-10">
              <div className={`rounded-2xl p-5 mb-6 ${category.bgGradient} border border-${category.accentColor}/10`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradientFrom} ${category.gradientTo} text-white shadow-lg`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{category.title}</h3>
                    <p className={`text-sm ${category.textColor}`}>
                      {category.subsections.length} subsystems • Last updated: 2 hours ago
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.subsections.map((subsection, idx) => (
                  <NavigationCard 
                    key={idx}
                    subsection={subsection} 
                    index={idx} 
                    categoryIdx={categoryIdx} 
                  />
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </Layout>
  );
};

export default Index;
