
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
import { parseCSVFromClipboard, saveWaterData } from '@/utils/waterDataUtils';
import { supabase } from '@/integrations/supabase/client';
import { WaterData } from '@/types/water';

// Schema for water meter data entry
const waterMeterSchema = z.object({
  month: z.string({
    required_error: "Month is required",
  }),
  meter_label: z.string().min(1, "Meter label is required"),
  account_number: z.string().optional(),
  zone: z.string().min(1, "Zone is required"),
  type: z.string().min(1, "Type is required"),
  parent_meter: z.string().optional(),
  reading: z.coerce.number().min(0, "Meter reading cannot be negative"),
});

// Schema for CSV import
const csvImportSchema = z.object({
  csvData: z.string().min(1, "CSV data is required"),
});

type WaterMeterFormValues = z.infer<typeof waterMeterSchema>;
type CSVImportFormValues = z.infer<typeof csvImportSchema>;

const WaterDataEntryForm = () => {
  const [activeTab, setActiveTab] = useState<string>("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [parsedData, setParsedData] = useState<WaterData[]>([]);
  const [parseSuccess, setParseSuccess] = useState(false);
  
  // Form for individual meter entry
  const meterForm = useForm<WaterMeterFormValues>({
    resolver: zodResolver(waterMeterSchema),
    defaultValues: {
      month: '2025-03', // Default to March 2025
      meter_label: '',
      account_number: '',
      zone: '',
      type: '',
      parent_meter: '',
      reading: 0,
    },
  });
  
  // Form for CSV data import
  const csvForm = useForm<CSVImportFormValues>({
    resolver: zodResolver(csvImportSchema),
    defaultValues: {
      csvData: '',
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
  
  // Meter types
  const meterTypes = [
    { value: 'Individual', label: 'Individual' },
    { value: 'Direct Connection', label: 'Direct Connection' },
    { value: 'Bulk', label: 'Bulk' },
    { value: 'Irrigation', label: 'Irrigation' },
    { value: 'Common Area', label: 'Common Area' },
  ];
  
  // Zones
  const zones = [
    { value: 'Zone 03(A)', label: 'Zone 03(A)' },
    { value: 'Zone 03(B)', label: 'Zone 03(B)' },
    { value: 'Zone 05', label: 'Zone 05' },
    { value: 'Zone 08', label: 'Zone 08' },
    { value: 'Zone FM', label: 'Zone FM' },
    { value: 'Zone VS', label: 'Zone VS' },
    { value: 'Main', label: 'Main' },
  ];
  
  const onMeterSubmit = async (data: WaterMeterFormValues) => {
    setIsSubmitting(true);
    try {
      // Extract month and year from the selected month
      const [year, month] = data.month.split('-');
      
      // Parse month number to get column name (jan_24, feb_24, etc.)
      const monthNum = parseInt(month);
      const shortYear = year.slice(2); // Get last 2 digits of year
      const columnName = `${getMonthAbbr(monthNum).toLowerCase()}_${shortYear}`;
      
      // Create record to update
      const updateRecord: any = {
        meter_label: data.meter_label,
        account_number: data.account_number || null,
        zone: data.zone,
        type: data.type,
        parent_meter: data.parent_meter || null,
      };
      
      // Add the reading to the appropriate month column
      updateRecord[columnName] = data.reading;
      
      // First check if the meter exists
      const { data: existingMeter, error: queryError } = await supabase
        .from('water_distribution_master')
        .select('id')
        .eq('meter_label', data.meter_label)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking meter:', queryError);
        throw queryError;
      }
      
      let result;
      
      if (existingMeter) {
        // Update existing meter
        const updateObj: any = {};
        updateObj[columnName] = data.reading;
        
        result = await supabase
          .from('water_distribution_master')
          .update(updateObj)
          .eq('meter_label', data.meter_label);
      } else {
        // Insert new meter
        result = await supabase
          .from('water_distribution_master')
          .insert([updateRecord]);
      }
      
      if (result.error) {
        console.error('Error saving water meter data:', result.error);
        throw result.error;
      }
      
      // Show success message
      toast.success('Water meter reading saved successfully!');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      
      // Reset form values except for month, zone, and type
      meterForm.setValue('meter_label', '');
      meterForm.setValue('account_number', '');
      meterForm.setValue('parent_meter', '');
      meterForm.setValue('reading', 0);
      
    } catch (error) {
      toast.error('Failed to save water meter reading. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onPasteCSV = async (data: CSVImportFormValues) => {
    try {
      await parseCSVFromClipboard(
        data.csvData,
        (transformedData) => {
          setParsedData(transformedData);
          setParseSuccess(true);
          toast.success(`Successfully parsed ${transformedData.length} water meter readings.`);
        },
        (errorMessage) => {
          toast.error(errorMessage);
        }
      );
    } catch (error) {
      console.error('CSV parsing error:', error);
      toast.error('Failed to parse CSV data. Please check the format and try again.');
    }
  };
  
  const onSaveCSVData = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to save. Please parse CSV data first.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await saveWaterData(parsedData);
      
      if (result.success) {
        toast.success(result.message);
        // Reset form
        csvForm.reset();
        setParsedData([]);
        setParseSuccess(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error saving water data:', error);
      toast.error('Failed to save water data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const downloadTemplate = () => {
    const header = 'Meter Label,Acct #,Zone,Type,Parent Meter,Jan-24,Feb-24,Mar-24,Apr-24,May-24,Jun-24,Jul-24,Aug-24,Sep-24,Oct-24,Nov-24,Dec-24,Jan-25,Feb-25,Mar-25,Total';
    const csvContent = `data:text/csv;charset=utf-8,${header}\nExample Meter,12345,Zone 03(A),Individual,Parent Meter,100,120,150,0,0,0,0,0,0,0,0,0,0,0,0,370`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'water_meter_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully!');
  };
  
  // Helper function to get month abbreviation from month number
  const getMonthAbbr = (monthNum: number): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };
  
  return (
    <div>
      <Tabs defaultValue="individual" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="individual">Individual Meter Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import (CSV)</TabsTrigger>
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
                  name="reading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Reading (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={meterForm.control}
                  name="meter_label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Label</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={meterForm.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={meterForm.control}
                  name="parent_meter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Meter (if applicable)</FormLabel>
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
                
                <FormField
                  control={meterForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Type</FormLabel>
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
                          {meterTypes.map((type) => (
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
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isSuccess ? (
                    <span className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Saved Successfully
                    </span>
                  ) : 'Save Meter Reading'}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="bulk">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Bulk Import Water Meter Readings</h3>
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
            
            <Form {...csvForm}>
              <form onSubmit={csvForm.handleSubmit(onPasteCSV)} className="space-y-6">
                <FormField
                  control={csvForm.control}
                  name="csvData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSV Data</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste CSV data here. First row should be headers."
                          className="min-h-32 font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Paste CSV data from Excel or other sources. Expected format: Meter Label, Account Number, Zone, Type, Parent Meter, followed by monthly readings.
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
                    Parse CSV Data
                  </Button>
                  
                  <Button 
                    type="button" 
                    disabled={!parseSuccess || isSubmitting} 
                    onClick={onSaveCSVData}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meter Label</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jan-25</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feb-25</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.slice(0, 5).map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.meter_label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.zone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jan_25}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.feb_25}</td>
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

export default WaterDataEntryForm;
