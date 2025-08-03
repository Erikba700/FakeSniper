import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

interface HistoryItem {
  title: string
  keywords: string
  uid: string
  create_date: string
  status_code: number
  summary?: string // Add summary field
  url?: string // Add URL field for better handling
  image?: string // Add image field for page screenshot
}

interface HistoryResponse {
  history: HistoryItem[]
  total_pages: number
}

interface ErrorResponse {
  error: string
  details?: string
  code?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "20"

    console.log(`[GET /api/get-history] Fetching history: page=${page}, limit=${limit}`)

    // Make request to the backend API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

    const apiEndpoint = buildApiUrl("/get_history")
    const requestUrl = `${apiEndpoint}?page=${page}&limit=${limit}`

    console.log(`[GET /api/get-history] API endpoint: ${requestUrl}`)

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
      console.error("[GET /api/get-history] Fetch error:", fetchError)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          console.error("[GET /api/get-history] Request timeout")
          return NextResponse.json(
            {
              history: [],
              total_pages: 0,
              message: "Request timeout. The history service is taking too long to respond.",
              error_type: "timeout_error",
            } as HistoryResponse & { message: string; error_type: string },
            { status: 200 },
          )
        }

        if (fetchError.message.includes("ENOTFOUND") || fetchError.message.includes("ECONNREFUSED")) {
          console.error("[GET /api/get-history] Connection refused")
          return NextResponse.json(
            {
              history: [],
              total_pages: 0,
              message: "Unable to connect to history service. Please try again later.",
              error_type: "connection_error",
            } as HistoryResponse & { message: string; error_type: string },
            { status: 200 },
          )
        }
      }

      return NextResponse.json(
        {
          history: [],
          total_pages: 0,
          message: "Network error occurred. Please check your connection and try again.",
          error_type: "network_error",
        } as HistoryResponse & { message: string; error_type: string },
        { status: 200 },
      )
    }

    clearTimeout(timeoutId)

    // Log detailed response information
    console.log(`[GET /api/get-history] ===== RESPONSE DETAILS =====`)
    console.log(`[GET /api/get-history] Status: ${response.status} ${response.statusText}`)
    console.log(`[GET /api/get-history] Headers:`, Object.fromEntries(response.headers.entries()))
    console.log(`[GET /api/get-history] URL: ${response.url}`)
    console.log(`[GET /api/get-history] OK: ${response.ok}`)

    // Get the response text for logging
    let responseText: string
    try {
      responseText = await response.text()
      console.log(`[GET /api/get-history] ===== RAW RESPONSE =====`)
      console.log(`[GET /api/get-history] Response length: ${responseText.length} characters`)
      console.log(`[GET /api/get-history] Raw response:`)
      console.log(responseText)
      console.log(`[GET /api/get-history] ===== END RAW RESPONSE =====`)
    } catch (textError) {
      console.error("[GET /api/get-history] Failed to read response text:", textError)
      return NextResponse.json(
        {
          history: [],
          total_pages: 0,
          message: "Failed to read response from history service",
          error_type: "read_error",
          technical_details: textError instanceof Error ? textError.message : "Unknown read error",
        } as HistoryResponse & { message: string; error_type: string; technical_details: string },
        { status: 200 },
      )
    }

    // Handle non-OK responses
    if (!response.ok) {
      console.log(`[GET /api/get-history] ===== ERROR RESPONSE ANALYSIS =====`)
      console.log(`[GET /api/get-history] Error response text: "${responseText}"`)
      console.log(`[GET /api/get-history] Error response trimmed: "${responseText.trim()}"`)
      console.log(`[GET /api/get-history] Error response length: ${responseText.length}`)
      console.log(
        `[GET /api/get-history] Contains 'Failed to scan record': ${responseText.includes("Failed to scan record")}`,
      )

      let errorMessage = "Failed to fetch history"
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`
      let errorCode: string | undefined = undefined

      // Check for database scan failure - this is the main issue we're addressing
      const isDbScanError =
        responseText.includes("Failed to scan record") ||
        responseText.toLowerCase().includes("scan record") ||
        responseText.toLowerCase().includes("failed to scan") ||
        responseText.includes("scan error") ||
        responseText.trim() === "Failed to scan record"

      if (isDbScanError) {
        console.log("[GET /api/get-history] ✅ Database scan error detected - returning empty history")
        return NextResponse.json(
          {
            history: [],
            total_pages: 0,
            message:
              "Database scan operation failed. This is a temporary issue that usually resolves automatically within a few minutes. The database may be under maintenance or experiencing high load.",
            error_type: "database_scan_error",
            technical_details: `Raw error: "${responseText.trim()}"`,
          } as HistoryResponse & { message: string; error_type: string; technical_details: string },
          { status: 200 },
        )
      }

      // Handle other database-related errors
      const isDbError =
        responseText.includes("database") ||
        responseText.includes("query") ||
        responseText.includes("connection") ||
        responseText.includes("timeout") ||
        responseText.toLowerCase().includes("db error") ||
        responseText.toLowerCase().includes("sql")

      if (isDbError) {
        console.log("[GET /api/get-history] Database error detected - returning empty history")
        return NextResponse.json(
          {
            history: [],
            total_pages: 0,
            message:
              "Database is temporarily experiencing issues. This could be due to maintenance, connectivity problems, or high server load. Please try again in a few minutes.",
            error_type: "database_error",
            technical_details: responseText.substring(0, 200),
          } as HistoryResponse & { message: string; error_type: string; technical_details: string },
          { status: 200 },
        )
      }

      // Handle empty or no records found
      if (
        responseText.includes("No records found") ||
        responseText.includes("empty") ||
        responseText.includes("not found") ||
        responseText.toLowerCase().includes("no data")
      ) {
        console.log("[GET /api/get-history] No records found in database")
        return NextResponse.json(
          {
            history: [],
            total_pages: 0,
            message: "No analysis history found in database. Start analyzing articles to build your history.",
            error_type: "no_data",
          } as HistoryResponse & { message: string; error_type: string },
          { status: 200 },
        )
      }

      // Try to parse as JSON for structured error
      try {
        const parsedError = JSON.parse(responseText)
        console.log("[GET /api/get-history] Parsed error JSON:", parsedError)
        if (parsedError.error) {
          errorMessage = parsedError.error
        }
        if (parsedError.message) {
          errorDetails = parsedError.message
        }
        if (parsedError.code) {
          errorCode = parsedError.code
        }
      } catch (jsonError) {
        console.log("[GET /api/get-history] Response is not JSON, treating as plain text error")
        if (responseText && responseText.length < 500) {
          errorDetails = responseText
        }
      }

      // Handle specific HTTP status codes
      if (response.status === 404) {
        console.log("[GET /api/get-history] No history found (404)")
        return NextResponse.json(
          {
            history: [],
            total_pages: 0,
            message: "No history found - the history endpoint may not be available",
            error_type: "not_found",
          } as HistoryResponse & { message: string; error_type: string },
          { status: 200 },
        )
      }

      if (response.status >= 500) {
        console.error(`[GET /api/get-history] Server error: ${response.status}`)
        return NextResponse.json(
          {
            history: [],
            total_pages: 0,
            message:
              "History service is temporarily unavailable. The server may be restarting, under maintenance, or experiencing high load.",
            error_type: "server_error",
            technical_details: `HTTP ${response.status}: ${response.statusText} - ${responseText.substring(0, 200)}`,
          } as HistoryResponse & { message: string; error_type: string; technical_details: string },
          { status: 200 },
        )
      }

      // For any other errors, return empty data with generic message
      console.log(`[GET /api/get-history] Unhandled error: ${errorMessage}`)
      return NextResponse.json(
        {
          history: [],
          total_pages: 0,
          message: "Unable to fetch history data. Please try again later.",
          error_type: "unknown_error",
          technical_details: errorDetails,
        } as HistoryResponse & { message: string; error_type: string; technical_details: string },
        { status: 200 },
      )
    }

    // Parse successful response
    console.log(`[GET /api/get-history] ===== SUCCESS RESPONSE PARSING =====`)

    if (!responseText || responseText.trim() === "") {
      console.log("[GET /api/get-history] Empty response - returning empty history")
      return NextResponse.json({
        history: [],
        total_pages: 0,
        message: "No data available - empty response from service",
        error_type: "empty_response",
      } as HistoryResponse & { message: string; error_type: string })
    }

    let data: HistoryResponse
    try {
      console.log(`[GET /api/get-history] Attempting to parse JSON response...`)
      data = JSON.parse(responseText)
      console.log(`[GET /api/get-history] ✅ Successfully parsed JSON`)
      console.log(`[GET /api/get-history] Parsed data structure:`, {
        hasHistory: Array.isArray(data.history),
        historyLength: Array.isArray(data.history) ? data.history.length : "not array",
        totalPages: data.total_pages,
        dataKeys: Object.keys(data),
      })

      // Log first item structure if available
      if (Array.isArray(data.history) && data.history.length > 0) {
        console.log(`[GET /api/get-history] First history item structure:`, {
          keys: Object.keys(data.history[0]),
          sample: data.history[0],
        })
      }
    } catch (parseError) {
      console.error("[GET /api/get-history] ❌ Failed to parse JSON response:", parseError)
      console.log("[GET /api/get-history] Response that failed to parse:", responseText.substring(0, 1000))
      return NextResponse.json(
        {
          history: [],
          total_pages: 0,
          message: "Invalid response from history service - unable to parse data",
          error_type: "parse_error",
          technical_details: parseError instanceof Error ? parseError.message : "JSON parse failed",
        } as HistoryResponse & { message: string; error_type: string; technical_details: string },
        { status: 200 },
      )
    }

    // Validate response structure
    if (!data || typeof data !== "object") {
      console.error("[GET /api/get-history] Invalid response structure:", data)
      return NextResponse.json(
        {
          history: [],
          total_pages: 0,
          message: "Invalid response format from history service",
          error_type: "invalid_format",
          technical_details: `Received: ${typeof data}`,
        } as HistoryResponse & { message: string; error_type: string; technical_details: string },
        { status: 200 },
      )
    }

    // Ensure history is an array (even if empty)
    if (!Array.isArray(data.history)) {
      console.warn("[GET /api/get-history] History is not an array, converting:", typeof data.history)
      data.history = []
    }

    // Ensure total_pages is a number
    if (typeof data.total_pages !== "number") {
      console.warn("[GET /api/get-history] total_pages is not a number, defaulting:", data.total_pages)
      data.total_pages = data.history.length > 0 ? 1 : 0
    }

    // Process each history item to ensure proper structure
    console.log(`[GET /api/get-history] Processing ${data.history.length} history items...`)
    data.history = data.history.map((item: any, index: number) => {
      console.log(`[GET /api/get-history] Processing item ${index}:`, {
        title: item.title,
        uid: item.uid,
        hasImage: !!item.image,
        imageLength: item.image ? item.image.length : 0,
        keys: Object.keys(item),
      })

      // Ensure all required fields exist
      const processedItem: HistoryItem = {
        title: item.title || item.url || "Unknown Article",
        keywords: item.keywords || "[]",
        uid: item.uid || `unknown_${Date.now()}_${index}`,
        create_date: item.create_date || new Date().toISOString(),
        status_code: typeof item.status_code === "number" ? item.status_code : 500,
        summary: item.summary || "",
        url: item.url || item.title,
        image: item.image || "",
      }

      return processedItem
    })

    // Log final statistics
    const itemsWithImages = data.history.filter((item) => item.image && item.image.trim() !== "").length
    const itemsWithSummary = data.history.filter((item) => item.summary && item.summary.trim() !== "").length

    console.log(`[GET /api/get-history] ===== FINAL RESPONSE STATS =====`)
    console.log(`[GET /api/get-history] Total items: ${data.history.length}`)
    console.log(`[GET /api/get-history] Items with images: ${itemsWithImages}`)
    console.log(`[GET /api/get-history] Items with summaries: ${itemsWithSummary}`)
    console.log(`[GET /api/get-history] Total pages: ${data.total_pages}`)
    console.log(`[GET /api/get-history] ===== END STATS =====`)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/get-history] ===== UNEXPECTED ERROR =====")
    console.error("[GET /api/get-history] Error:", error)
    console.error("[GET /api/get-history] Error stack:", error instanceof Error ? error.stack : "No stack")

    // Check if the error message contains the scan failure
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    if (errorMessage.includes("Failed to scan record") || errorMessage.includes("scan record")) {
      console.log("[GET /api/get-history] ✅ Caught database scan error in main catch block")
      return NextResponse.json(
        {
          history: [],
          total_pages: 0,
          message:
            "Database scan operation failed. This is a temporary issue that usually resolves automatically within a few minutes.",
          error_type: "database_scan_error",
          technical_details: errorMessage,
        } as HistoryResponse & { message: string; error_type: string; technical_details: string },
        { status: 200 },
      )
    }

    // Always return a valid response structure, even for unexpected errors
    return NextResponse.json(
      {
        history: [],
        total_pages: 0,
        message: "An unexpected error occurred while fetching history",
        error_type: "unexpected_error",
        technical_details: errorMessage,
      } as HistoryResponse & { message: string; error_type: string; technical_details: string },
      { status: 200 },
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
