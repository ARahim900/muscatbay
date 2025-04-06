
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, Plus, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Schema for daily STP data entry
const stpDailySchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  tankerTrips: z.coerce.number().min(0, "Cannot be negative"),
  expectedVolumeTankers: z.coerce.number().min(0, "Cannot be negative"),
  directSewageMB: z.coerce.number().min(0, "Cannot be negative"),
  totalInfluent: z.coerce.number().min(0, "Cannot be negative"),
  totalWaterProcessed: z.coerce.number().min(0, "Cannot be negative"),
  tseToIrrigation: z.coerce.number().min(0, "Cannot be negative"),
  ph: z.coerce.number().min(0, "Cannot be negative").optional(),
  bod: z.coerce.number().min(0, "Cannot be negative").optional(),
  cod: z.coerce.number().min(0, "Cannot be negative").optional(),
  tss: z.coerce.number().min(0, "Cannot be negative").optional(),
  nh4_n: z.coerce.number().min(0, "Cannot be negative").optional(),
  tn: z.coerce.number().min(0, "Cannot be negative").optional(),
  tp: z.coerce.number().min(0, "Cannot be negative").optional(),
});

// Schema for monthly STP data
const stpMonthlySchema = z.object({
  month: z.string({
    required_error: "Month is required",
  }),
  tankerTrips: z.coerce.number().min(0, "Cannot be negative"),
  expectedVolumeTankers: z.coerce.number().min(0, "Cannot be negative"),
  directSewageMB: z.coerce.number().min(0, "Cannot be negative"),
  totalInfluent: z.coerce.number().min(0, "Cannot be negative"),
  totalWaterProcessed: z.coerce.number().min(0, "Cannot be negative"),
  tseToIrrigation: z.coerce.number().min(0, "Cannot be negative"),
});

type STPDailyFormValues = z.infer<typeof stpDailySchema>;
type STPMonthlyFormValues = z.infer<typeof stpMonthlySchema>;

const STPDataEntryForm = () => {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Daily data form
  const dailyForm = useForm<STPDailyFormValues>({
    resolver: zodResolver(stpDailySchema),
    defaultValues: {
      date: new Date(),
      tankerTrips: 0,
      expectedVolumeTankers: 0,
      directSewageMB: 0,
      totalInfluent: 0,
      totalWaterProcessed: 0,
      tseToIrrigation: 0,
    },
  });
  
  // Monthly data form
  const monthlyForm = useForm<STPMonthlyFormValues>({
    resolver: zodResolver(stpMonthlySchema),
    defaultValues: {
      month: format(new Date(), 'yyyy-MM'),
      tankerTrips: 0,
      expectedVolumeTankers: 0,
      directSewageMB: 0,
      totalInfluent: 0,
      totalWaterProcessed: 0,
      tseToIrrigation: 0,
    },
  });
  
  // All available months for select dropdown
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
    { value: '2025-04', label: 'Apr 2025' },
  ];
  
  const onDailySubmit = async (data: STPDailyFormValues) => {
    setIsSubmitting(true);
    try {
      // Format the date to string for the database
      const formattedDate = format(data.date, 'yyyy-MM-dd');
      
      // Insert data into the stp_daily_data table
      const { error } = await supabase
        .from('stp_daily_data')
        .insert([
          {
            date: formattedDate,
            tanker_trips: data.tankerTrips,
            expected_volume_tankers: data.expectedVolumeTankers,
            direct_sewage_mb: data.directSewageMB,
            total_influent: data.totalInfluent,
            total_water_processed: data.totalWaterProcessed,
            tse_to_irrigation: data.tseToIrrigation,
            ph: data.ph,
            bod: data.bod,
            cod: data.cod,
            tss: data.tss,
            nh4_n: data.nh4_n,
            tn: data.tn,
            tp: data.tp,
          }
        ]);
      
      if (error) {
        console.error('Error saving STP daily data:', error);
        throw error;
      }
      
      // Show success message and reset form
      toast.success('STP daily data saved successfully!');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      
      // Reset form to default values
      dailyForm.reset({
        date: new Date(),
        tankerTrips: 0,
        expectedVolumeTankers: 0,
        directSewageMB: 0,
        totalInfluent: 0,
        totalWaterProcessed: 0,
        tseToIrrigation: 0,
      });
      
    } catch (error) {
      toast.error('Failed to save STP daily data. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onMonthlySubmit = async (data: STPMonthlyFormValues) => {
    setIsSubmitting(true);
    try {
      // Calculate processing efficiency and irrigation utilization
      const processingEfficiency = data.totalInfluent > 0 
        ? data.totalWaterProcessed / data.totalInfluent 
        : 0;
      
      const irrigationUtilization = data.totalWaterProcessed > 0 
        ? data.tseToIrrigation / data.totalWaterProcessed 
        : 0;
      
      // Insert data into the stp_monthly_data table
      const { error } = await supabase
        .from('stp_monthly_data')
        .insert([
          {
            month: data.month,
            tanker_trips: data.tankerTrips,
            expected_volume_tankers: data.expectedVolumeTankers,
            direct_sewage_mb: data.directSewageMB,
            total_influent: data.totalInfluent,
            total_water_processed: data.totalWaterProcessed,
            tse_to_irrigation: data.tseToIrrigation,
            processing_efficiency: processingEfficiency,
            irrigation_utilization: irrigationUtilization,
            tanker_percentage: data.totalInfluent > 0 ? data.expectedVolumeTankers / data.totalInfluent : 0,
            direct_sewage_percentage: data.totalInfluent > 0 ? data.directSewageMB / data.totalInfluent : 0
          }
        ]);
      
      if (error) {
        console.error('Error saving STP monthly data:', error);
        throw error;
      }
      
      // Show success message and reset form
      toast.success('STP monthly data saved successfully!');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      
      // Reset to current month
      monthlyForm.setValue('month', format(new Date(), 'yyyy-MM'));
      
    } catch (error) {
      toast.error('Failed to save STP monthly data. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="daily">Daily Data Entry</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Data Entry</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <Form {...dailyForm}>
            <form onSubmit={dailyForm.handleSubmit(onDailySubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={dailyForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={dailyForm.control}
                  name="tankerTrips"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanker Trips</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={dailyForm.control}
                  name="expectedVolumeTankers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Volume Tankers (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={dailyForm.control}
                  name="directSewageMB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direct Sewage MB (m³)</FormLabel>
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
                  control={dailyForm.control}
                  name="totalInfluent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Influent (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={dailyForm.control}
                  name="totalWaterProcessed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Water Processed (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={dailyForm.control}
                  name="tseToIrrigation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TSE to Irrigation (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-4">Water Quality Parameters (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField
                    control={dailyForm.control}
                    name="ph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>pH</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={dailyForm.control}
                    name="bod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BOD</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={dailyForm.control}
                    name="cod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COD</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={dailyForm.control}
                    name="tss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TSS</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  <FormField
                    control={dailyForm.control}
                    name="nh4_n"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NH4-N</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={dailyForm.control}
                    name="tn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TN</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={dailyForm.control}
                    name="tp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TP</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isSuccess ? (
                    <span className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Saved Successfully
                    </span>
                  ) : 'Save Daily Data'}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="monthly">
          <Form {...monthlyForm}>
            <form onSubmit={monthlyForm.handleSubmit(onMonthlySubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={monthlyForm.control}
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={monthlyForm.control}
                  name="tankerTrips"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Tanker Trips</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={monthlyForm.control}
                  name="expectedVolumeTankers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Volume Tankers (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={monthlyForm.control}
                  name="directSewageMB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Direct Sewage MB (m³)</FormLabel>
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
                  control={monthlyForm.control}
                  name="totalInfluent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Influent (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={monthlyForm.control}
                  name="totalWaterProcessed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Water Processed (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={monthlyForm.control}
                  name="tseToIrrigation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total TSE to Irrigation (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
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
                  ) : 'Save Monthly Data'}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default STPDataEntryForm;
