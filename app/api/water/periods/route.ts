import { NextResponse } from "next/server"
import { getAvailablePeriods } from "@/services/water-service"

export async function GET() {
  try {
    // Get available periods
    const periods = await getAvailablePeriods()

    // Return response
    return NextResponse.json({
      success: true,
      data: periods,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in water periods API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
