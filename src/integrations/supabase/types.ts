export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      "Direct Connections": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: number | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      "IRR Tanks": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": string | null
          "Jan-25": string | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: string | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: string | null
          "Jan-25"?: string | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: string | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: string | null
          "Jan-25"?: string | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: string | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      L1_Main_Bulk: {
        Row: {
          apr_24: number | null
          aug_24: number | null
          created_at: string | null
          dec_24: number | null
          feb_24: number | null
          id: number
          jan_24: number | null
          jul_24: number | null
          jun_24: number | null
          mar_24: number | null
          may_24: number | null
          meter_id: string | null
          meter_label: string | null
          meter_type: string | null
          nov_24: number | null
          oct_24: number | null
          parent_meter: string | null
          sep_24: number | null
          total_24: number | null
        }
        Insert: {
          apr_24?: number | null
          aug_24?: number | null
          created_at?: string | null
          dec_24?: number | null
          feb_24?: number | null
          id?: number
          jan_24?: number | null
          jul_24?: number | null
          jun_24?: number | null
          mar_24?: number | null
          may_24?: number | null
          meter_id?: string | null
          meter_label?: string | null
          meter_type?: string | null
          nov_24?: number | null
          oct_24?: number | null
          parent_meter?: string | null
          sep_24?: number | null
          total_24?: number | null
        }
        Update: {
          apr_24?: number | null
          aug_24?: number | null
          created_at?: string | null
          dec_24?: number | null
          feb_24?: number | null
          id?: number
          jan_24?: number | null
          jul_24?: number | null
          jun_24?: number | null
          mar_24?: number | null
          may_24?: number | null
          meter_id?: string | null
          meter_label?: string | null
          meter_type?: string | null
          nov_24?: number | null
          oct_24?: number | null
          parent_meter?: string | null
          sep_24?: number | null
          total_24?: number | null
        }
        Relationships: []
      }
      "L1: Main Bulk Meter": {
        Row: {
          "Acct #": string | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: number | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: string | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: string | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      L2_Zone_Bulk_Direct: {
        Row: {
          apr_24: number | null
          aug_24: number | null
          created_at: string | null
          dec_24: number | null
          feb_24: number | null
          id: number
          jan_24: number | null
          jul_24: number | null
          jun_24: number | null
          mar_24: number | null
          may_24: number | null
          meter_id: string | null
          meter_label: string | null
          meter_type: string | null
          nov_24: number | null
          oct_24: number | null
          parent_meter: string | null
          sep_24: number | null
          total_24: number | null
          zone: string | null
        }
        Insert: {
          apr_24?: number | null
          aug_24?: number | null
          created_at?: string | null
          dec_24?: number | null
          feb_24?: number | null
          id?: number
          jan_24?: number | null
          jul_24?: number | null
          jun_24?: number | null
          mar_24?: number | null
          may_24?: number | null
          meter_id?: string | null
          meter_label?: string | null
          meter_type?: string | null
          nov_24?: number | null
          oct_24?: number | null
          parent_meter?: string | null
          sep_24?: number | null
          total_24?: number | null
          zone?: string | null
        }
        Update: {
          apr_24?: number | null
          aug_24?: number | null
          created_at?: string | null
          dec_24?: number | null
          feb_24?: number | null
          id?: number
          jan_24?: number | null
          jul_24?: number | null
          jun_24?: number | null
          mar_24?: number | null
          may_24?: number | null
          meter_id?: string | null
          meter_label?: string | null
          meter_type?: string | null
          nov_24?: number | null
          oct_24?: number | null
          parent_meter?: string | null
          sep_24?: number | null
          total_24?: number | null
          zone?: string | null
        }
        Relationships: []
      }
      "L2: Zones Bulk + Direct Connection": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: number | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      L3_Individual_Meters: {
        Row: {
          apr_24: number | null
          aug_24: number | null
          created_at: string | null
          dec_24: number | null
          feb_24: number | null
          id: number
          jan_24: number | null
          jul_24: number | null
          jun_24: number | null
          mar_24: number | null
          may_24: number | null
          meter_id: string | null
          meter_label: string | null
          meter_type: string | null
          nov_24: number | null
          oct_24: number | null
          parent_meter: string | null
          sep_24: number | null
          total_24: number | null
          zone: string | null
        }
        Insert: {
          apr_24?: number | null
          aug_24?: number | null
          created_at?: string | null
          dec_24?: number | null
          feb_24?: number | null
          id?: number
          jan_24?: number | null
          jul_24?: number | null
          jun_24?: number | null
          mar_24?: number | null
          may_24?: number | null
          meter_id?: string | null
          meter_label?: string | null
          meter_type?: string | null
          nov_24?: number | null
          oct_24?: number | null
          parent_meter?: string | null
          sep_24?: number | null
          total_24?: number | null
          zone?: string | null
        }
        Update: {
          apr_24?: number | null
          aug_24?: number | null
          created_at?: string | null
          dec_24?: number | null
          feb_24?: number | null
          id?: number
          jan_24?: number | null
          jul_24?: number | null
          jun_24?: number | null
          mar_24?: number | null
          may_24?: number | null
          meter_id?: string | null
          meter_label?: string | null
          meter_type?: string | null
          nov_24?: number | null
          oct_24?: number | null
          parent_meter?: string | null
          sep_24?: number | null
          total_24?: number | null
          zone?: string | null
        }
        Relationships: []
      }
      "L3: Indiv + Direct Connections": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: number | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      "MB-Electrical": {
        Row: {
          "April-24": string | null
          "August-24": string | null
          "December-24": string | null
          "Electrical Meter Account No": string | null
          "February-25": string | null
          "January-25": string | null
          "July-24": string | null
          "June-24": string | null
          "May-24": string | null
          "Muscat Bay Number": string | null
          "November-24": string | null
          "October-24": string | null
          "September-24": string | null
          "SL:no.": number | null
          Type: string | null
          "Unit Number (Muncipality)": string | null
          Zone: string | null
        }
        Insert: {
          "April-24"?: string | null
          "August-24"?: string | null
          "December-24"?: string | null
          "Electrical Meter Account No"?: string | null
          "February-25"?: string | null
          "January-25"?: string | null
          "July-24"?: string | null
          "June-24"?: string | null
          "May-24"?: string | null
          "Muscat Bay Number"?: string | null
          "November-24"?: string | null
          "October-24"?: string | null
          "September-24"?: string | null
          "SL:no."?: number | null
          Type?: string | null
          "Unit Number (Muncipality)"?: string | null
          Zone?: string | null
        }
        Update: {
          "April-24"?: string | null
          "August-24"?: string | null
          "December-24"?: string | null
          "Electrical Meter Account No"?: string | null
          "February-25"?: string | null
          "January-25"?: string | null
          "July-24"?: string | null
          "June-24"?: string | null
          "May-24"?: string | null
          "Muscat Bay Number"?: string | null
          "November-24"?: string | null
          "October-24"?: string | null
          "September-24"?: string | null
          "SL:no."?: number | null
          Type?: string | null
          "Unit Number (Muncipality)"?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stp_daily_data: {
        Row: {
          bod: number | null
          cod: number | null
          created_at: string | null
          date: string
          direct_sewage_mb: number | null
          expected_volume_tankers: number | null
          id: string
          nh4_n: number | null
          ph: number | null
          tanker_trips: number | null
          tn: number | null
          total_influent: number | null
          total_water_processed: number | null
          tp: number | null
          tse_to_irrigation: number | null
          tss: number | null
          updated_at: string | null
        }
        Insert: {
          bod?: number | null
          cod?: number | null
          created_at?: string | null
          date: string
          direct_sewage_mb?: number | null
          expected_volume_tankers?: number | null
          id?: string
          nh4_n?: number | null
          ph?: number | null
          tanker_trips?: number | null
          tn?: number | null
          total_influent?: number | null
          total_water_processed?: number | null
          tp?: number | null
          tse_to_irrigation?: number | null
          tss?: number | null
          updated_at?: string | null
        }
        Update: {
          bod?: number | null
          cod?: number | null
          created_at?: string | null
          date?: string
          direct_sewage_mb?: number | null
          expected_volume_tankers?: number | null
          id?: string
          nh4_n?: number | null
          ph?: number | null
          tanker_trips?: number | null
          tn?: number | null
          total_influent?: number | null
          total_water_processed?: number | null
          tp?: number | null
          tse_to_irrigation?: number | null
          tss?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stp_monthly_data: {
        Row: {
          created_at: string | null
          direct_sewage_mb: number | null
          direct_sewage_percentage: number | null
          expected_volume_tankers: number | null
          id: string
          irrigation_utilization: number | null
          month: string
          processing_efficiency: number | null
          tanker_percentage: number | null
          tanker_trips: number | null
          total_influent: number | null
          total_water_processed: number | null
          tse_to_irrigation: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          direct_sewage_mb?: number | null
          direct_sewage_percentage?: number | null
          expected_volume_tankers?: number | null
          id?: string
          irrigation_utilization?: number | null
          month: string
          processing_efficiency?: number | null
          tanker_percentage?: number | null
          tanker_trips?: number | null
          total_influent?: number | null
          total_water_processed?: number | null
          tse_to_irrigation?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          direct_sewage_mb?: number | null
          direct_sewage_percentage?: number | null
          expected_volume_tankers?: number | null
          id?: string
          irrigation_utilization?: number | null
          month?: string
          processing_efficiency?: number | null
          tanker_percentage?: number | null
          tanker_trips?: number | null
          total_influent?: number | null
          total_water_processed?: number | null
          tse_to_irrigation?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      water_distribution_master: {
        Row: {
          account_number: string | null
          apr_24: number | null
          aug_24: number | null
          created_at: string | null
          dec_24: number | null
          feb_24: number | null
          feb_25: number | null
          id: number
          jan_24: number | null
          jan_25: number | null
          jul_24: number | null
          jun_24: number | null
          mar_24: number | null
          may_24: number | null
          meter_label: string | null
          nov_24: number | null
          oct_24: number | null
          parent_meter: string | null
          sep_24: number | null
          total: number | null
          type: string | null
          zone: string | null
        }
        Insert: {
          account_number?: string | null
          apr_24?: number | null
          aug_24?: number | null
          created_at?: string | null
          dec_24?: number | null
          feb_24?: number | null
          feb_25?: number | null
          id?: number
          jan_24?: number | null
          jan_25?: number | null
          jul_24?: number | null
          jun_24?: number | null
          mar_24?: number | null
          may_24?: number | null
          meter_label?: string | null
          nov_24?: number | null
          oct_24?: number | null
          parent_meter?: string | null
          sep_24?: number | null
          total?: number | null
          type?: string | null
          zone?: string | null
        }
        Update: {
          account_number?: string | null
          apr_24?: number | null
          aug_24?: number | null
          created_at?: string | null
          dec_24?: number | null
          feb_24?: number | null
          feb_25?: number | null
          id?: number
          jan_24?: number | null
          jan_25?: number | null
          jul_24?: number | null
          jun_24?: number | null
          mar_24?: number | null
          may_24?: number | null
          meter_label?: string | null
          nov_24?: number | null
          oct_24?: number | null
          parent_meter?: string | null
          sep_24?: number | null
          total?: number | null
          type?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      "Zone 03(A)": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: number | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      "Zone 03(B)": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: number | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      "Zone 05": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": string | null
          "Jan-25": string | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: string | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: string | null
          "Jan-25"?: string | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: string | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: string | null
          "Jan-25"?: string | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: string | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      "Zone 08": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: number | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      "Zone FM": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: number | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: number | null
          "Jan-25"?: number | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: number | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
      "Zone VS": {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": string | null
          "Jan-25": string | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Meter Label": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Parent Meter": string | null
          "Sep-25": string | null
          Total: string | null
          Type: string | null
          Zone: string | null
        }
        Insert: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: string | null
          "Jan-25"?: string | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: string | null
          Type?: string | null
          Zone?: string | null
        }
        Update: {
          "Acct #"?: number | null
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          "Feb-25"?: string | null
          "Jan-25"?: string | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Meter Label"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Parent Meter"?: string | null
          "Sep-25"?: string | null
          Total?: string | null
          Type?: string | null
          Zone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      water_consumption_by_type: {
        Row: {
          apr_24: number | null
          aug_24: number | null
          dec_24: number | null
          feb_24: number | null
          feb_25: number | null
          jan_24: number | null
          jan_25: number | null
          jul_24: number | null
          jun_24: number | null
          mar_24: number | null
          may_24: number | null
          nov_24: number | null
          oct_24: number | null
          sep_24: number | null
          total: number | null
          type: string | null
        }
        Relationships: []
      }
      water_consumption_by_zone: {
        Row: {
          apr_24: number | null
          aug_24: number | null
          dec_24: number | null
          feb_24: number | null
          feb_25: number | null
          jan_24: number | null
          jan_25: number | null
          jul_24: number | null
          jun_24: number | null
          mar_24: number | null
          may_24: number | null
          nov_24: number | null
          oct_24: number | null
          sep_24: number | null
          total: number | null
          zone: string | null
        }
        Relationships: []
      }
      Zone_Metrics: {
        Row: {
          bulksupply: number | null
          cleaned_zone: string | null
          individualmeters: number | null
          loss: number | null
          losspercentage: number | null
          zone: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_all_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
