
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WaterDataAdmin from '@/components/admin/WaterDataAdmin';
import STPDataAdmin from '@/components/admin/STPDataAdmin';
import UserManagement from '@/components/admin/UserManagement';
import { toast } from 'sonner';

const ADMIN_EMAIL = "aalbalushi@muscatbay.com";

const AdminPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    if (user && !loading) {
      // Check if the user email matches the admin email
      if (user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      } else {
        toast.error("You don't have permission to access the admin page.");
        setIsAuthorized(false);
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-muscat-primary"></div>
      </div>
    );
  }

  // If not authenticated or not authorized, redirect to home
  if (!user || !isAuthorized) {
    return <Navigate to="/" replace />;
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
              <TabsList className="mb-6">
                <TabsTrigger value="water">Water Data</TabsTrigger>
                <TabsTrigger value="stp">STP Data</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="water" className="space-y-4">
                <WaterDataAdmin />
              </TabsContent>
              
              <TabsContent value="stp" className="space-y-4">
                <STPDataAdmin />
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

export default AdminPage;
