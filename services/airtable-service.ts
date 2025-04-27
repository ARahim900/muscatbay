/**
 * Service for interacting with Airtable API
 */

// Define the base Airtable record type
export interface AirtableRecord {
  id: string
  fields: Record<string, any>
  createdTime: string
}

// Define the Airtable response type
export interface AirtableResponse {
  records: AirtableRecord[]
  offset?: string
}

// Mock data for when we can't access the API
const mockElectricityRecords: AirtableRecord[] = [
  {
    id: "rec1",
    fields: {
      Name: "Main Supply",
      Type: "Main",
      "Meter Account No.": "MS001",
      "Jan-25": 168000,
      "Feb-25": 162000,
      "Mar-25": 175000,
    },
    createdTime: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "rec2",
    fields: {
      Name: "Zone A",
      Type: "Residential",
      "Meter Account No.": "ZA001",
      "Jan-25": 46000,
      "Feb-25": 44000,
      "Mar-25": 48000,
    },
    createdTime: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "rec3",
    fields: {
      Name: "Zone B",
      Type: "Commercial",
      "Meter Account No.": "ZB001",
      "Jan-25": 39000,
      "Feb-25": 37000,
      "Mar-25": 41000,
    },
    createdTime: "2023-01-01T00:00:00.000Z",
  },
]

/**
 * Fetches records from an Airtable table
 * @param baseId The Airtable base ID
 * @param tableId The Airtable table ID
 * @param options Optional parameters for the request
 * @returns Promise with the fetched records
 */
export async function fetchAirtableRecords(
  baseId: string,
  tableId: string,
  options: {
    maxRecords?: number
    view?: string
    filterByFormula?: string
    sort?: Array<{ field: string; direction: "asc" | "desc" }>
  } = {},
): Promise<AirtableRecord[]> {
  // In client components, we need to use NEXT_PUBLIC_ prefixed environment variables
  // or use a server-side API route to access non-public environment variables
  try {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // We're in a browser, so we need to use a server endpoint or mock data
      console.warn("Airtable API calls should be made from server components or API routes. Using mock data instead.")
      return mockElectricityRecords
    }

    // Server-side code
    const apiKey = process.env.AIRTABLE_API_KEY

    if (!apiKey) {
      console.error("Airtable API key is not defined")
      return mockElectricityRecords
    }

    // Build the URL with query parameters
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`)

    if (options.maxRecords) {
      url.searchParams.append("maxRecords", options.maxRecords.toString())
    }

    if (options.view) {
      url.searchParams.append("view", options.view)
    }

    if (options.filterByFormula) {
      url.searchParams.append("filterByFormula", options.filterByFormula)
    }

    if (options.sort && options.sort.length > 0) {
      url.searchParams.append("sort", JSON.stringify(options.sort))
    }

    // Fetch data from Airtable
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Airtable API error: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as AirtableResponse
    return data.records
  } catch (error) {
    console.error("Error fetching data from Airtable:", error)
    return mockElectricityRecords
  }
}

/**
 * Fetches electricity consumption data from Airtable
 * @returns Promise with the electricity consumption records
 */
export async function fetchElectricityData(): Promise<AirtableRecord[]> {
  const baseId = process.env.AIRTABLE_BASE_ID || "appbUreNO4vvslMme"
  const tableId = process.env.AIRTABLE_TABLE_NAME || "shrpAtmnZhxfZ87Ue"

  return fetchAirtableRecords(baseId, tableId, {
    // Add any specific options for electricity data
  })
}
