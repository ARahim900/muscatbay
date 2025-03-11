import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, Clock, CheckCircle, AlertTriangle, Search, Droplet, Zap, Building, CheckSquare } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const Projects = () => {
  // Current date
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);
  
  // Project data
  const projectsData = [
    { id: 1, name: "BMS Administrative Access & Documentation Updates", status: "In Progress", category: "Infrastructure" },
    { id: 2, name: "Water System 2025", status: "Not Started", category: "Water" },
    { id: 3, name: "Technical Analysis: Direct Pump Supply vs Return Flow Options for New IRR Line Connection Between Controllers 08 & 09", status: "Not Started", category: "Water" },
    { id: 4, name: "Technical Justification: Optimal Connection Method for Controllers 08 & 09", status: "Not Started", category: "Water" },
    { id: 5, name: "RO Plant", status: "Not Started", category: "Water" },
    { id: 6, name: "Repair works of Gabion wall - SOW", status: "In Progress", category: "Infrastructure" },
    { id: 7, name: "Gabion Rectifications Works", status: "Not Started", category: "Infrastructure" },
    { id: 8, name: "Muscat Bay Sewage Maintenance Contract", status: "Not Started", category: "Water" },
    { id: 9, name: "PS/LS REQUEST FOR PROPOSAL (RFP)", status: "Not Started", category: "Water" },
    { id: 10, name: "PS4 Sewage System Upgrade Project: Addressing Critical Blockages", status: "Not Started", category: "Water" },
    { id: 11, name: "Analysis of Irrigation Controllers 8 & 9 - Water Overconsumption & Infrastructure Impact", status: "In Progress", category: "Water" },
    { id: 12, name: "IRR Controller 08 & 09 Leakes / Design Parameter Project", status: "In Progress", category: "Water" },
    { id: 13, name: "Pressure Vessel Installations", status: "Done", category: "Infrastructure" },
    { id: 14, name: "Village Square Project - Snagging Pending (OSCO)", status: "In Progress", category: "Infrastructure" },
    { id: 15, name: "Plan CIF Building - Electrical Segregation (Common & Kitchen)", status: "In Progress", category: "Electrical" },
    { id: 16, name: "Automated Swing Gate & ANPR System Integration at Muscat Bay – Technical Zone", status: "In Progress", category: "Security" },
    { id: 17, name: "Lagoon End: Drainage Channel Gabion - Technical Erosion Control Solutions for Muscat Bay", status: "In Progress", category: "Infrastructure" },
    { id: 18, name: "Muscat Bay Zone 8: Integrated Irrigation and Pumping System Implementation", status: "Done", category: "Water" },
    { id: 19, name: "Zen Project - Safa Buildings", status: "In Progress", category: "Infrastructure" },
    { id: 20, name: "Plan for Optimized Irrigation Solutions at Muscat Bay", status: "Done", category: "Water" },
    { id: 21, name: "Smart Meter Project: AMR Project Status Dashboard", status: "Done", category: "Electrical" },
    { id: 22, name: "Borewell Project - Z01", status: "Done", category: "Water" },
    { id: 23, name: "Riprap Damages Enhancement Project", status: "Done", category: "Infrastructure" },
    { id: 24, name: "SUB-Bulk Watermeter Installation with Chambers Constructions", status: "Done", category: "Water" },
    { id: 25, name: "Zone 5 Irrigation Line Connection Project Completion Report", status: "Done", category: "Water" },
    { id: 26, name: "New NEDC Electrical CT Meters Installation for all Buildings at Z01 Project", status: "Done", category: "Electrical" },
    { id: 27, name: "Lagoon Gate Valve and Chamber System Inefficiencies", status: "Done", category: "Water" },
    { id: 28, name: "Enhancing Muscat Bay Lagoon's Sustainability through Sediment Management Strategies", status: "Not Started", category: "Environment" },
    { id: 29, name: "New Irrigation Line Connection to Zone 08 IRR Tank Project", status: "Done", category: "Water" },
    { id: 30, name: "Adding Air Valves to Muscat Bay Potable Water Line", status: "Not Started", category: "Water" },
    { id: 31, name: "Staircase Enhancement with Door Installation at Zone 03 Main TRD", status: "Done", category: "Infrastructure" },
    { id: 32, name: "PRV Installation & Investigating Due to Defects", status: "Done", category: "Water" },
  ];

  // States
  const [filteredProjects, setFilteredProjects] = useState(projectsData);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Project stats
  const totalProjects = projectsData.length;
  const completedProjects = projectsData.filter(p => p.status === "Done").length;
  const inProgressProjects = projectsData.filter(p => p.status === "In Progress").length;
  const notStartedProjects = projectsData.filter(p => p.status === "Not Started").length;
  
  const completionRate = Math.round((completedProjects / totalProjects) * 100);
  
  // Category stats
  const categories = [...new Set(projectsData.map(p => p.category))];
  const categoryData = categories.map(cat => ({
    name: cat,
    count: projectsData.filter(p => p.category === cat).length
  }));
  
  // Status chart data
  const statusData = [
    { name: 'Done', value: completedProjects, color: '#68D1CC' }, // Using muscat-teal color
    { name: 'In Progress', value: inProgressProjects, color: '#D4B98C' }, // Using muscat-gold color
    { name: 'Not Started', value: notStartedProjects, color: '#9D8EB7' } // Using muscat-lavender color
  ];
  
  // Filter projects based on selected status, category and search term
  useEffect(() => {
    let filtered = projectsData;
    
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProjects(filtered);
  }, [selectedStatus, selectedCategory, searchTerm]);

  // Get status badge className
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Done':
        return 'bg-muscat-teal/20 text-muscat-teal';
      case 'In Progress':
        return 'bg-muscat-gold/20 text-muscat-gold';
      case 'Not Started':
        return 'bg-muscat-lavender/20 text-muscat-lavender';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-muscat-primary">Projects Dashboard</h1>
            <p className="text-sm text-muscat-primary/60">{formattedDate} • Project Overview</p>
          </div>
          <Button className="bg-muscat-primary hover:bg-muscat-primary/90">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Projects */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muscat-primary/70">Total Projects</CardTitle>
              <div className="h-8 w-8 rounded-full bg-muscat-primary/10 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-muscat-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muscat-primary">{totalProjects}</div>
            <p className="text-sm text-muscat-primary/60 mt-1">Across all categories</p>
          </CardContent>
        </Card>
        
        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muscat-primary/70">Completion Rate</CardTitle>
              <div className="h-8 w-8 rounded-full bg-muscat-teal/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-muscat-teal" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muscat-primary">{completionRate}%</div>
            <p className="text-sm text-muscat-primary/60 mt-1">{completedProjects} of {totalProjects} complete</p>
          </CardContent>
        </Card>
        
        {/* In Progress */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muscat-primary/70">In Progress</CardTitle>
              <div className="h-8 w-8 rounded-full bg-muscat-gold/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-muscat-gold" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muscat-primary">{inProgressProjects}</div>
            <p className="text-sm text-muscat-primary/60 mt-1">Projects in active development</p>
          </CardContent>
        </Card>
        
        {/* Not Started */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muscat-primary/70">Not Started</CardTitle>
              <div className="h-8 w-8 rounded-full bg-muscat-lavender/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-muscat-lavender" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muscat-primary">{notStartedProjects}</div>
            <p className="text-sm text-muscat-primary/60 mt-1">Awaiting initiation</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-muscat-primary">Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Projects by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-muscat-primary">Projects by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{fontSize: 12}}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4E4456" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Projects Table */}
      <Card className="mb-6">
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle className="text-lg font-medium text-muscat-primary">Project List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muscat-primary/50" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-muscat-primary/20 focus:border-muscat-primary/20"
              >
                <option value="All">All Statuses</option>
                <option value="Done">Done</option>
                <option value="In Progress">In Progress</option>
                <option value="Not Started">Not Started</option>
              </select>
              
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-muscat-primary/20 focus:border-muscat-primary/20"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-muscat-primary/70 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muscat-primary/70 uppercase tracking-wider">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muscat-primary/70 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muscat-primary/70 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muscat-primary/70 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-muscat-light border-b">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-muscat-primary">{project.id}</td>
                  <td className="px-6 py-4 text-sm text-muscat-primary/80 max-w-md truncate">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muscat-primary/80">{project.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button variant="ghost" size="sm" className="text-muscat-primary/80 hover:text-muscat-primary">View</Button>
                    <Button variant="ghost" size="sm" className="text-muscat-primary/80 hover:text-muscat-primary">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        
        <CardFooter className="border-t">
          <p className="text-sm text-muscat-primary/60">
            Showing {filteredProjects.length} of {totalProjects} projects
          </p>
        </CardFooter>
      </Card>
      
      {/* Project Overview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle className="text-lg font-medium text-muscat-primary">Project Overview</CardTitle>
            <div className="text-sm text-muscat-primary/60">
              Last Updated: Today, {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Water Projects */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Droplet className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="font-medium text-muscat-primary">Water Projects</p>
                <p className="text-sm text-muscat-primary/60">{projectsData.filter(p => p.category === 'Water').length} projects</p>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-muscat-teal mr-2"></div>
                  <p className="text-xs text-muscat-primary/60">{projectsData.filter(p => p.category === 'Water' && p.status === 'Done').length} Complete</p>
                </div>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-muscat-gold mr-2"></div>
                  <p className="text-xs text-muscat-primary/60">{projectsData.filter(p => p.category === 'Water' && p.status === 'In Progress').length} In Progress</p>
                </div>
              </div>
            </div>
            
            {/* Electrical Projects */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div>
                <p className="font-medium text-muscat-primary">Electrical Projects</p>
                <p className="text-sm text-muscat-primary/60">{projectsData.filter(p => p.category === 'Electrical').length} projects</p>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-muscat-teal mr-2"></div>
                  <p className="text-xs text-muscat-primary/60">{projectsData.filter(p => p.category === 'Electrical' && p.status === 'Done').length} Complete</p>
                </div>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-muscat-gold mr-2"></div>
                  <p className="text-xs text-muscat-primary/60">{projectsData.filter(p => p.category === 'Electrical' && p.status === 'In Progress').length} In Progress</p>
                </div>
              </div>
            </div>
            
            {/* Infrastructure Projects */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Building className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div>
                <p className="font-medium text-muscat-primary">Infrastructure</p>
                <p className="text-sm text-muscat-primary/60">{projectsData.filter(p => p.category === 'Infrastructure').length} projects</p>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-muscat-teal mr-2"></div>
                  <p className="text-xs text-muscat-primary/60">{projectsData.filter(p => p.category === 'Infrastructure' && p.status === 'Done').length} Complete</p>
                </div>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-muscat-gold mr-2"></div>
                  <p className="text-xs text-muscat-primary/60">{projectsData.filter(p => p.category === 'Infrastructure' && p.status === 'In Progress').length} In Progress</p>
                </div>
              </div>
            </div>
            
            {/* Other Projects */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div>
                <p className="font-medium text-muscat-primary">Other Categories</p>
                <p className="text-sm text-muscat-primary/60">{projectsData.filter(p => !['Water', 'Electrical', 'Infrastructure'].includes(p.category)).length} projects</p>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-muscat-teal mr-2"></div>
                  <p className="text-xs text-muscat-primary/60">{projectsData.filter(p => !['Water', 'Electrical', 'Infrastructure'].includes(p.category) && p.status === 'Done').length} Complete</p>
                </div>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-muscat-gold mr-2"></div>
                  <p className="text-xs text-muscat-primary/60">{projectsData.filter(p => !['Water', 'Electrical', 'Infrastructure'].includes(p.category) && p.status === 'In Progress').length} In Progress</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Projects;
