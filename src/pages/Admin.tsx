
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WaterDataAdmin from '@/components/admin/WaterDataAdmin';
import STPDataAdmin from '@/components/admin/STPDataAdmin';
import UserManagement from '@/components/admin/UserManagement';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

// List of admin emails - add more emails here if needed
const ADMIN_EMAILS = ["aalbalushi@muscatbay.com"];

const AdminPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      // Check if the user email is in the admin emails list
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        console.log("Admin access granted to:", user.email);
        setIsAuthorized(true);
        toast.success("Welcome to the admin dashboard!");
      } else {
        console.log("Admin access denied for:", user.email);
        toast.error("You don't have permission to access the admin page.");
        setIsAuthorized(false);
      }
    } else if (!loading && !user) {
      // User is not logged in
      toast.error("Please log in to access the admin page");
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-muscat-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If not authorized but authenticated, show access denied page
  if (!isAuthorized && user) {
    return (
      <Layout>
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle>Access Denied</CardTitle>
                </div>
                <CardDescription>
                  You don't have permission to access the admin dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    Your current email ({user.email}) is not authorized to view the admin area.
                    Only administrators can access this page.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you believe this is an error, please contact the system administrator.
                  </p>
                  <Button onClick={() => navigate("/")} className="w-full">
                    Return to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-muscat-primary">Admin Dashboard</h1>
            <p className="text-sm text-muscat-primary/60">
              Manage data and users for Muscat Bay utilities
            </p>
          </div>
        </div>

        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Administration Panel</CardTitle>
            <CardDescription>
              View and manage system data. Changes made here will be reflected throughout the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="water" className="w-full">
              <TabsList className="mb-6 flex flex-wrap">
                <TabsTrigger value="water">Water Data</TabsTrigger>
                <TabsTrigger value="stp">STP Data</TabsTrigger>
                <TabsTrigger value="electricity">Electricity Data</TabsTrigger>
                <TabsTrigger value="contracts">Contracts Data</TabsTrigger>
                <TabsTrigger value="hvac">HVAC Data</TabsTrigger>
                <TabsTrigger value="projects">Projects Data</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="water" className="space-y-4">
                <WaterDataAdmin />
              </TabsContent>
              
              <TabsContent value="stp" className="space-y-4">
                <STPDataAdmin />
              </TabsContent>
              
              <TabsContent value="electricity" className="space-y-4">
                <PlaceholderAdmin title="Electricity Data" />
              </TabsContent>
              
              <TabsContent value="contracts" className="space-y-4">
                <PlaceholderAdmin title="Contracts Data" />
              </TabsContent>
              
              <TabsContent value="hvac" className="space-y-4">
                <PlaceholderAdmin title="HVAC Data" />
              </TabsContent>
              
              <TabsContent value="projects" className="space-y-4">
                <PlaceholderAdmin title="Projects Data" />
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                <UserManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// Placeholder component for sections that haven't been implemented yet
const PlaceholderAdmin: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
      <h3 className="text-xl font-semibold mb-2">{title} Management</h3>
      <p className="text-muted-foreground text-center mb-4">
        This administration section is under development. It will allow you to view and manage {title.toLowerCase()}.
      </p>
      <div className="text-sm text-muted-foreground">
        Coming soon!
      </div>
    </div>
  );
};

export default AdminPage;
