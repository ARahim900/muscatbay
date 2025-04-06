
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, UploadCloud, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Schema for electricity meter data entry
const electricityMeterSchema = z.object({
  month: z.string({
    required_error: "Month is required",
  }),
  meterName: z.string().min(1, "Meter name is required"),
  meterAccountNo: z.string().min(1, "Meter account number is required"),
  type: z.string().min(1, "Type is required"),
  zone: z.string().min(1, "Zone is required"),
  consumption: z.coerce.number().min(0, "Consumption cannot be negative"),
});

// Schema for bulk import
const bulkImportSchema = z.object({
  importData: z.string().min(1, "Import data is required"),
});

type ElectricityMeterFormValues = z.infer<typeof electricityMeterSchema>;
type BulkImportFormValues = z.infer<typeof bulkImportSchema>;

const ElectricityDataEntryForm = () => {
  const [activeTab, setActiveTab] = useState<string>("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parseSuccess, setParseSuccess] = useState(false);
  
  // Form for individual meter entry
  const meterForm = useForm<ElectricityMeterFormValues>({
    resolver: zodResolver(electricityMeterSchema),
    defaultValues: {
      month: '2025-03', // Default to March 2025
      meterName: '',
      meterAccountNo: '',
      type: '',
      zone: '',
      consumption: 0,
    },
  });
  
  // Form for bulk import
  const bulkForm = useForm<BulkImportFormValues>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: {
      importData: '',
    },
  });
  
  // Available months for select dropdown
  const availableMonths = [
    { value: '2024-01', label: 'Jan 2024' },
    { value: '2024-02', label: 'Feb 2024' },
    { value: '2024-03', label: 'Mar 2024' },
    { value: '2024-04', label: 'Apr 2024' },
    { value: '2024-05', label: 'May 2024' },
    { value: '2024-06', label: 'Jun 2024' },
    { value: '2024-07', label: 'Jul 2024' },
    { value: '2024-08', label: 'Aug 2024' },
    { value: '2024-09', label: 'Sep 2024' },
    { value: '2024-10', label: 'Oct 2024' },
    { value: '2024-11', label: 'Nov 2024' },
    { value: '2024-12', label: 'Dec 2024' },
    { value: '2025-01', label: 'Jan 2025' },
    { value: '2025-02', label: 'Feb 2025' },
    { value: '2025-03', label: 'Mar 2025' },
  ];
  
  // Facility types
  const facilityTypes = [
    { value: 'Residential', label: 'Residential' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Common Areas', label: 'Common Areas' },
    { value: 'Amenities', label: 'Amenities' },
    { value: 'Facilities', label: 'Facilities' },
    { value: 'Infrastructure', label: 'Infrastructure' },
  ];
  
  // Zones
  const zones = [
    { value: 'Zone 1', label: 'Zone 1' },
    { value: 'Zone 2', label: 'Zone 2' },
    { value: 'Zone 3', label: 'Zone 3' },
    { value: 'Zone 4', label: 'Zone 4' },
    { value: 'Zone 5', label: 'Zone 5' },
    { value: 'Zone 6', label: 'Zone 6' },
    { value: 'Main', label: 'Main' },
  ];
  
  const onMeterSubmit = async (data: ElectricityMeterFormValues) => {
    setIsSubmitting(true);
    try {
      // Format month for database storage
      const monthKey = getMonthKeyFromYearMonth(data.month);
      
      // Check if the electricity record already exists
      const { data: existingRecord, error: queryError } = await supabase
        .from('electricity_records')
        .select('id, consumption')
        .eq('meter_account_no', data.meterAccountNo)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking meter:', queryError);
        throw queryError;
      }
      
      if (existingRecord) {
        // Update existing record
        const consumption = existingRecord.consumption || {};
        consumption[monthKey] = data.consumption;
        
        const { error } = await supabase
          .from('electricity_records')
          .update({
            consumption: consumption
          })
          .eq('meter_account_no', data.meterAccountNo);
        
        if (error) {
          console.error('Error updating electricity record:', error);
          throw error;
        }
      } else {
        // Create new record
        const consumption: Record<string, number> = {};
        consumption[monthKey] = data.consumption;
        
        const { error } = await supabase
          .from('electricity_records')
          .insert([
            {
              name: data.meterName,
              meter_account_no: data.meterAccountNo,
              type: data.type,
              zone: data.zone,
              consumption: consumption
            }
          ]);
        
        if (error) {
          console.error('Error creating electricity record:', error);
          throw error;
        }
      }
      
      // Show success message
      toast.success('Electricity consumption saved successfully!');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      
      // Reset form values except for month, zone, and type
      meterForm.setValue('meterName', '');
      meterForm.setValue('meterAccountNo', '');
      meterForm.setValue('consumption', 0);
      
    } catch (error) {
      toast.error('Failed to save electricity consumption. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onBulkImport = async (data: BulkImportFormValues) => {
    try {
      // Parse the text data (could be tab-separated, JSON, or custom format)
      // This is a simplified example - you would need to adapt this to your specific data format
      const lines = data.importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedRecords = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;
        
        const record: Record<string, any> = {};
        for (let j = 0; j < headers.length; j++) {
          record[headers[j]] = values[j];
        }
        parsedRecords.push(record);
      }
      
      setParsedData(parsedRecords);
      setParseSuccess(true);
      toast.success(`Successfully parsed ${parsedRecords.length} electricity records.`);
      
    } catch (error) {
      console.error('Error parsing bulk import data:', error);
      toast.error('Failed to parse import data. Please check the format and try again.');
    }
  };
  
  const saveImportedData = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to save. Please parse import data first.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Process each record in the parsed data
      for (const record of parsedData) {
        // Format the consumption data
        const consumption: Record<string, number> = {};
        const monthColumns = Object.keys(record).filter(key => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key));
        
        monthColumns.forEach(month => {
          const value = parseFloat(record[month]);
          if (!isNaN(value)) {
            consumption[month] = value;
          }
        });
        
        // Check if record exists
        const { data: existingRecord, error: queryError } = await supabase
          .from('electricity_records')
          .select('id, consumption')
          .eq('meter_account_no', record['Meter Account No'])
          .single();
        
        if (queryError && queryError.code !== 'PGRST116') {
          console.error('Error checking record:', queryError);
          continue; // Skip this record but continue with others
        }
        
        if (existingRecord) {
          // Update existing record
          const updatedConsumption = { ...existingRecord.consumption, ...consumption };
          
          await supabase
            .from('electricity_records')
            .update({
              consumption: updatedConsumption
            })
            .eq('meter_account_no', record['Meter Account No']);
        } else {
          // Create new record
          await supabase
            .from('electricity_records')
            .insert([
              {
                name: record['Name'] || record['Facility'] || 'Unknown',
                meter_account_no: record['Meter Account No'],
                type: record['Type'] || 'Unknown',
                zone: record['Zone'] || 'Unknown',
                consumption: consumption
              }
            ]);
        }
      }
      
      toast.success(`Successfully saved ${parsedData.length} electricity records.`);
      // Reset form and parsed data
      bulkForm.reset();
      setParsedData([]);
      setParseSuccess(false);
      
    } catch (error) {
      console.error('Error saving imported data:', error);
      toast.error('Failed to save imported data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const downloadTemplate = () => {
    const header = 'Name,Meter Account No,Type,Zone,Jan-24,Feb-24,Mar-24,Apr-24,May-24,Jun-24,Jul-24,Aug-24,Sep-24,Oct-24,Nov-24,Dec-24,Jan-25,Feb-25,Mar-25';
    const csvContent = `data:text/csv;charset=utf-8,${header}\nExample Facility,MB-12345,Common Areas,Zone 1,1000,1200,1150,0,0,0,0,0,0,0,0,0,1300,1250,1400`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'electricity_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully!');
  };
  
  // Helper function to convert YYYY-MM to month-YY format
  const getMonthKeyFromYearMonth = (yearMonth: string): string => {
    const [year, month] = yearMonth.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month) - 1;
    const shortYear = year.slice(2); // Get last 2 digits of year
    
    return `${monthNames[monthIndex]}-${shortYear}`;
  };
  
  return (
    <div>
      <Tabs defaultValue="individual" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="individual">Individual Meter Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual">
          <Form {...meterForm}>
            <form onSubmit={meterForm.handleSubmit(onMeterSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={meterForm.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableMonths.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={meterForm.control}
                  name="consumption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumption (kWh)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={meterForm.control}
                  name="meterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility/Meter Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={meterForm.control}
                  name="meterAccountNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={meterForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {facilityTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={meterForm.control}
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
                            <SelectValue placeholder="Select Zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {zones.map((zone) => (
                            <SelectItem key={zone.value} value={zone.value}>
                              {zone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isSuccess ? (
                    <span className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Saved Successfully
                    </span>
                  ) : 'Save Consumption'}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="bulk">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Bulk Import Electricity Consumption</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadTemplate}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <Form {...bulkForm}>
              <form onSubmit={bulkForm.handleSubmit(onBulkImport)} className="space-y-6">
                <FormField
                  control={bulkForm.control}
                  name="importData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Import Data</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste CSV data here. First row should be headers."
                          className="min-h-32 font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Paste CSV data from Excel or other sources. Expected format: Facility Name, Meter Account No, Type, Zone, followed by monthly consumption values.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="flex items-center"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Parse Import Data
                  </Button>
                  
                  <Button 
                    type="button" 
                    disabled={!parseSuccess || isSubmitting} 
                    onClick={saveImportedData}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Parsed Data'}
                  </Button>
                </div>
              </form>
            </Form>
            
            {parseSuccess && parsedData.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Preview of Parsed Data</h4>
                <div className="border rounded-md overflow-auto max-h-80">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meter Account No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feb-25</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mar-25</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.slice(0, 5).map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item['Name']}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item['Meter Account No']}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item['Type']}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item['Zone']}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item['Feb-25']}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item['Mar-25']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                    {parsedData.length > 5 ? `Showing 5 of ${parsedData.length} rows` : `Showing all ${parsedData.length} rows`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ElectricityDataEntryForm;
