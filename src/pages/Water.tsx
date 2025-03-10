
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Github } from 'lucide-react';

const Water = () => {
  useEffect(() => {
    document.title = 'Water Management | Muscat Bay Asset Manager';
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Water Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Github className="mr-2 h-6 w-6" />
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
        </div>
      </div>
    </Layout>
  );
};

export default Water;
