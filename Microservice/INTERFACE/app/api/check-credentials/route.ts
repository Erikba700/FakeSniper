import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

interface CredentialsResponse {
  status: number
  message?: string
  title?: string
  keywords?: string[]
  summary?: string
  image?: string
}

interface ErrorResponse {
  error: string
  details?: string
  code?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "UID parameter is required" } as ErrorResponse, { status: 400 })
    }

    console.log(`[check-credentials] Checking credentials for UID: ${uid}`)

    // Make request to check credentials endpoint
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

    const apiEndpoint = buildApiUrl("/check_credentials")
    const requestUrl = `${apiEndpoint}?uid=${uid}`

    console.log(`[check-credentials] API endpoint: ${requestUrl}`)

    let response: Response
    try {
      response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          ...API_CONFIG.HEADERS,
          Accept: "application/json",
        },
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("[check-credentials] Fetch error:", fetchError)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return NextResponse.json(
            {
              error: "Request timeout. The credentials service is taking too long to respond.",
              code: "TIMEOUT_ERROR",
            } as ErrorResponse,
            { status: 504 },
          )
        }

        if (fetchError.message.includes("ENOTFOUND") || fetchError.message.includes("ECONNREFUSED")) {
          return NextResponse.json(
            {
              error: "Unable to connect to credentials service. Please try again later.",
              code: "CONNECTION_ERROR",
            } as ErrorResponse,
            { status: 503 },
          )
        }
      }

      return NextResponse.json(
        {
          error: "Network error occurred. Please check your connection and try again.",
          code: "NETWORK_ERROR",
        } as ErrorResponse,
        { status: 503 },
      )
    }

    clearTimeout(timeoutId)
    console.log(`[check-credentials] API response status: ${response.status}`)

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = "Failed to check credentials"
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`
      let errorCode = `HTTP_${response.status}`

      try {
        const errorData = await response.text()
        console.error(`[check-credentials] API error response: ${errorData}`)

        // Handle specific error messages from backend
        if (errorData.includes("Failed to retrieve record")) {
          console.log(`[check-credentials] Record not found for UID: ${uid} - analysis may still be initializing`)
          return NextResponse.json(
            {
              status: 404,
              message: "Analysis record not found - still initializing",
              uid: uid,
              retry: true,
            },
            { status: 200 }, // Return 200 so frontend can handle retry logic
          )
        }

        try {
          const parsedError = JSON.parse(errorData)
          if (parsedError.error) {
            errorMessage = parsedError.error
          }
          if (parsedError.message) {
            errorDetails = parsedError.message
          }
          if (parsedError.code) {
            errorCode = parsedError.code
          }
        } catch {
          if (errorData && errorData.length < 200) {
            errorDetails = errorData
          }
        }
      } catch (readError) {
        console.error("[check-credentials] Failed to read error response:", readError)
      }

      if (response.status === 404) {
        return NextResponse.json(
          {
            error: "Analysis not found",
            details: "The specified analysis UID was not found in the system",
            code: "ANALYSIS_NOT_FOUND",
            uid: uid,
          } as ErrorResponse & { uid: string },
          { status: 404 },
        )
      }

      if (response.status >= 500) {
        return NextResponse.json(
          {
            error: "Credentials service is temporarily unavailable. Please try again in a few minutes.",
            code: "SERVICE_UNAVAILABLE",
          } as ErrorResponse,
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          code: errorCode,
        } as ErrorResponse,
        {
          status: response.status,
        },
      )
    }

    // Parse successful response
    let data: CredentialsResponse
    try {
      const responseText = await response.text()
      console.log(`[check-credentials] API response body: ${responseText}`)

      if (!responseText || responseText.trim() === "") {
        console.error("[check-credentials] Empty response from API")
        return NextResponse.json(
          {
            error: "Empty response from credentials service",
            code: "EMPTY_RESPONSE",
          } as ErrorResponse,
          { status: 502 },
        )
      }

      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[check-credentials] Failed to parse API response:", parseError)
      return NextResponse.json(
        {
          error: "Invalid response from credentials service. Please try again.",
          code: "PARSE_ERROR",
        } as ErrorResponse,
        { status: 502 },
      )
    }

    // Validate response structure
    if (!data || typeof data !== "object") {
      console.error("[check-credentials] Invalid response structure:", data)
      return NextResponse.json(
        {
          error: "Invalid response format from credentials service",
          code: "INVALID_FORMAT",
        } as ErrorResponse,
        {
          status: 502,
        },
      )
    }

    // Check if we have any meaningful data
    if (!data.title && !data.summary && !data.keywords && !data.image) {
      console.log("[check-credentials] No meaningful data found, analysis may still be processing")
      return NextResponse.json(
        {
          status: 404,
          message: "Analysis data not ready - still processing",
          uid: uid,
          retry: true,
        },
        { status: 200 }, // Return 200 so frontend can handle retry logic
      )
    }

    console.log(`[check-credentials] Successful response with data:`)
    if (data.title) console.log(`[check-credentials] Title: ${data.title.substring(0, 50)}...`)
    if (data.summary) console.log(`[check-credentials] Summary length: ${data.summary.length}`)
    if (data.keywords) console.log(`[check-credentials] Keywords: ${data.keywords?.substring(0, 100)}...`)
    if (data.image) console.log(`[check-credentials] Image URL: ${data.image.substring(0, 50)}...`)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[check-credentials] Unexpected error:", error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid request format",
          code: "SYNTAX_ERROR",
        } as ErrorResponse,
        { status: 400 },
      )
    }

    if (error instanceof TypeError) {
      return NextResponse.json(
        {
          error: "Network connection error. Please check your internet connection.",
          code: "TYPE_ERROR",
        } as ErrorResponse,
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
        code: "UNKNOWN_ERROR",
      } as ErrorResponse,
      {
        status: 500,
      },
    )
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
