
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2, Save, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface WaterRecord {
  id: number;
  meter_label: string;
  account_number: string;
  zone: string;
  type: string;
  parent_meter?: string;
  [key: string]: any; // For monthly consumption fields
}

const months = [
  'jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 
  'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24',
  'jan_25', 'feb_25'
];

const WaterDataAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<WaterRecord[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [zones, setZones] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  
  const form = useForm<WaterRecord>({
    defaultValues: {
      meter_label: '',
      account_number: '',
      zone: '',
      type: '',
      parent_meter: '',
    }
  });

  useEffect(() => {
    fetchWaterData();
  }, []);

  const fetchWaterData = async () => {
    try {
      setLoading(true);
      
      // Fetch water distribution data
      const { data, error } = await supabase
        .from('water_distribution_master')
        .select('*')
        .order('id', { ascending: true });
        
      if (error) throw error;
      
      setRecords(data || []);
      
      // Extract unique zones and types for dropdowns
      if (data) {
        const uniqueZones = [...new Set(data.map(item => item.zone))].filter(Boolean);
        const uniqueTypes = [...new Set(data.map(item => item.type))].filter(Boolean);
        setZones(uniqueZones);
        setTypes(uniqueTypes);
      }
    } catch (error: any) {
      console.error('Error fetching water data:', error);
      toast.error('Failed to load water data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: WaterRecord) => {
    setEditingId(record.id);
    form.reset(record);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    try {
      const { error } = await supabase
        .from('water_distribution_master')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Record deleted successfully');
      fetchWaterData();
    } catch (error: any) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleSubmit = async (data: WaterRecord) => {
    try {
      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('water_distribution_master')
          .update(data)
          .eq('id', editingId);
          
        if (error) throw error;
        
        toast.success('Record updated successfully');
      } else {
        // Add new record
        const { error } = await supabase
          .from('water_distribution_master')
          .insert(data);
          
        if (error) throw error;
        
        toast.success('Record added successfully');
      }
      
      setEditingId(null);
      setShowAddForm(false);
      form.reset();
      fetchWaterData();
    } catch (error: any) {
      console.error('Error saving record:', error);
      toast.error(`Failed to save record: ${error.message}`);
    }
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingId(null);
    form.reset({
      meter_label: '',
      account_number: '',
      zone: '',
      type: '',
      parent_meter: '',
    });
  };

  const formatConsumption = (value: any) => {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Water Meter Records</h2>
        <Button onClick={handleAddNew} disabled={showAddForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Record
        </Button>
      </div>

      {(showAddForm || editingId !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Record' : 'Add New Record'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="meter_label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meter Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter meter label" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {zones.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                            <SelectItem value="new">+ Add New Zone</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {types.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                            <SelectItem value="new">+ Add New Type</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="parent_meter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Meter</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter parent meter (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <h3 className="text-md font-medium mt-4">Consumption Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {months.map((month) => (
                    <FormField
                      key={month}
                      control={form.control}
                      name={month}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{month.replace('_', ' ').toUpperCase()}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingId(null);
                      form.reset();
                    }}
                  >
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meter Label</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Jan 24</TableHead>
                <TableHead>Feb 24</TableHead>
                <TableHead>Mar 24</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.meter_label}</TableCell>
                    <TableCell>{record.account_number}</TableCell>
                    <TableCell>{record.zone}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{formatConsumption(record.jan_24)}</TableCell>
                    <TableCell>{formatConsumption(record.feb_24)}</TableCell>
                    <TableCell>{formatConsumption(record.mar_24)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleEdit(record)}
                          disabled={editingId !== null}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-red-500"
                          onClick={() => handleDelete(record.id)}
                          disabled={editingId !== null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default WaterDataAdmin;
