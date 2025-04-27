import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get environment variables with fallbacks
    const apiKey = process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_BASE_ID || "appbUreNO4vvslMme"
    const tableId = process.env.AIRTABLE_TABLE_NAME || "shrpAtmnZhxfZ87Ue"

    // Check if API key is available
    if (!apiKey) {
      console.error("Airtable API key is not defined")
      return NextResponse.json(
        { error: "API key is not configured", message: "Please set the AIRTABLE_API_KEY environment variable" },
        { status: 500 },
      )
    }

    // Build the URL string directly instead of using URL object
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}`
    console.log(`Fetching from URL: ${url}`)

    try {
      // Simplify the fetch call to avoid potential type issues
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Airtable API error: ${response.status} ${errorText}`)
        return NextResponse.json(
          { error: "Airtable API error", status: response.status, message: errorText },
          { status: response.status },
        )
      }

      // Parse response as JSON
      const data = await response.json()

      // Return successful response
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error("Fetch error:", fetchError)
      return NextResponse.json(
        { error: "Fetch error", message: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        { status: 500 },
      )
    }
  } catch (error) {
    // Log the full error for debugging
    console.error("Error in electricity API route:", error)

    // Return a generic error response
    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
