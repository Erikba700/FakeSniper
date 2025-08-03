"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Shield, Zap, Eye, TrendingUp, AlertCircle, RefreshCw, Clock, ExternalLink } from "lucide-react"
import { Footer } from "@/components/footer"

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

export default function HomePage() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingChecks, setIsLoadingChecks] = useState(false)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()

  const validateUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString)
      return ["http:", "https:"].includes(url.protocol)
    } catch {
      return false
    }
  }

  const handleLastChecks = () => {
    setIsLoadingChecks(true)
    // Simulate loading time to show the loading state
    setTimeout(() => {
      router.push("/last-checks")
    }, 800)
  }

  const getErrorMessage = (errorResponse: ErrorResponse): string => {
    const { error, details, code } = errorResponse

    // Handle specific error codes with user-friendly messages
    switch (code) {
      case "DATABASE_INSERT_ERROR":
        return "⚠️ Database Error: Unable to save your analysis request. The service may be experiencing high load. Please try again in a few moments."

      case "DUPLICATE_REQUEST":
        return "🔄 This URL is already being analyzed. Please check your analysis history or wait for the current analysis to complete."

      case "RATE_LIMIT_ERROR":
      case "RATE_LIMIT":
        return "⏱️ Rate Limit: Too many requests. Please wait a moment before submitting another analysis."

      case "CONNECTION_ERROR":
        return "🌐 Connection Error: Unable to reach the analysis service. Please check your internet connection and try again."

      case "TIMEOUT_ERROR":
        return "⏰ Timeout: The analysis service is taking too long to respond. Please try again."

      case "INVALID_URL_FORMAT":
        return "🔗 Invalid URL: Please enter a valid URL starting with http:// or https://"

      case "EMPTY_URL":
        return "📝 Empty URL: Please enter a URL to analyze."

      case "VALIDATION_ERROR":
        return "❌ Validation Error: Please check your input and try again."

      default:
        // Fallback to original error message with details if available
        let message = error || "An unexpected error occurred"
        if (details && details !== error) {
          message += ` (${details})`
        }
        return message
    }
  }

  const handleCheck = async (isRetry = false) => {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      setError("Please enter a URL to analyze")
      return
    }

    if (!validateUrl(trimmedUrl)) {
      setError("Please enter a valid URL starting with http:// or https://")
      return
    }

    setIsLoading(true)
    setError("")

    if (!isRetry) {
      setRetryCount(0)
    }

    try {
      const requestData: TargetRequest = {
        target_url: trimmedUrl,
      }

      console.log("[HomePage] Sending request to proxy API:", requestData)

      const response = await fetch("/api/add-target", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log("[HomePage] Proxy API response status:", response.status)

      const data: TargetResponse | ErrorResponse = await response.json()
      console.log("[HomePage] Proxy API response data:", data)

      if (!response.ok) {
        const errorData = data as ErrorResponse
        const errorMessage = getErrorMessage(errorData)
        setError(errorMessage)
        return
      }

      const successData = data as TargetResponse

      if (successData.status === "success" && successData.uid) {
        console.log("[HomePage] Analysis started successfully, redirecting to analysis page")

        // Generate session ID if not exists
        let sessionId = localStorage.getItem("sessionId")
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem("sessionId", sessionId)
        }

        // Save to local storage for last checks with session ID
        const checkData = {
          uid: successData.uid,
          url: trimmedUrl,
          timestamp: new Date().toISOString(),
          status: "analyzing",
          sessionId: sessionId,
        }

        const existingChecks = JSON.parse(localStorage.getItem("lastChecks") || "[]")
        existingChecks.unshift(checkData)
        // Keep only last 50 checks
        const limitedChecks = existingChecks.slice(0, 50)
        localStorage.setItem("lastChecks", JSON.stringify(limitedChecks))

        // Redirect directly to analysis page (same as check now)
        router.push(`/analysis?uid=${successData.uid}&url=${encodeURIComponent(trimmedUrl)}`)
      } else {
        setError(`Unexpected response: ${successData.status || "Unknown status"}`)
      }
    } catch (err) {
      console.error("[HomePage] Client-side error:", err)

      let errorMessage = "Unable to connect to the analysis service"

      if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "🌐 Network error. Please check your internet connection and try again."
      } else if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    handleCheck(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && url.trim() && !isLoading) {
      handleCheck()
    }
  }

  const clearError = () => {
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Fake Sniper Logo" className="h-10 w-auto" />
            <div>
              <span className="text-2xl font-bold text-gray-900">FAKE SNIPER</span>
              <p className="text-xs text-gray-600 -mt-1">AI DETECTOR FOR FAKE NEWS</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="hidden sm:flex bg-white/50"
            onClick={handleLastChecks}
            disabled={isLoadingChecks}
          >
            {isLoadingChecks ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Last Checks</span>
              </div>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Detect Fake News with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {" "}
                FAKE SNIPER
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Advanced artificial intelligence analyzes news articles to help you identify misinformation and verify
              credibility in seconds.
            </p>
          </div>

          {/* URL Input Form */}
          <Card className="p-8 mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="Paste news article URL here... (e.g., https://example.com/article)"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    if (error) clearError()
                  }}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-14 text-lg px-6 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleCheck()}
                  disabled={!url.trim() || isLoading}
                  className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Check Now</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Enhanced Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-700 text-sm font-medium">Analysis Error</p>
                      <p className="text-red-600 text-sm mt-1 whitespace-pre-line">{error}</p>

                      {/* Show retry button for certain errors */}
                      {(error.includes("Database Error") ||
                        error.includes("Connection Error") ||
                        error.includes("Timeout") ||
                        error.includes("service") ||
                        error.includes("500") ||
                        error.includes("503")) && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={handleRetry}
                            disabled={isLoading}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry {retryCount > 0 && `(${retryCount})`}
                          </Button>

                          {/* Help link for database errors */}
                          {error.includes("Database Error") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 bg-transparent"
                              onClick={() => window.open("/last-checks", "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Check History
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 mt-4">
                Supports articles from major news websites and social media platforms
              </p>
            </div>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Deep Analysis</h3>
              <p className="text-gray-600">
                AI examines content, sources, and context to provide comprehensive credibility assessment
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Scoring</h3>
              <p className="text-gray-600">
                Get instant credibility scores and detailed breakdowns of potential misinformation
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Source Verification</h3>
              <p className="text-gray-600">
                Verify publisher credibility and cross-reference with trusted news sources
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
