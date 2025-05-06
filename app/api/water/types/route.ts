import { NextResponse } from "next/server"
import { getTypeDataForPeriod } from "@/services/water-service"

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || "2025"
    const month = searchParams.get("month") || "Mar"
    const type = searchParams.get("type")

    if (!type) {
      return NextResponse.json({ success: false, error: "Type parameter is required" }, { status: 400 })
    }

    // Process data
    const data = await getTypeDataForPeriod(year, month, type)

    // Return response
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in water types API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
