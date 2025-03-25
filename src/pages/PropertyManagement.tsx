
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Search, Home, Users, FileText, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

// Types
interface PropertyUnit {
  id: string;
  unit_no: string;
  sector: string;
  property_type: string;
  status: string;
  unit_type: string;
  bua: number;
  plot_size: number;
  unit_value: number;
  handover_date: string | null;
  anticipated_handover_date: string | null;
}

interface PropertyOwner {
  id: string;
  client_name: string;
  client_name_arabic: string | null;
  email: string | null;
  nationality: string | null;
  region: string | null;
  date_of_birth: string | null;
}

interface PropertyTransaction {
  id: string;
  property_id: string;
  owner_id: string;
  spa_date: string | null;
  property: PropertyUnit;
  owner: PropertyOwner;
}

interface PropertyStatusSummary {
  status: string;
  count: number;
  total_value: number;
  avg_size: number;
}

interface PropertyTypeSummary {
  unit_type: string;
  count: number;
  total_value: number;
  avg_size: number;
}

interface PropertySectorSummary {
  sector: string;
  count: number;
  total_value: number;
  avg_size: number;
}

interface OwnerNationalitySummary {
  nationality: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const PropertyManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  
  // Data states
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [transactions, setTransactions] = useState<PropertyTransaction[]>([]);
  const [statusSummary, setStatusSummary] = useState<PropertyStatusSummary[]>([]);
  const [typeSummary, setTypeSummary] = useState<PropertyTypeSummary[]>([]);
  const [sectorSummary, setSectorSummary] = useState<PropertySectorSummary[]>([]);
  const [nationalitySummary, setNationalitySummary] = useState<OwnerNationalitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch property units
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('property_units')
          .select('*');
        
        if (propertiesError) throw propertiesError;
        setProperties(propertiesData);

        // Fetch transactions with property and owner details
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('property_transactions')
          .select(`
            id,
            property_id,
            owner_id,
            spa_date,
            property:property_id(id, unit_no, sector, property_type, status, unit_type, bua, plot_size, unit_value),
            owner:owner_id(id, client_name, client_name_arabic, email, nationality, region, date_of_birth)
          `);
        
        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData);

        // Fetch summary data
        const { data: statusData, error: statusError } = await supabase
          .from('property_by_status')
          .select('*');
        
        if (statusError) throw statusError;
        setStatusSummary(statusData);

        const { data: typeData, error: typeError } = await supabase
          .from('property_by_type')
          .select('*');
        
        if (typeError) throw typeError;
        setTypeSummary(typeData);

        const { data: sectorData, error: sectorError } = await supabase
          .from('property_by_sector')
          .select('*');
        
        if (sectorError) throw sectorError;
        setSectorSummary(sectorData);

        const { data: nationalityData, error: nationalityError } = await supabase
          .from('owners_by_nationality')
          .select('*');
        
        if (nationalityError) throw nationalityError;
        setNationalitySummary(nationalityData);

      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error loading data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesSearch = searchTerm === "" || 
      property.unit_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.unit_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "" || property.status === statusFilter;
    const matchesSector = sectorFilter === "" || property.sector === sectorFilter;

    return matchesSearch && matchesStatus && matchesSector;
  });

  // Get unique status values for filter
  const statusOptions = [...new Set(properties.map(p => p.status))].filter(Boolean);
  const sectorOptions = [...new Set(properties.map(p => p.sector))].filter(Boolean);

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold">Property Management</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="owners">Owners</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{properties.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sold Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {properties.filter(p => p.status === "Sold").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Units</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {properties.filter(p => p.status === "Inventory").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(properties.reduce((sum, p) => sum + (p.unit_value || 0), 0), 'OMR')}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Properties by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusSummary}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [value, name === "total_value" ? "Total Value" : "Count"]} />
                      <Legend />
                      <Bar dataKey="count" name="Number of Properties" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Properties by Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorSummary}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="sector"
                      >
                        {sectorSummary.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [value, props.payload.sector]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Property Units</CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search units..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={sectorFilter}
                      onValueChange={setSectorFilter}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Sectors</SelectItem>
                        {sectorOptions.map(sector => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm mb-4">
                Showing: {filteredProperties.length} of {properties.length} properties
              </div>
              
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit No</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Unit Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>BUA (m²)</TableHead>
                      <TableHead>Plot Size (m²)</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading property data...
                        </TableCell>
                      </TableRow>
                    ) : filteredProperties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No properties found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProperties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">{property.unit_no}</TableCell>
                          <TableCell>{property.sector}</TableCell>
                          <TableCell>{property.unit_type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                property.status === "Sold" ? "success" :
                                property.status === "Reserved" ? "warning" :
                                property.status === "Inventory" ? "default" : 
                                "outline"
                              }
                            >
                              {property.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{property.bua}</TableCell>
                          <TableCell>{property.plot_size}</TableCell>
                          <TableCell>
                            {property.unit_value ? formatCurrency(property.unit_value, 'OMR') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Property Owners</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search owners..."
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Owners by Nationality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={nationalitySummary}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="nationality"
                          >
                            {nationalitySummary.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name, props) => [value, props.payload.nationality]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nationalitySummary.map((item) => {
                        const totalOwners = nationalitySummary.reduce((sum, nat) => sum + nat.count, 0);
                        const percentage = (item.count / totalOwners) * 100;
                        
                        return (
                          <TableRow key={item.nationality}>
                            <TableCell>{item.nationality || 'Unknown'}</TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell>{percentage.toFixed(2)}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Properties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading owner data...
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No owners found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Group transactions by owner_id and display each owner once
                      Object.values(transactions.reduce((acc, trans) => {
                        if (!acc[trans.owner_id]) {
                          acc[trans.owner_id] = {
                            ...trans.owner,
                            propertyCount: 1
                          };
                        } else {
                          acc[trans.owner_id].propertyCount++;
                        }
                        return acc;
                      }, {} as Record<string, any>)).map((owner: any) => (
                        <TableRow key={owner.id}>
                          <TableCell className="font-medium">{owner.client_name}</TableCell>
                          <TableCell>{owner.nationality || '-'}</TableCell>
                          <TableCell>{owner.region || '-'}</TableCell>
                          <TableCell>{owner.email || '-'}</TableCell>
                          <TableCell>{owner.propertyCount}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Property Transactions</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit No</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>SPA Date</TableHead>
                      <TableHead>Property Type</TableHead>
                      <TableHead>Unit Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading transaction data...
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.property.unit_no}</TableCell>
                          <TableCell>{transaction.owner.client_name}</TableCell>
                          <TableCell>{transaction.spa_date ? new Date(transaction.spa_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{transaction.property.unit_type}</TableCell>
                          <TableCell>
                            {transaction.property.unit_value ? 
                              formatCurrency(transaction.property.unit_value, 'OMR') : 
                              '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyManagement;
