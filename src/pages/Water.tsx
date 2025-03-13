
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Github, Droplets, FileBarChart, Gauge } from 'lucide-react';
import ImportWaterData from '@/components/water/ImportWaterData';

const Water = () => {
  useEffect(() => {
    document.title = 'Water Management | Muscat Bay Asset Manager';
  }, []);

  return (
    <Layout>
      <div className="w-full">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Water Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Droplets className="mr-2 h-6 w-6" />
                Water Dashboard 2024
              </CardTitle>
              <CardDescription>
                Access the source code and documentation for the 2024 Water Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This repository contains all the necessary code, documentation, and resources
                for managing the Water operations at Muscat Bay for the year 2024.
              </p>
              <Button 
                onClick={() => window.open('https://github.com/ARahim900/water-dashboard-24.git', '_blank')}
                className="flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open GitHub Repository
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Github className="mr-2 h-6 w-6" />
                Water Dashboard 2025
              </CardTitle>
              <CardDescription>
                Access the source code and documentation for the 2025 Water Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This repository contains all the necessary code, documentation, and resources
                for managing the Water operations at Muscat Bay for the year 2025.
              </p>
              <Button 
                onClick={() => window.open('https://github.com/ARahim900/water-dashboard-25.git', '_blank')}
                className="flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open GitHub Repository
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Droplets className="mr-2 h-6 w-6" />
                Water Distribution Dashboard
              </CardTitle>
              <CardDescription>
                View and analyze the water distribution system across Muscat Bay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The Water Distribution Dashboard provides comprehensive analysis of water consumption,
                losses, and distribution patterns across different zones in Muscat Bay.
              </p>
              <Button 
                asChild
                className="flex items-center"
              >
                <Link to="/water-distribution">
                  <Gauge className="mr-2 h-4 w-4" />
                  Open Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <FileBarChart className="mr-2 h-6 w-6 text-blue-600" />
                Water Consumption by Type
              </CardTitle>
              <CardDescription className="text-blue-600">
                Analyze water consumption patterns by different meter types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-blue-700">
                This dashboard provides detailed analytics on water consumption across different consumer types,
                including retail, residential, irrigation services, and more.
              </p>
              <Button 
                asChild
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link to="/water-consumption-types">
                  <FileBarChart className="mr-2 h-4 w-4" />
                  View Consumption Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <Droplets className="mr-2 h-6 w-6 text-green-600" />
                Water Conservation Initiatives
              </CardTitle>
              <CardDescription className="text-green-600">
                Track water-saving initiatives and conservation efforts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-green-700">
                Monitor ongoing water conservation projects and their impact on reducing water consumption
                and improving sustainability across Muscat Bay properties.
              </p>
              <Button 
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-50"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <ImportWaterData />
      </div>
    </Layout>
  );
};

export default Water;
