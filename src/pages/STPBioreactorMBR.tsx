
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplet, FileText, Settings } from 'lucide-react';
import StatCard from '@/components/stp/StatCard';
import KpiCard from '@/components/stp/KpiCard';
import QualityParameterCard from '@/components/stp/QualityParameterCard';

const STPBioreactorMBR = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">STP Bioreactor MBR</h1>
            <p className="text-muted-foreground">
              Membrane Bioreactor System Performance & Monitoring
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Droplet className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="equipment">
              <Settings className="w-4 h-4 mr-2" />
              Equipment
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard 
                title="MBR Membrane Flow Rate" 
                value="142 m³/day" 
                subtext="Average over last 7 days" 
                icon={<Droplet />} 
                color="#3b82f6" 
              />
              <KpiCard 
                title="MLSS Concentration" 
                value="9,200 mg/L" 
                subtext="Operating within optimal range" 
                icon={<Droplet />} 
                color="#10b981" 
              />
              <KpiCard 
                title="Membrane TMP" 
                value="0.18 bar" 
                subtext="Steady performance" 
                icon={<Droplet />} 
                color="#6366f1" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <StatCard 
                title="Membrane Flux Rate" 
                value="22 LMH" 
                subtext="Standard flow conditions" 
              />
              <StatCard 
                title="DO in Aeration Tank" 
                value="2.6 mg/L" 
                subtext="Optimal for nitrification" 
              />
              <StatCard 
                title="F/M Ratio" 
                value="0.08 kg BOD/kg MLSS/day" 
                subtext="Extended aeration mode" 
              />
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Water Quality Parameters</h3>
                <div className="space-y-3">
                  <QualityParameterCard name="pH" value="7.2" target="6.5 - 7.5" status="optimal" />
                  <QualityParameterCard name="BOD₅" value="< 5 mg/L" target="< 10 mg/L" status="optimal" />
                  <QualityParameterCard name="COD" value="28 mg/L" target="< 50 mg/L" status="optimal" />
                  <QualityParameterCard name="TSS" value="< 2 mg/L" target="< 5 mg/L" status="optimal" />
                  <QualityParameterCard name="NH₄-N" value="1.8 mg/L" target="< 3 mg/L" status="optimal" />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">MBR Operation Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Membrane Age</span>
                    <span className="text-sm font-medium">15 months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last CIP</span>
                    <span className="text-sm font-medium">42 days ago</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Permeate Turbidity</span>
                    <span className="text-sm font-medium">0.2 NTU</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Membrane Recovery</span>
                    <span className="text-sm font-medium">98.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">System Uptime</span>
                    <span className="text-sm font-medium">99.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Daily Operational Reports</h3>
              <p className="text-muted-foreground mb-4">
                View and download operational reports for the MBR system
              </p>
              
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { date: "Mar 14, 2025", type: "Daily Operation", status: "Completed" },
                      { date: "Mar 13, 2025", type: "Daily Operation", status: "Completed" },
                      { date: "Mar 12, 2025", type: "Daily Operation", status: "Completed" },
                      { date: "Mar 11, 2025", type: "Daily Operation", status: "Completed" },
                      { date: "Mar 10, 2025", type: "Daily Operation", status: "Completed" },
                    ].map((report, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                          <a href="#" className="hover:underline">View</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="equipment" className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">MBR Equipment Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Membrane Modules</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Module 1</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Online</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Module 2</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Online</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Module 3</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Standby</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Pumps</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Feed Pump P-101</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Running</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Feed Pump P-102</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Standby</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Permeate Pump P-201</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Running</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Blowers</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Process Blower B-101</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Running</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Process Blower B-102</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Standby</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Membrane Scouring B-201</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Running</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Control Systems</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">PLC Controller</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Online</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">SCADA System</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Online</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Remote Monitoring</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default STPBioreactorMBR;
