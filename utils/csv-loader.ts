
import { ParsedCsvRow, CsvParseResult } from "@/utils/csv-parser"

export async function loadCsvFile(filePath: string): Promise<any[]> {
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`)
    }
    
    const csvText = await response.text()
    if (!csvText) {
      throw new Error('CSV file is empty')
    }
    
    // Check if PapaParse is available
    if (!(window as any).Papa) {
      throw new Error('PapaParse library is not available.')
    }

    const parseResult = (window as any).Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    })
    
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors)
    }
    
    return parseResult.data
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error loading CSV'
    console.error('Error loading CSV file:', errorMessage)
    throw error
  }
}

export function getMonthsFromData(data: any[]): string[] {
  if (!data || !data[0]) return []
  
  return Object.keys(data[0]).filter(key => 
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key)
  )
}

export function getLatestMonthFromData(data: any[]): string {
  const months = getMonthsFromData(data)
  if (months.length === 0) return ''
  
  // Sort months by year and month index
  return months.sort((a, b) => {
    const [monthA, yearA] = a.split('-')
    const [monthB, yearB] = b.split('-')
    
    // Compare years
    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB)
    }
    
    // Compare months
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB)
  })[months.length - 1] // Get the last (most recent) month
}

// Add the missing exported processor functions
export function processWaterData(rawData: ParsedCsvRow[]): ParsedCsvRow[] {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    console.warn('Invalid or empty raw data provided to processWaterData')
    return []
  }
  
  const processedData = rawData
    .filter(row => row && typeof row === 'object' && Object.keys(row).length > 0)
    .map(row => {
      const processed: ParsedCsvRow = { ...row }
      
      // Convert meter readings to numbers
      const monthColumns = Object.keys(row).filter(key => 
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key)
      )
      
      monthColumns.forEach(month => {
        processed[month] = typeof row[month] === 'number' ? row[month] : 
                         typeof row[month] === 'string' && row[month].trim() !== '' ? 
                         Number(row[month].replace(/,/g, '')) : 0
      })
      
      return processed
    })
  
  return processedData
}

export function processSTPData(rawData: ParsedCsvRow[]): ParsedCsvRow[] {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    console.warn('Invalid or empty raw data provided to processSTPData')
    return []
  }
  
  const processedData = rawData
    .filter(row => row && typeof row === 'object' && Object.keys(row).length > 0)
    .map(row => {
      const processed: ParsedCsvRow = { ...row }
      
      // Convert numeric values to numbers
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'string' && /^\d+(\.\d+)?$/.test(row[key] as string)) {
          processed[key] = Number(row[key])
        }
      })
      
      return processed
    })
  
  return processedData
}

export function processElectricityData(rawData: ParsedCsvRow[]): ParsedCsvRow[] {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    console.warn('Invalid or empty raw data provided to processElectricityData')
    return []
  }
  
  const processedData = rawData
    .filter(row => row && typeof row === 'object' && Object.keys(row).length > 0)
    .map(row => {
      const processed: ParsedCsvRow = { ...row }
      
      // Convert meter readings to numbers
      const monthColumns = Object.keys(row).filter(key => 
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key)
      )
      
      monthColumns.forEach(month => {
        processed[month] = typeof row[month] === 'number' ? row[month] : 
                         typeof row[month] === 'string' && row[month].trim() !== '' ? 
                         Number(row[month].replace(/,/g, '')) : 0
      })
      
      return processed
    })
  
  return processedData
}
