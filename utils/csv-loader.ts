
import { processWaterData } from "@/utils/csv-parser"

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
