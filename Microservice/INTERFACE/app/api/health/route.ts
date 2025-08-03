import { NextResponse } from "next/server"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

export async function GET() {
  try {
    // Test connection to the backend API base URL
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const baseUrl = API_CONFIG.BASE_URL
    const addTargetUrl = buildApiUrl(API_CONFIG.ENDPOINTS.ADD_TARGET)

    console.log(`Testing API base URL: ${baseUrl}`)
    console.log(`Testing add-target endpoint: ${addTargetUrl}`)

    // Test base URL connectivity
    const baseResponse = await fetch(baseUrl, {
      method: "GET",
      headers: API_CONFIG.HEADERS,
      signal: controller.signal,
    }).catch(() => null)

    // Test add-target endpoint connectivity
    const targetResponse = await fetch(addTargetUrl, {
      method: "GET", // Just to test connectivity
      headers: API_CONFIG.HEADERS,
      signal: controller.signal,
    }).catch(() => null)

    clearTimeout(timeoutId)

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      config: {
        baseUrl: API_CONFIG.BASE_URL,
        addTargetEndpoint: addTargetUrl,
      },
      backend: {
        baseUrl: {
          status: baseResponse ? "reachable" : "unreachable",
          statusCode: baseResponse?.status || "no response",
        },
        addTarget: {
          status: targetResponse ? "reachable" : "unreachable",
          statusCode: targetResponse?.status || "no response",
          note: targetResponse?.status === 405 ? "Endpoint exists but only accepts POST" : undefined,
        },
      },
      proxy: "working",
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      config: {
        baseUrl: API_CONFIG.BASE_URL,
        addTargetEndpoint: buildApiUrl(API_CONFIG.ENDPOINTS.ADD_TARGET),
      },
      backend: {
        status: "error",
      },
      proxy: "working",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
