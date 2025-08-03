import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

interface TargetRequest {
  target_url: string
}

interface TargetResponse {
  uid: string
  status: string
}

interface ErrorResponse {
  error: string
  details?: string
  code?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body: TargetRequest
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[add-target] Failed to parse request body:", parseError)
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: "PARSE_ERROR",
        } as ErrorResponse,
        { status: 400 },
      )
    }

    // Validate the request body
    if (!body.target_url || typeof body.target_url !== "string") {
      console.error("[add-target] Invalid request body:", body)
      return NextResponse.json(
        {
          error: "Invalid request: target_url is required and must be a string",
          code: "VALIDATION_ERROR",
        } as ErrorResponse,
        { status: 400 },
      )
    }

    // Clean and validate URL
    const cleanUrl = body.target_url.trim()
    if (!cleanUrl) {
      return NextResponse.json(
        {
          error: "URL cannot be empty",
          code: "EMPTY_URL",
        } as ErrorResponse,
        { status: 400 },
      )
    }

    // Validate URL format
    try {
      const urlObj = new URL(cleanUrl)
      // Ensure it's HTTP or HTTPS
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return NextResponse.json(
          {
            error: "URL must use HTTP or HTTPS protocol",
            code: "INVALID_PROTOCOL",
          } as ErrorResponse,
          { status: 400 },
        )
      }
    } catch (urlError) {
      console.error("[add-target] URL validation failed:", urlError)
      return NextResponse.json(
        {
          error: "Invalid URL format. Please enter a valid URL starting with http:// or https://",
          code: "INVALID_URL_FORMAT",
        } as ErrorResponse,
        { status: 400 },
      )
    }

    console.log(`[add-target] Making API request to backend for URL: ${cleanUrl}`)

    // Make request to the actual API using configuration
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

    const apiEndpoint = buildApiUrl(API_CONFIG.ENDPOINTS.ADD_TARGET)
    console.log(`[add-target] API endpoint: ${apiEndpoint}`)

    let response: Response
    try {
      response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          ...API_CONFIG.HEADERS,
          Accept: "application/json",
        },
        body: JSON.stringify({ target_url: cleanUrl }),
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("[add-target] Fetch error:", fetchError)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return NextResponse.json(
            {
              error: "Request timeout. The analysis service is taking too long to respond.",
              code: "TIMEOUT_ERROR",
            } as ErrorResponse,
            { status: 504 },
          )
        }

        if (fetchError.message.includes("ENOTFOUND") || fetchError.message.includes("ECONNREFUSED")) {
          return NextResponse.json(
            {
              error: "Unable to connect to analysis service. Please try again later.",
              code: "CONNECTION_ERROR",
              details: "The backend service appears to be unavailable",
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
    console.log(`[add-target] API response status: ${response.status}`)

    // Handle non-OK responses with detailed error handling
    if (!response.ok) {
      let errorMessage = "Failed to process request"
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`
      let errorCode = `HTTP_${response.status}`

      try {
        const errorData = await response.text()
        console.error(`[add-target] API error response (${response.status}): ${errorData}`)

        // Try to parse as JSON for structured error
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
          // If not JSON, use the text as details
          if (errorData && errorData.length < 500) {
            errorDetails = errorData
          }
        }

        // Handle specific error messages from backend
        if (errorData.includes("Failed to insert record")) {
          errorMessage = "Database error: Unable to save analysis request"
          errorCode = "DATABASE_INSERT_ERROR"
          errorDetails = "The backend database is experiencing issues. This could be temporary."
        } else if (errorData.includes("duplicate") || errorData.includes("already exists")) {
          errorMessage = "This URL is already being analyzed"
          errorCode = "DUPLICATE_REQUEST"
          errorDetails = "Please wait for the current analysis to complete or check your history."
        } else if (errorData.includes("rate limit") || errorData.includes("too many")) {
          errorMessage = "Rate limit exceeded"
          errorCode = "RATE_LIMIT_ERROR"
          errorDetails = "Too many requests. Please wait before submitting another analysis."
        }
      } catch (readError) {
        console.error("[add-target] Failed to read error response:", readError)
      }

      // Handle specific status codes
      if (response.status === 400) {
        return NextResponse.json(
          {
            error: "Invalid request format. Please check your URL and try again.",
            details: errorDetails,
            code: errorCode,
          } as ErrorResponse,
          { status: 400 },
        )
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded. Please wait a moment before trying again.",
            code: "RATE_LIMIT",
            details: "Too many analysis requests in a short time period",
          } as ErrorResponse,
          { status: 429 },
        )
      }

      if (response.status >= 500) {
        return NextResponse.json(
          {
            error: "Analysis service is temporarily unavailable. Please try again in a few minutes.",
            code: errorCode,
            details: errorDetails,
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
    let data: TargetResponse
    try {
      const responseText = await response.text()
      console.log(`[add-target] API response body: ${responseText}`)

      if (!responseText || responseText.trim() === "") {
        console.error("[add-target] Empty response from API")
        return NextResponse.json(
          {
            error: "Empty response from analysis service",
            code: "EMPTY_RESPONSE",
          } as ErrorResponse,
          { status: 502 },
        )
      }

      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[add-target] Failed to parse API response:", parseError)
      return NextResponse.json(
        {
          error: "Invalid response from analysis service. Please try again.",
          code: "RESPONSE_PARSE_ERROR",
        } as ErrorResponse,
        { status: 502 },
      )
    }

    // Validate response structure
    if (!data || typeof data !== "object") {
      console.error("[add-target] Invalid response structure:", data)
      return NextResponse.json(
        {
          error: "Invalid response format from analysis service",
          code: "INVALID_RESPONSE_FORMAT",
        } as ErrorResponse,
        {
          status: 502,
        },
      )
    }

    if (!data.uid || !data.status) {
      console.error("[add-target] Missing required fields in response:", data)
      return NextResponse.json(
        {
          error: "Incomplete response from analysis service",
          code: "INCOMPLETE_RESPONSE",
          details: `Missing fields: ${!data.uid ? "uid" : ""} ${!data.status ? "status" : ""}`.trim(),
        } as ErrorResponse,
        {
          status: 502,
        },
      )
    }

    console.log(`[add-target] Successful API response: uid=${data.uid}, status=${data.status}`)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[add-target] Unexpected error in proxy API:", error)

    // Handle different types of errors
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
        details: error instanceof Error ? error.message : "Unknown error",
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
