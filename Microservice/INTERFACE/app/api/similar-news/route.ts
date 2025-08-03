import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

interface SimilarNewsItem {
  target: string
  title: string
}

interface SimilarNewsResponse {
  status?: number
  results?: SimilarNewsItem[]
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

    console.log(`[similar-news] Fetching similar news for UID: ${uid}`)

    // Make request to similar news endpoint
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

    const apiEndpoint = buildApiUrl("/similar_news")
    const requestUrl = `${apiEndpoint}?uid=${uid}`

    console.log(`[similar-news] API endpoint: ${requestUrl}`)

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
      console.error("[similar-news] Fetch error:", fetchError)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return NextResponse.json(
            {
              error: "Request timeout. The similar news service is taking too long to respond.",
              code: "TIMEOUT_ERROR",
            } as ErrorResponse,
            { status: 504 },
          )
        }

        if (fetchError.message.includes("ENOTFOUND") || fetchError.message.includes("ECONNREFUSED")) {
          return NextResponse.json(
            {
              error: "Unable to connect to similar news service. Please try again later.",
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
    console.log(`[similar-news] API response status: ${response.status}`)

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = "Failed to fetch similar news"
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`
      let errorCode = `HTTP_${response.status}`

      try {
        const errorData = await response.text()
        console.error(`[similar-news] API error response: ${errorData}`)

        // Handle specific error messages from backend
        if (errorData.includes("Database connection error")) {
          return NextResponse.json(
            {
              error: "Database connection error - similar news temporarily unavailable",
              code: "DATABASE_ERROR",
            } as ErrorResponse,
            { status: 503 },
          )
        }

        if (errorData.includes("Database query error") || errorData.includes("Database scan error")) {
          return NextResponse.json(
            {
              error: "Database query error - similar news temporarily unavailable",
              code: "DATABASE_QUERY_ERROR",
            } as ErrorResponse,
            { status: 503 },
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
        console.error("[similar-news] Failed to read error response:", readError)
      }

      if (response.status === 404) {
        return NextResponse.json(
          {
            error: "Similar news not found for this analysis",
            details: "The specified analysis UID was not found in the similar news system",
            code: "ANALYSIS_NOT_FOUND",
            uid: uid,
          } as ErrorResponse & { uid: string },
          { status: 404 },
        )
      }

      if (response.status >= 500) {
        return NextResponse.json(
          {
            error: "Similar news service is temporarily unavailable. Please try again in a few minutes.",
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
    let data: SimilarNewsResponse
    try {
      const responseText = await response.text()
      console.log(`[similar-news] API response body: ${responseText}`)

      if (!responseText || responseText.trim() === "") {
        console.error("[similar-news] Empty response from API")
        return NextResponse.json(
          {
            error: "Empty response from similar news service",
            code: "EMPTY_RESPONSE",
          } as ErrorResponse,
          { status: 502 },
        )
      }

      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[similar-news] Failed to parse API response:", parseError)
      return NextResponse.json(
        {
          error: "Invalid response from similar news service. Please try again.",
          code: "PARSE_ERROR",
        } as ErrorResponse,
        { status: 502 },
      )
    }

    // Validate response structure
    if (!data || typeof data !== "object") {
      console.error("[similar-news] Invalid response structure:", data)
      return NextResponse.json(
        {
          error: "Invalid response format from similar news service",
          code: "INVALID_FORMAT",
        } as ErrorResponse,
        {
          status: 502,
        },
      )
    }

    console.log(`[similar-news] Successful response:`, {
      status: data.status,
      dataCount: data.data?.length || 0,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("[similar-news] Unexpected error:", error)

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
