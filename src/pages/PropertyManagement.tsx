
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileSpreadsheet, BarChart2 } from 'lucide-react';
import { PropertyUnit, PropertyOwner, PropertyTransaction } from '@/types/expenses';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const PropertyManagement: React.FC = () => {
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [transactions, setTransactions] = useState<PropertyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('properties');

  useEffect(() => {
    // Simulate fetching data from API
    setTimeout(() => {
      // Sample property data
      const sampleProperties: PropertyUnit[] = [
        { id: '1', unit_no: 'Z5 001', sector: 'Nameer', property_type: 'Residential', status: 'Sold', unit_type: '4 Bedroom Nameer Villa', bua: 497.62, plot_size: 770, unit_value: 441000, handover_date: null, anticipated_handover_date: null },
        { id: '2', unit_no: 'Z5 003', sector: 'Nameer', property_type: 'Residential', status: 'Sold', unit_type: '4 Bedroom Nameer Villa', bua: 497.62, plot_size: 769, unit_value: 379000, handover_date: '2024-02-07', anticipated_handover_date: null },
        { id: '3', unit_no: 'Z5 005', sector: 'Nameer', property_type: 'Residential', status: 'Sold', unit_type: '4 Bedroom Nameer Villa', bua: 497.62, plot_size: 770, unit_value: 390000, handover_date: null, anticipated_handover_date: null },
        { id: '4', unit_no: 'Z5 010', sector: 'Nameer', property_type: 'Residential', status: 'Sold', unit_type: '4 Bedroom Nameer Villa', bua: 497.62, plot_size: 769, unit_value: 385000, handover_date: null, anticipated_handover_date: null },
        { id: '5', unit_no: 'Z3 060(6)', sector: 'Zaha', property_type: 'Residential', status: 'Sold', unit_type: '3 Bedroom Zaha Apartment', bua: 361.42, plot_size: 1233, unit_value: 310000, handover_date: null, anticipated_handover_date: null },
        { id: '6', unit_no: 'Z8 001', sector: 'Wajd', property_type: 'Residential', status: 'Inventory', unit_type: '5 Bedroom Wajd Villa', bua: 750.35, plot_size: 1441.6, unit_value: 600000, handover_date: null, anticipated_handover_date: null },
      ];

      // Sample owner data
      const sampleOwners: PropertyOwner[] = [
        { id: '1', client_name: 'ROXANA MESHGINNAFAS', client_name_arabic: 'روكسانا مشغينافاس', email: 'nahel.elsheikh@gmail.com', nationality: 'Iranian', region: 'MENA', date_of_birth: '1977-10-15' },
        { id: '2', client_name: 'Rocky Hamilton Parker', client_name_arabic: 'روكي هاميلتون باركر', email: 'parker.oman1967@gmail.com', nationality: 'Pakistani', region: 'Asia', date_of_birth: '1967-09-30' },
        { id: '3', client_name: 'RENJIE WANG', client_name_arabic: 'رينجي وانج', email: 'renjiewang969@gmail.com', nationality: 'Chinese', region: null, date_of_birth: '1997-01-04' },
        { id: '4', client_name: 'Oleg Andreev', client_name_arabic: 'اوليج اندريف', email: 'aou1973@icloud.com', nationality: 'Russian', region: 'Asia', date_of_birth: '1963-07-30' },
        { id: '5', client_name: 'SBJ', client_name_arabic: 'سرايا بندر الجصة', email: null, nationality: null, region: null, date_of_birth: null },
      ];

      // Sample transaction data
      const sampleTransactions: PropertyTransaction[] = [
        {
          id: '1',
          property_id: '1',
          owner_id: '1',
          spa_date: '2023-10-15',
          property: sampleProperties[0],
          owner: sampleOwners[0]
        },
        {
          id: '2',
          property_id: '2',
          owner_id: '2',
          spa_date: '2023-11-20',
          property: sampleProperties[1],
          owner: sampleOwners[1]
        },
        {
          id: '3',
          property_id: '3',
          owner_id: '3',
          spa_date: '2023-12-05',
          property: sampleProperties[2],
          owner: sampleOwners[2]
        },
        {
          id: '4',
          property_id: '5',
          owner_id: '4',
          spa_date: '2024-01-10',
          property: sampleProperties[4],
          owner: sampleOwners[3]
        },
      ];

      setProperties(sampleProperties);
      setOwners(sampleOwners);
      setTransactions(sampleTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredProperties = properties.filter(property => 
    property.unit_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.unit_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOwners = owners.filter(owner => 
    owner.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (owner.nationality && owner.nationality.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (owner.email && owner.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTransactions = transactions.filter(transaction => 
    transaction.property.unit_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.owner.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container py-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Management</h1>
          <p className="text-muted-foreground">Manage all property assets and ownership records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all zones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{owners.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sold Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.filter(p => p.status === 'Sold').length}</div>
            <p className="text-xs text-muted-foreground mt-1">{((properties.filter(p => p.status === 'Sold').length / properties.length) * 100).toFixed(1)}% of total inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(properties.reduce((acc, p) => acc + p.unit_value, 0) / 1000).toFixed(0)}K OMR</div>
            <p className="text-xs text-muted-foreground mt-1">Combined property value</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="w-full max-w-sm">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <Input
            id="search"
            placeholder="Search properties, owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button variant="outline">Export Data</Button>
      </div>

      <Tabs defaultValue="properties" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Properties</span>
          </TabsTrigger>
          <TabsTrigger value="owners" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Owners</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Inventory</CardTitle>
              <CardDescription>All registered properties in Muscat Bay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit No</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Unit Type</TableHead>
                      <TableHead>BUA (sqm)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Value (OMR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.unit_no}</TableCell>
                        <TableCell>{property.sector}</TableCell>
                        <TableCell>{property.unit_type}</TableCell>
                        <TableCell>{property.bua.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            property.status === 'Sold' ? 'bg-green-100 text-green-800' : 
                            property.status === 'Reserved' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {property.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{property.unit_value.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Owners</CardTitle>
              <CardDescription>All registered property owners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Arabic Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Region</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOwners.map((owner) => (
                      <TableRow key={owner.id}>
                        <TableCell className="font-medium">{owner.client_name}</TableCell>
                        <TableCell>{owner.client_name_arabic || '-'}</TableCell>
                        <TableCell>{owner.email || '-'}</TableCell>
                        <TableCell>{owner.nationality || '-'}</TableCell>
                        <TableCell>{owner.region || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Transactions</CardTitle>
              <CardDescription>All property sale & transfer records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Transaction Date</TableHead>
                      <TableHead>Property Type</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.property.unit_no}</TableCell>
                        <TableCell>{transaction.owner.client_name}</TableCell>
                        <TableCell>{transaction.spa_date ? new Date(transaction.spa_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{transaction.property.unit_type}</TableCell>
                        <TableCell className="text-right">{transaction.property.unit_value.toLocaleString()} OMR</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Analytics</CardTitle>
              <CardDescription>Data insights and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Analytics dashboard will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyManagement;
