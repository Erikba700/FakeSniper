import { type NextRequest, NextResponse } from "next/server"

interface StatusResponse {
  uid: string
  status: string
  progress?: number
  result?: any
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "UID parameter is required" }, { status: 400 })
    }

    // Make request to check status (assuming this endpoint exists)
    const response = await fetch(`https://api.fakesniper.com/status/${uid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FakeSniper-Frontend/1.0",
      },
    })

    if (!response.ok) {
      console.error(`Status check failed: ${response.status} ${response.statusText}`)

      if (response.status === 404) {
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
      }

      return NextResponse.json({ error: "Failed to check analysis status" }, { status: response.status })
    }

    const data: StatusResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Status check error:", error)

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json({ error: "Unable to connect to analysis service" }, { status: 503 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
