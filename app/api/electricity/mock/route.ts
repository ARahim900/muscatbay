import { NextResponse } from "next/server"

export async function GET() {
  // Mock data that matches the expected Airtable response format
  const mockData = {
    records: [
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
    ],
  }

  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 300))

  return NextResponse.json(mockData)
}
