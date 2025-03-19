
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2, Save, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { STPDailyData } from '@/types/stp';

const STPDataAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<STPDailyData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const form = useForm<STPDailyData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      tankerTrips: 0,
      expectedVolumeTankers: 0,
      directSewageMB: 0,
      totalInfluent: 0,
      totalWaterProcessed: 0,
      tseToIrrigation: 0,
    }
  });

  useEffect(() => {
    fetchSTPData();
  }, []);

  const fetchSTPData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('stp_daily_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      setRecords(data?.map(item => ({
        ...item,
        date: item.date,
        tankerTrips: item.tanker_trips,
        expectedVolumeTankers: item.expected_volume_tankers,
        directSewageMB: item.direct_sewage_mb,
        totalInfluent: item.total_influent,
        totalWaterProcessed: item.total_water_processed,
        tseToIrrigation: item.tse_to_irrigation,
      })) || []);
    } catch (error: any) {
      console.error('Error fetching STP data:', error);
      toast.error('Failed to load STP data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: STPDailyData) => {
    setEditingId(record.date);
    form.reset({
      date: record.date,
      tankerTrips: record.tankerTrips,
      expectedVolumeTankers: record.expectedVolumeTankers,
      directSewageMB: record.directSewageMB,
      totalInfluent: record.totalInfluent,
      totalWaterProcessed: record.totalWaterProcessed,
      tseToIrrigation: record.tseToIrrigation,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const handleDelete = async (date: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    try {
      const { error } = await supabase
        .from('stp_daily_data')
        .delete()
        .eq('date', date);
        
      if (error) throw error;
      
      toast.success('Record deleted successfully');
      fetchSTPData();
    } catch (error: any) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleSubmit = async (formData: STPDailyData) => {
    try {
      const dataToSave = {
        date: formData.date,
        tanker_trips: formData.tankerTrips,
        expected_volume_tankers: formData.expectedVolumeTankers,
        direct_sewage_mb: formData.directSewageMB,
        total_influent: formData.totalInfluent,
        total_water_processed: formData.totalWaterProcessed,
        tse_to_irrigation: formData.tseToIrrigation,
      };
      
      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('stp_daily_data')
          .update(dataToSave)
          .eq('date', editingId);
          
        if (error) throw error;
        
        toast.success('Record updated successfully');
      } else {
        // Check if record with this date already exists
        const { data: existingRecord } = await supabase
          .from('stp_daily_data')
          .select('date')
          .eq('date', formData.date)
          .single();
          
        if (existingRecord) {
          toast.error('A record for this date already exists');
          return;
        }
        
        // Add new record
        const { error } = await supabase
          .from('stp_daily_data')
          .insert(dataToSave);
          
        if (error) throw error;
        
        toast.success('Record added successfully');
      }
      
      setEditingId(null);
      setShowAddForm(false);
      form.reset();
      fetchSTPData();
    } catch (error: any) {
      console.error('Error saving record:', error);
      toast.error(`Failed to save record: ${error.message}`);
    }
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingId(null);
    form.reset({
      date: new Date().toISOString().split('T')[0],
      tankerTrips: 0,
      expectedVolumeTankers: 0,
      directSewageMB: 0,
      totalInfluent: 0,
      totalWaterProcessed: 0,
      tseToIrrigation: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">STP Daily Records</h2>
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
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            disabled={!!editingId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tankerTrips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanker Trips</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expectedVolumeTankers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Volume Tankers (m³)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="directSewageMB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direct Sewage MB (m³)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalInfluent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Influent (m³)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalWaterProcessed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Water Processed (m³)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tseToIrrigation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TSE to Irrigation (m³)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                <TableHead>Date</TableHead>
                <TableHead>Tanker Trips</TableHead>
                <TableHead>Direct Sewage (m³)</TableHead>
                <TableHead>Total Influent (m³)</TableHead>
                <TableHead>Water Processed (m³)</TableHead>
                <TableHead>TSE to Irrigation (m³)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.date}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.tankerTrips}</TableCell>
                    <TableCell>{record.directSewageMB?.toFixed(2)}</TableCell>
                    <TableCell>{record.totalInfluent?.toFixed(2)}</TableCell>
                    <TableCell>{record.totalWaterProcessed?.toFixed(2)}</TableCell>
                    <TableCell>{record.tseToIrrigation?.toFixed(2)}</TableCell>
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
                          onClick={() => handleDelete(record.date)}
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

export default STPDataAdmin;
