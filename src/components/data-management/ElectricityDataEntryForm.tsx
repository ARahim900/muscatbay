
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  meterLabel: z.string().min(3, { message: "Meter label is required" }),
  accountNumber: z.string().min(1, { message: "Account number is required" }),
  zone: z.string().min(1, { message: "Zone is required" }),
  type: z.string().min(1, { message: "Type is required" }),
  consumption: z.coerce.number().min(0, { message: "Consumption must be a positive number" }),
  readingDate: z.string().min(1, { message: "Reading date is required" }),
});

type FormData = z.infer<typeof formSchema>;

interface ElectricityDataEntryFormProps {
  onSuccess?: () => void;
}

const ElectricityDataEntryForm: React.FC<ElectricityDataEntryFormProps> = ({ onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      meterLabel: '',
      accountNumber: '',
      zone: '',
      type: '',
      consumption: 0,
      readingDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Check if the electricity_records table exists
      const { error: tableCheckError } = await supabase
        .from('electricity_records')
        .select('count(*)', { count: 'exact', head: true });
      
      // Create the table if it doesn't exist
      if (tableCheckError && tableCheckError.message.includes('relation "electricity_records" does not exist')) {
        // Here we should actually run a migration to create the table
        toast.error("Electricity records table doesn't exist. Please contact the administrator.");
        setIsSubmitting(false);
        return;
      }

      // Check if a record with this meter label and date already exists
      const { data: existingData, error: fetchError } = await supabase
        .from('electricity_records')
        .select('*')
        .eq('meter_label', data.meterLabel)
        .eq('reading_date', data.readingDate);

      if (fetchError) {
        toast.error(`Error checking existing records: ${fetchError.message}`);
        setIsSubmitting(false);
        return;
      }

      if (existingData && existingData.length > 0) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('electricity_records')
          .update({
            account_number: data.accountNumber,
            zone: data.zone,
            type: data.type,
            consumption: data.consumption,
            updated_at: new Date().toISOString(),
          })
          .eq('meter_label', data.meterLabel)
          .eq('reading_date', data.readingDate);

        if (updateError) {
          toast.error(`Error updating record: ${updateError.message}`);
          setIsSubmitting(false);
          return;
        }

        toast.success('Record updated successfully!');
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('electricity_records')
          .insert({
            meter_label: data.meterLabel,
            account_number: data.accountNumber,
            zone: data.zone,
            type: data.type,
            consumption: data.consumption,
            reading_date: data.readingDate,
          });

        if (insertError) {
          toast.error(`Error creating record: ${insertError.message}`);
          setIsSubmitting(false);
          return;
        }

        toast.success('Record created successfully!');
      }

      // Reset form
      form.reset({
        meterLabel: '',
        accountNumber: '',
        zone: '',
        type: '',
        consumption: 0,
        readingDate: new Date().toISOString().split('T')[0],
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting electricity data:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="meterLabel"
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
            name="accountNumber"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="zone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter zone" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input placeholder="Enter type" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="consumption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consumption (kWh)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="readingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reading Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Record'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ElectricityDataEntryForm;
