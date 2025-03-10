
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Github } from 'lucide-react';

const STP = () => {
  useEffect(() => {
    document.title = 'STP Plant | Muscat Bay Asset Manager';
  }, []);

  const handleRedirect = () => {
    window.open('https://github.com/ARahim900/stp', '_blank');
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">STP Plant Management</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Github className="mr-2 h-6 w-6" />
              STP Plant Management Repository
            </CardTitle>
            <CardDescription>
              Access the source code and documentation for the STP Plant management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This section connects to the STP Plant management GitHub repository. 
              The repository contains all the necessary code, documentation, and resources
              for managing the STP Plant operations at Muscat Bay.
            </p>
            <Button 
              onClick={handleRedirect}
              className="flex items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open GitHub Repository
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default STP;
