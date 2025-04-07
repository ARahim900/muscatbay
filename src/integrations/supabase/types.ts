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
      assets: {
        Row: {
          bedrooms: number | null
          bua: number | null
          building: string | null
          created_at: string | null
          id: number
          plot: number | null
          property_type: string | null
          sector_zone: string | null
          status: string | null
          type: string | null
          unit_no: string
          unit_type: string | null
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          bedrooms?: number | null
          bua?: number | null
          building?: string | null
          created_at?: string | null
          id?: number
          plot?: number | null
          property_type?: string | null
          sector_zone?: string | null
          status?: string | null
          type?: string | null
          unit_no: string
          unit_type?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          bedrooms?: number | null
          bua?: number | null
          building?: string | null
          created_at?: string | null
          id?: number
          plot?: number | null
          property_type?: string | null
          sector_zone?: string | null
          status?: string | null
          type?: string | null
          unit_no?: string
          unit_type?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      "Assets List_ALM": {
        Row: {
          "Asset Name": string | null
          Condition: string | null
          "Installation Date": number | null
          Location: string | null
          "Main Category": string | null
          "Number of Each Asset": number | null
          "Sub-Category": string | null
          "Unique Tag": string | null
        }
        Insert: {
          "Asset Name"?: string | null
          Condition?: string | null
          "Installation Date"?: number | null
          Location?: string | null
          "Main Category"?: string | null
          "Number of Each Asset"?: number | null
          "Sub-Category"?: string | null
          "Unique Tag"?: string | null
        }
        Update: {
          "Asset Name"?: string | null
          Condition?: string | null
          "Installation Date"?: number | null
          Location?: string | null
          "Main Category"?: string | null
          "Number of Each Asset"?: number | null
          "Sub-Category"?: string | null
          "Unique Tag"?: string | null
        }
        Relationships: []
      }
      contribution_calculations: {
        Row: {
          breakdown: Json | null
          building_share: number
          calculation_date: string | null
          created_at: string | null
          id: string
          master_share: number
          total_annual_contribution: number
          unit_no: string
          year: number
          zone_share: number
        }
        Insert: {
          breakdown?: Json | null
          building_share?: number
          calculation_date?: string | null
          created_at?: string | null
          id?: string
          master_share?: number
          total_annual_contribution: number
          unit_no: string
          year: number
          zone_share?: number
        }
        Update: {
          breakdown?: Json | null
          building_share?: number
          calculation_date?: string | null
          created_at?: string | null
          id?: string
          master_share?: number
          total_annual_contribution?: number
          unit_no?: string
          year?: number
          zone_share?: number
        }
        Relationships: []
      }
      contribution_rates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: number
          property_type: string | null
          rate: number
          updated_at: string | null
          year: number
          zone: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: number
          property_type?: string | null
          rate: number
          updated_at?: string | null
          year: number
          zone: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          property_type?: string | null
          rate?: number
          updated_at?: string | null
          year?: number
          zone?: string
        }
        Relationships: []
      }
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
      L2: {
        Row: {
          "Acct #": number | null
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          "Feb-25": number | null
          "Jan-25": number | null
          "Jul-25": string | null
          "Jun-25": string | null
          Label: string | null
          "Mar-25": number | null
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
          Label?: string | null
          "Mar-25"?: number | null
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
          Label?: string | null
          "Mar-25"?: number | null
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
      "Muscat Bay - Assets List 2025": {
        Row: {
          "Asset Brand": string | null
          "Asset Categ Id": number | null
          "Asset Categ Name": string | null
          "Asset Desc": string | null
          "Asset Id": number | null
          "Asset In Loc Srlno": string | null
          "Asset Loc Key Id": number | null
          "Asset Loc Ref1": string | null
          "Asset Loc Ref2": string | null
          "Asset Loc Ref3": string | null
          "Asset Model": string | null
          "Asset Name": string | null
          "Asset Sub Categ Id": number | null
          "Asset Sub Categ Name": string | null
          "Asset Tag": string | null
          Client: string | null
          "Country Of Origin": string | null
          "Is Asset Active": string | null
          "Location Name": string | null
          "Location Tag": string | null
          "Ppm Freq": string | null
        }
        Insert: {
          "Asset Brand"?: string | null
          "Asset Categ Id"?: number | null
          "Asset Categ Name"?: string | null
          "Asset Desc"?: string | null
          "Asset Id"?: number | null
          "Asset In Loc Srlno"?: string | null
          "Asset Loc Key Id"?: number | null
          "Asset Loc Ref1"?: string | null
          "Asset Loc Ref2"?: string | null
          "Asset Loc Ref3"?: string | null
          "Asset Model"?: string | null
          "Asset Name"?: string | null
          "Asset Sub Categ Id"?: number | null
          "Asset Sub Categ Name"?: string | null
          "Asset Tag"?: string | null
          Client?: string | null
          "Country Of Origin"?: string | null
          "Is Asset Active"?: string | null
          "Location Name"?: string | null
          "Location Tag"?: string | null
          "Ppm Freq"?: string | null
        }
        Update: {
          "Asset Brand"?: string | null
          "Asset Categ Id"?: number | null
          "Asset Categ Name"?: string | null
          "Asset Desc"?: string | null
          "Asset Id"?: number | null
          "Asset In Loc Srlno"?: string | null
          "Asset Loc Key Id"?: number | null
          "Asset Loc Ref1"?: string | null
          "Asset Loc Ref2"?: string | null
          "Asset Loc Ref3"?: string | null
          "Asset Model"?: string | null
          "Asset Name"?: string | null
          "Asset Sub Categ Id"?: number | null
          "Asset Sub Categ Name"?: string | null
          "Asset Tag"?: string | null
          Client?: string | null
          "Country Of Origin"?: string | null
          "Is Asset Active"?: string | null
          "Location Name"?: string | null
          "Location Tag"?: string | null
          "Ppm Freq"?: string | null
        }
        Relationships: []
      }
      "Operating Expenses & Contract Information": {
        Row: {
          "Annual Cost (OMR)": number | null
          "Monthly Cost (OMR)": number | null
          Notes: string | null
          "Service Provider": string | null
          "Service Type": string | null
          Status: string | null
        }
        Insert: {
          "Annual Cost (OMR)"?: number | null
          "Monthly Cost (OMR)"?: number | null
          Notes?: string | null
          "Service Provider"?: string | null
          "Service Type"?: string | null
          Status?: string | null
        }
        Update: {
          "Annual Cost (OMR)"?: number | null
          "Monthly Cost (OMR)"?: number | null
          Notes?: string | null
          "Service Provider"?: string | null
          "Service Type"?: string | null
          Status?: string | null
        }
        Relationships: []
      }
      operating_expenses: {
        Row: {
          allocation: string
          annual_cost: number
          category: string
          created_at: string | null
          description: string | null
          id: string
          month: number | null
          monthly_cost: number
          notes: string | null
          quarter: number | null
          service_provider: string
          service_type: string
          status: string
          updated_at: string | null
          year: number
        }
        Insert: {
          allocation?: string
          annual_cost: number
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          month?: number | null
          monthly_cost: number
          notes?: string | null
          quarter?: number | null
          service_provider: string
          service_type: string
          status: string
          updated_at?: string | null
          year?: number
        }
        Update: {
          allocation?: string
          annual_cost?: number
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          month?: number | null
          monthly_cost?: number
          notes?: string | null
          quarter?: number | null
          service_provider?: string
          service_type?: string
          status?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      "Owners/Properties Details": {
        Row: {
          "Anticipated Handover Date": string | null
          BUA: string | null
          "Client Name": string | null
          DOB: string | null
          Email: string | null
          "Handover Date": string | null
          "Name in Arabic": string | null
          Nationality: string | null
          Plot: string | null
          Region: string | null
          Sector: string | null
          "SPA Date": string | null
          Status: string | null
          Type: string | null
          "Unit No": string | null
          "Unit Type": string | null
          "Unit Value": number | null
        }
        Insert: {
          "Anticipated Handover Date"?: string | null
          BUA?: string | null
          "Client Name"?: string | null
          DOB?: string | null
          Email?: string | null
          "Handover Date"?: string | null
          "Name in Arabic"?: string | null
          Nationality?: string | null
          Plot?: string | null
          Region?: string | null
          Sector?: string | null
          "SPA Date"?: string | null
          Status?: string | null
          Type?: string | null
          "Unit No"?: string | null
          "Unit Type"?: string | null
          "Unit Value"?: number | null
        }
        Update: {
          "Anticipated Handover Date"?: string | null
          BUA?: string | null
          "Client Name"?: string | null
          DOB?: string | null
          Email?: string | null
          "Handover Date"?: string | null
          "Name in Arabic"?: string | null
          Nationality?: string | null
          Plot?: string | null
          Region?: string | null
          Sector?: string | null
          "SPA Date"?: string | null
          Status?: string | null
          Type?: string | null
          "Unit No"?: string | null
          "Unit Type"?: string | null
          "Unit Value"?: number | null
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
      property_owners: {
        Row: {
          client_name: string
          client_name_arabic: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          id: string
          nationality: string | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          client_name: string
          client_name_arabic?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          nationality?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          client_name_arabic?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          nationality?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      property_transactions: {
        Row: {
          created_at: string | null
          id: string
          owner_id: string | null
          property_id: string | null
          spa_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          property_id?: string | null
          spa_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          property_id?: string | null
          spa_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_transactions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "property_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_service_charge_data"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
        ]
      }
      property_units: {
        Row: {
          anticipated_handover_date: string | null
          bua: number | null
          created_at: string | null
          handover_date: string | null
          has_lift: boolean | null
          id: string
          plot_size: number | null
          property_type: string | null
          sector: string | null
          status: string | null
          unit_no: string
          unit_type: string | null
          unit_value: number | null
          updated_at: string | null
          zone_code: string | null
        }
        Insert: {
          anticipated_handover_date?: string | null
          bua?: number | null
          created_at?: string | null
          handover_date?: string | null
          has_lift?: boolean | null
          id?: string
          plot_size?: number | null
          property_type?: string | null
          sector?: string | null
          status?: string | null
          unit_no: string
          unit_type?: string | null
          unit_value?: number | null
          updated_at?: string | null
          zone_code?: string | null
        }
        Update: {
          anticipated_handover_date?: string | null
          bua?: number | null
          created_at?: string | null
          handover_date?: string | null
          has_lift?: boolean | null
          id?: string
          plot_size?: number | null
          property_type?: string | null
          sector?: string | null
          status?: string | null
          unit_no?: string
          unit_type?: string | null
          unit_value?: number | null
          updated_at?: string | null
          zone_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_units_zone_code_fkey"
            columns: ["zone_code"]
            isOneToOne: false
            referencedRelation: "service_charge_zones"
            referencedColumns: ["code"]
          },
        ]
      }
      reserve_fund_rates: {
        Row: {
          created_at: string | null
          effective_date: string
          id: number
          notes: string | null
          rate: number
          zone_code: string
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          id?: number
          notes?: string | null
          rate?: number
          zone_code: string
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          id?: number
          notes?: string | null
          rate?: number
          zone_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserve_fund_rates_zone_code_fkey"
            columns: ["zone_code"]
            isOneToOne: false
            referencedRelation: "service_charge_zones"
            referencedColumns: ["code"]
          },
        ]
      }
      service_charge_calculations: {
        Row: {
          base_rate: number
          calculation_date: string | null
          created_at: string | null
          has_lift_access: boolean
          id: string
          lift_rate: number
          lift_share: number
          monthly: number
          operating_share: number
          property_id: string | null
          property_size: number
          quarterly: number
          reserve_contribution: number
          reserve_rate: number
          total_annual: number
          zone_code: string
        }
        Insert: {
          base_rate: number
          calculation_date?: string | null
          created_at?: string | null
          has_lift_access?: boolean
          id?: string
          lift_rate?: number
          lift_share?: number
          monthly?: number
          operating_share?: number
          property_id?: string | null
          property_size: number
          quarterly?: number
          reserve_contribution?: number
          reserve_rate?: number
          total_annual?: number
          zone_code: string
        }
        Update: {
          base_rate?: number
          calculation_date?: string | null
          created_at?: string | null
          has_lift_access?: boolean
          id?: string
          lift_rate?: number
          lift_share?: number
          monthly?: number
          operating_share?: number
          property_id?: string | null
          property_size?: number
          quarterly?: number
          reserve_contribution?: number
          reserve_rate?: number
          total_annual?: number
          zone_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_charge_calculations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_service_charge_data"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "service_charge_calculations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_charge_calculations_zone_code_fkey"
            columns: ["zone_code"]
            isOneToOne: false
            referencedRelation: "service_charge_zones"
            referencedColumns: ["code"]
          },
        ]
      }
      service_charge_zones: {
        Row: {
          code: string
          created_at: string | null
          id: number
          name: string
          reserve_fund_rate: number
          service_charge_rate: number
          total_bua: number
          unit_count: number
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: number
          name: string
          reserve_fund_rate?: number
          service_charge_rate?: number
          total_bua?: number
          unit_count?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
          name?: string
          reserve_fund_rate?: number
          service_charge_rate?: number
          total_bua?: number
          unit_count?: number
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
      water_consumption_types: {
        Row: {
          created_at: string | null
          id: number
          month: string
          percentage: number | null
          type: string
          value: number | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          month: string
          percentage?: number | null
          type: string
          value?: number | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: number
          month?: string
          percentage?: number | null
          type?: string
          value?: number | null
          year?: number
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
          mar_25: number | null
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
          mar_25?: number | null
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
          mar_25?: number | null
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
      water_meter_readings: {
        Row: {
          created_at: string | null
          direct_connection: number | null
          id: number
          l1_main_bulk: number | null
          l2_zone_bulk: number | null
          l3_individual: number | null
          loss: number | null
          month: string
          year: number
        }
        Insert: {
          created_at?: string | null
          direct_connection?: number | null
          id?: number
          l1_main_bulk?: number | null
          l2_zone_bulk?: number | null
          l3_individual?: number | null
          loss?: number | null
          month: string
          year: number
        }
        Update: {
          created_at?: string | null
          direct_connection?: number | null
          id?: number
          l1_main_bulk?: number | null
          l2_zone_bulk?: number | null
          l3_individual?: number | null
          loss?: number | null
          month?: string
          year?: number
        }
        Relationships: []
      }
      water_payable_consumption: {
        Row: {
          consumption: number | null
          cost: number | null
          created_at: string | null
          id: number
          month: string | null
          type: string
          year: number
        }
        Insert: {
          consumption?: number | null
          cost?: number | null
          created_at?: string | null
          id?: number
          month?: string | null
          type: string
          year: number
        }
        Update: {
          consumption?: number | null
          cost?: number | null
          created_at?: string | null
          id?: number
          month?: string | null
          type?: string
          year?: number
        }
        Relationships: []
      }
      water_summary_stats: {
        Row: {
          avg_daily_consumption: number | null
          created_at: string | null
          highest_consumption_month: string | null
          id: number
          loss_percentage: number | null
          lowest_consumption_month: string | null
          month: string | null
          payable_consumption: number | null
          payable_cost: number | null
          total_consumption: number | null
          total_loss: number | null
          water_rate: number | null
          year: number
        }
        Insert: {
          avg_daily_consumption?: number | null
          created_at?: string | null
          highest_consumption_month?: string | null
          id?: number
          loss_percentage?: number | null
          lowest_consumption_month?: string | null
          month?: string | null
          payable_consumption?: number | null
          payable_cost?: number | null
          total_consumption?: number | null
          total_loss?: number | null
          water_rate?: number | null
          year: number
        }
        Update: {
          avg_daily_consumption?: number | null
          created_at?: string | null
          highest_consumption_month?: string | null
          id?: number
          loss_percentage?: number | null
          lowest_consumption_month?: string | null
          month?: string | null
          payable_consumption?: number | null
          payable_cost?: number | null
          total_consumption?: number | null
          total_loss?: number | null
          water_rate?: number | null
          year?: number
        }
        Relationships: []
      }
      water_type_monthly: {
        Row: {
          consumption: number | null
          created_at: string | null
          id: number
          month: string
          type: string
          year: number
        }
        Insert: {
          consumption?: number | null
          created_at?: string | null
          id?: number
          month: string
          type: string
          year: number
        }
        Update: {
          consumption?: number | null
          created_at?: string | null
          id?: number
          month?: string
          type?: string
          year?: number
        }
        Relationships: []
      }
      water_zone_metrics: {
        Row: {
          consumption: number | null
          created_at: string | null
          id: number
          loss: number | null
          loss_percentage: number | null
          month: string
          year: number
          zone: string
        }
        Insert: {
          consumption?: number | null
          created_at?: string | null
          id?: number
          loss?: number | null
          loss_percentage?: number | null
          month: string
          year: number
          zone: string
        }
        Update: {
          consumption?: number | null
          created_at?: string | null
          id?: number
          loss?: number | null
          loss_percentage?: number | null
          month?: string
          year?: number
          zone?: string
        }
        Relationships: []
      }
      water_zone_monthly: {
        Row: {
          consumption: number | null
          created_at: string | null
          id: number
          month: string
          year: number
          zone: string
        }
        Insert: {
          consumption?: number | null
          created_at?: string | null
          id?: number
          month: string
          year: number
          zone: string
        }
        Update: {
          consumption?: number | null
          created_at?: string | null
          id?: number
          month?: string
          year?: number
          zone?: string
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
      expense_summary_by_status: {
        Row: {
          count: number | null
          status: string | null
          total_annual_cost: number | null
          total_monthly_cost: number | null
        }
        Relationships: []
      }
      expense_summary_by_type: {
        Row: {
          count: number | null
          service_type: string | null
          total_annual_cost: number | null
          total_monthly_cost: number | null
        }
        Relationships: []
      }
      owners_by_nationality: {
        Row: {
          count: number | null
          nationality: string | null
        }
        Relationships: []
      }
      owners_by_region: {
        Row: {
          count: number | null
          region: string | null
        }
        Relationships: []
      }
      property_by_sector: {
        Row: {
          avg_size: number | null
          count: number | null
          sector: string | null
          total_value: number | null
        }
        Relationships: []
      }
      property_by_status: {
        Row: {
          avg_size: number | null
          count: number | null
          status: string | null
          total_value: number | null
        }
        Relationships: []
      }
      property_by_type: {
        Row: {
          avg_size: number | null
          count: number | null
          total_value: number | null
          unit_type: string | null
        }
        Relationships: []
      }
      property_service_charge_data: {
        Row: {
          allocation: string | null
          annual_cost: number | null
          bua: number | null
          expense_category: string | null
          has_lift: boolean | null
          monthly_cost: number | null
          owner_name: string | null
          property_id: string | null
          sector: string | null
          service_provider: string | null
          unit_no: string | null
          unit_type: string | null
          zone_code: string | null
          zone_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_units_zone_code_fkey"
            columns: ["zone_code"]
            isOneToOne: false
            referencedRelation: "service_charge_zones"
            referencedColumns: ["code"]
          },
        ]
      }
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
          mar_25: number | null
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
          mar_25: number | null
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
      add_property_with_owner: {
        Args: {
          p_unit_no: string
          p_sector: string
          p_property_type: string
          p_status: string
          p_unit_type: string
          p_bua: number
          p_plot_size: number
          p_unit_value: number
          p_client_name: string
          p_client_name_arabic: string
          p_email: string
          p_nationality: string
          p_region: string
          p_dob: string
          p_spa_date: string
          p_handover_date: string
          p_anticipated_handover_date: string
        }
        Returns: undefined
      }
      refresh_all_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_water_consumption_views: {
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
