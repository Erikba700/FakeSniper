"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Tag,
  Globe,
  FileText,
  MessageSquare,
  Database,
  AlertCircle,
  Info,
  ImageIcon,
  Eye,
  Server,
  WifiOff,
} from "lucide-react"
import { Footer } from "@/components/footer"

interface HistoryItem {
  title: string
  keywords: string
  uid: string
  create_date: string
  status_code: number
  summary?: string
  url?: string
  image?: string // Add image field for page screenshot
}

interface HistoryResponse {
  history: HistoryItem[]
  total_pages: number
  message?: string
  error_type?: string
  technical_details?: string
}

export default function LastChecksPage() {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<
    "unknown" | "available" | "unavailable" | "scan_error" | "maintenance"
  >("unknown")
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [technicalDetails, setTechnicalDetails] = useState("")

  const fetchHistory = async (page = 1) => {
    try {
      setError("")
      setTechnicalDetails("")
      if (page === 1) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      console.log(`Fetching history from database for page ${page}`)

      const response = await fetch(`/api/get-history?page=${page}&limit=20`)

      // Always expect 200 response now, check for error_type in data
      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`)

        // Try to get error details from response
        let errorMessage = "Unable to connect to the database service"
        try {
          const errorText = await response.text()
          console.log("Error response text:", errorText)

          if (errorText.includes("Failed to scan record") || errorText.includes("scan record")) {
            errorMessage =
              "Database scan operation failed. This is a temporary issue that usually resolves automatically within a few minutes. The database may be under maintenance or experiencing high load."
            setDatabaseStatus("scan_error")
          } else {
            setDatabaseStatus("unavailable")
          }
          setTechnicalDetails(errorText)
        } catch (parseErr) {
          console.error("Failed to parse error response:", parseErr)
          setDatabaseStatus("unavailable")
        }

        setError(errorMessage)
        setHistoryData([])
        setTotalPages(0)
        return
      }

      const data: HistoryResponse = await response.json()
      console.log("API response data:", data)

      // Check for error types in the response
      if (data.error_type) {
        console.log(`Database error type: ${data.error_type}`)

        // Store technical details for debugging
        if (data.technical_details) {
          setTechnicalDetails(data.technical_details)
        }

        switch (data.error_type) {
          case "database_scan_error":
            setError(
              "Database scan operation failed. This is a temporary issue that usually resolves automatically within a few minutes. The database may be under maintenance, experiencing high load, or connectivity problems.",
            )
            setDatabaseStatus("scan_error")
            break
          case "database_error":
            setError(
              "Database is temporarily experiencing issues. This could be due to maintenance, connectivity problems, or high server load. Please wait a few minutes and try again.",
            )
            setDatabaseStatus("unavailable")
            break
          case "server_error":
            setError(
              "History service is temporarily unavailable. The server may be restarting, under maintenance, or experiencing high load.",
            )
            setDatabaseStatus("unavailable")
            break
          case "read_error":
            setError(
              "Unable to read database response. The service may be temporarily overloaded or experiencing connectivity issues.",
            )
            setDatabaseStatus("unavailable")
            break
          case "parse_error":
            setError(
              "Invalid response from history service. The service may be experiencing issues or returning malformed data.",
            )
            setDatabaseStatus("unavailable")
            break
          case "invalid_format":
            setError("Invalid response format from history service. Please try refreshing the page.")
            setDatabaseStatus("unavailable")
            break
          case "timeout_error":
            setError(
              "Request timeout - the history service is taking too long to respond. This may indicate high server load.",
            )
            setDatabaseStatus("unavailable")
            break
          case "connection_error":
            setError("Unable to connect to history service. Please check your internet connection and try again.")
            setDatabaseStatus("unavailable")
            break
          case "network_error":
            setError("Network error occurred. Please check your connection and try again.")
            setDatabaseStatus("unavailable")
            break
          case "not_found":
            setError("History endpoint not found. The service may be temporarily unavailable.")
            setDatabaseStatus("unavailable")
            break
          case "no_data":
            setError("No analysis history found in database. Start analyzing articles to build your history.")
            setDatabaseStatus("available") // Database is working, just no data
            break
          case "empty_response":
            setError("Empty response from service. The database may be temporarily unavailable.")
            setDatabaseStatus("unavailable")
            break
          case "unknown_error":
            setError("An unknown error occurred while fetching history. Please try again.")
            setDatabaseStatus("unavailable")
            break
          case "unexpected_error":
            setError("An unexpected system error occurred. Please try refreshing the page.")
            setDatabaseStatus("unavailable")
            break
          default:
            setError(data.message || "An error occurred while fetching history from the database.")
            setDatabaseStatus("unavailable")
        }

        setHistoryData([])
        setTotalPages(0)
        return
      }

      // Successful response
      setHistoryData(data.history || [])
      setTotalPages(data.total_pages || 0)
      setCurrentPage(page)
      setDatabaseStatus("available")

      console.log(`Loaded ${data.history?.length || 0} items from database, page ${page} of ${data.total_pages || 0}`)

      // Log image statistics
      const itemsWithImages = (data.history || []).filter((item) => item.image && item.image.trim() !== "").length
      console.log(`Items with screenshots: ${itemsWithImages}/${data.history?.length || 0}`)

      // If no data found but no error, show appropriate message
      if (!data.history || data.history.length === 0) {
        if (data.message) {
          setError(data.message)
        } else {
          setError("No analysis history found in database. Start analyzing articles to build your history.")
        }
        setDatabaseStatus("available") // Database is working, just no data
      } else {
        setError("") // Clear any previous errors
      }
    } catch (err) {
      console.error("Error fetching history from database:", err)

      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"

      // Check if the error message contains database scan failure
      if (errorMessage.includes("Failed to scan record") || errorMessage.includes("scan record")) {
        setError(
          "Database scan operation failed. This is a temporary issue that usually resolves automatically within a few minutes. The database may be under maintenance or experiencing high load.",
        )
        setDatabaseStatus("scan_error")
        setTechnicalDetails("Database record scanning failed - typically occurs during maintenance or high load")
      } else if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
        setError("Network connection error. Please check your internet connection and try again.")
        setDatabaseStatus("unavailable")
        setTechnicalDetails(`Network error: ${errorMessage}`)
      } else {
        setError(`Database connection error: ${errorMessage}`)
        setDatabaseStatus("unavailable")
        setTechnicalDetails(errorMessage)
      }

      setHistoryData([])
      setTotalPages(0)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Simulate loading time to show the loading state
    setTimeout(() => {
      fetchHistory(1)
    }, 1000)
  }, [])

  const handleRefresh = () => {
    fetchHistory(currentPage)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchHistory(page)
    }
  }

  const handleImageError = (uid: string) => {
    setImageErrors((prev) => new Set(prev).add(uid))
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) return "Just now"
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const parseKeywords = (keywordsString: string): string[] => {
    if (!keywordsString || keywordsString.trim() === "") return []

    try {
      // Try to parse as JSON array first
      let parsedKeywords: string[] = []

      // Handle different possible formats
      if (keywordsString.startsWith("[") && keywordsString.endsWith("]")) {
        // It's a JSON array string
        parsedKeywords = JSON.parse(keywordsString)
      } else if (keywordsString.includes(",")) {
        // It's a comma-separated string
        parsedKeywords = keywordsString.split(",").map((k) => k.trim())
      } else {
        // Single keyword
        parsedKeywords = [keywordsString.trim()]
      }

      // Decode unicode escapes and clean up
      return parsedKeywords
        .map((keyword) => {
          if (typeof keyword === "string") {
            // Decode unicode escape sequences
            try {
              // Replace unicode escape sequences like \u0041 with actual characters
              const decoded = keyword.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
                return String.fromCharCode(Number.parseInt(code, 16))
              })

              // Handle other common escape sequences
              return decoded
                .replace(/\\n/g, " ")
                .replace(/\\t/g, " ")
                .replace(/\\r/g, " ")
                .replace(/\\\\/g, "\\")
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'")
                .trim()
            } catch (e) {
              console.warn("Failed to decode keyword:", keyword, e)
              return keyword.trim()
            }
          }
          return String(keyword).trim()
        })
        .filter((keyword) => keyword.length > 0 && keyword !== "null" && keyword !== "undefined")
    } catch (error) {
      console.warn("Failed to parse keywords:", keywordsString, error)

      // Fallback: treat as comma-separated string
      return keywordsString
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0)
    }
  }

  const decodeUnicodeString = (str: string): string => {
    try {
      // Handle Python-style unicode strings
      if (str.includes("\\u")) {
        return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
          return String.fromCharCode(Number.parseInt(code, 16))
        })
      }

      // Handle other escape sequences
      return str
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r")
        .replace(/\\\\/g, "\\")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
    } catch (e) {
      console.warn("Failed to decode unicode string:", str, e)
      return str
    }
  }

  const extractDisplayInfo = (
    item: HistoryItem,
  ): { displayTitle: string; displaySummary: string; url: string | null; hasRealTitle: boolean; hasImage: boolean } => {
    // Check if we have a real title (not just a URL)
    const urlRegex = /^https?:\/\/.+/i
    const hasRealTitle = item.title && !urlRegex.test(item.title)
    const hasImage = !!(item.image && item.image.trim() !== "" && !imageErrors.has(item.uid))

    let displayTitle = ""
    let displaySummary = item.summary || ""
    let url = item.url || item.title

    if (hasRealTitle) {
      // We have a real title, use it
      displayTitle = item.title
    } else if (item.title && urlRegex.test(item.title)) {
      // Title is a URL, extract domain for display
      try {
        const urlObj = new URL(item.title)
        const domain = urlObj.hostname.replace("www.", "")
        displayTitle = `Article from ${domain}`
        url = item.title
      } catch {
        displayTitle = item.title || "Unknown Article"
      }
    } else {
      displayTitle = "Unknown Article"
    }

    // Decode unicode characters in title and summary
    displayTitle = decodeUnicodeString(displayTitle)
    displaySummary = decodeUnicodeString(displaySummary)

    return {
      displayTitle,
      displaySummary,
      url: urlRegex.test(url || "") ? url : null,
      hasRealTitle,
      hasImage,
    }
  }

  const getStatusInfo = (statusCode: number) => {
    if (statusCode === 200) {
      return {
        icon: <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />,
        text: "Processing...",
        color: "bg-blue-100 text-blue-800",
        description: "Data collection in progress",
      }
    } else if (statusCode === 404) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
        text: "Not Found",
        color: "bg-orange-100 text-orange-800",
        description: "Content not accessible",
      }
    } else if (statusCode === 500) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
        text: "Error",
        color: "bg-red-100 text-red-800",
        description: "Analysis failed",
      }
    } else {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: "Completed",
        color: "bg-green-100 text-green-800",
        description: "Analysis completed",
      }
    }
  }

  const truncateText = (text: string, maxLength = 60) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // Enhanced component for rendering title, summary, and image
  const TitleSummaryAndImage = ({
    item,
    maxTitleLength = 120,
    maxSummaryLength = 200,
  }: {
    item: HistoryItem
    maxTitleLength?: number
    maxSummaryLength?: number
  }) => {
    const { displayTitle, displaySummary, hasRealTitle, hasImage } = extractDisplayInfo(item)

    return (
      <div className="mb-3">
        {/* Main content area with image and text */}
        <div className={`flex ${hasImage ? "space-x-4" : ""} mb-3`}>
          {/* Screenshot Image */}
          {hasImage && (
            <div className="flex-shrink-0">
              <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={`Screenshot of ${displayTitle}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={() => handleImageError(item.uid)}
                  loading="lazy"
                />
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <ImageIcon className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Page Screenshot</span>
              </div>
            </div>
          )}

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-start space-x-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-700 block mb-1">
                  {hasRealTitle ? "News Article:" : "Source:"}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 leading-tight" title={displayTitle}>
                  {truncateText(displayTitle, maxTitleLength)}
                </h3>
              </div>
            </div>

            {/* Summary */}
            {displaySummary && (
              <div className="ml-6 mt-2">
                <div className="flex items-start space-x-2">
                  <MessageSquare className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-1">
                    <p className="text-sm text-gray-600 leading-relaxed italic" title={displaySummary}>
                      {truncateText(displaySummary, maxSummaryLength)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image placeholder for items without screenshots */}
        {!hasImage && item.image && item.image.trim() !== "" && imageErrors.has(item.uid) && (
          <div className="ml-6 mb-2">
            <div className="flex items-center space-x-2 text-gray-400 text-xs">
              <ImageIcon className="h-3 w-3" />
              <span>Screenshot unavailable</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const getDatabaseStatusIcon = () => {
    switch (databaseStatus) {
      case "available":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "unavailable":
        return <WifiOff className="h-5 w-5 text-red-600" />
      case "scan_error":
        return <Server className="h-5 w-5 text-orange-600" />
      case "maintenance":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Database className="h-5 w-5 text-gray-600" />
    }
  }

  const getDatabaseStatusText = () => {
    switch (databaseStatus) {
      case "available":
        return "Database Connected"
      case "unavailable":
        return "Database Unavailable"
      case "scan_error":
        return "Database Scan Error"
      case "maintenance":
        return "Database Maintenance"
      default:
        return "Database Status Unknown"
    }
  }

  const getDatabaseStatusColor = () => {
    switch (databaseStatus) {
      case "available":
        return "text-green-600"
      case "unavailable":
        return "text-red-600"
      case "scan_error":
        return "text-orange-600"
      case "maintenance":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading history from database...</p>
          <p className="text-gray-500 text-sm mt-1">Fetching your analysis records</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Fake Sniper Logo" className="h-8 w-auto" />
            <div>
              <span className="font-semibold text-gray-900">FAKE SNIPER</span>
              <p className="text-xs text-gray-500 -mt-0.5">AI DETECTOR</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {getDatabaseStatusIcon()}
                <h1 className="text-3xl font-bold text-gray-900">Database History</h1>
              </div>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Analysis records from database ({historyData.length} on this page)</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getDatabaseStatusIcon()}
                  <span className={`text-sm font-medium ${getDatabaseStatusColor()}`}>{getDatabaseStatusText()}</span>
                </div>
                {/* Show screenshot statistics */}
                {historyData.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm">
                      {
                        historyData.filter(
                          (item) => item.image && item.image.trim() !== "" && !imageErrors.has(item.uid),
                        ).length
                      }{" "}
                      screenshots
                    </span>
                  </div>
                )}
              </div>
              {totalPages > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Page {currentPage} of {totalPages} • Total pages remaining: {totalPages - currentPage}
                </p>
              )}
            </div>
            <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing} className="bg-white/50">
              {isRefreshing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  <span>Refreshing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </div>
              )}
            </Button>
          </div>

          {/* Database Status Card */}
          {databaseStatus !== "available" && (
            <Card
              className={`p-6 mb-8 ${
                databaseStatus === "scan_error"
                  ? "bg-orange-50 border-orange-200"
                  : databaseStatus === "maintenance"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start space-x-3">
                {getDatabaseStatusIcon()}
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-1 ${
                      databaseStatus === "scan_error"
                        ? "text-orange-900"
                        : databaseStatus === "maintenance"
                          ? "text-yellow-900"
                          : "text-red-900"
                    }`}
                  >
                    {databaseStatus === "scan_error"
                      ? "Database Scan Error Detected"
                      : databaseStatus === "maintenance"
                        ? "Database Maintenance Mode"
                        : "Database Issue Detected"}
                  </h3>
                  <p
                    className={`text-sm mb-3 ${
                      databaseStatus === "scan_error"
                        ? "text-orange-800"
                        : databaseStatus === "maintenance"
                          ? "text-yellow-800"
                          : "text-red-800"
                    }`}
                  >
                    {error}
                  </p>

                  {/* Technical Details */}
                  {technicalDetails && (
                    <div
                      className={`text-xs p-2 rounded border mb-3 ${
                        databaseStatus === "scan_error"
                          ? "bg-orange-100 border-orange-200 text-orange-700"
                          : databaseStatus === "maintenance"
                            ? "bg-yellow-100 border-yellow-200 text-yellow-700"
                            : "bg-red-100 border-red-200 text-red-700"
                      }`}
                    >
                      <strong>Technical Details:</strong> {technicalDetails}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => fetchHistory(currentPage)}
                      size="sm"
                      variant="outline"
                      className={`${
                        databaseStatus === "scan_error"
                          ? "text-orange-600 border-orange-300 hover:bg-orange-50 bg-transparent"
                          : databaseStatus === "maintenance"
                            ? "text-yellow-600 border-yellow-300 hover:bg-yellow-50 bg-transparent"
                            : "text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                      }`}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      {databaseStatus === "scan_error" ? "Retry Scan" : "Retry Connection"}
                    </Button>
                    <Link href="/">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 bg-transparent"
                      >
                        Start New Analysis
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Error Message for available database with no data */}
          {error && databaseStatus === "available" && (
            <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">No History Available</h3>
                  <p className="text-blue-800 text-sm mb-3">{error}</p>
                  <Link href="/">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 bg-transparent"
                    >
                      Start Your First Analysis
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* History List */}
          {historyData.length === 0 && !error ? (
            <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No database records found</h3>
              <p className="text-gray-600 mb-6">
                No analysis history available in the database. Start analyzing news articles to build your history.
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Check Your First Article
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {historyData.map((item) => {
                const statusInfo = getStatusInfo(item.status_code)
                const keywords = parseKeywords(item.keywords)
                const { url, hasImage } = extractDisplayInfo(item)

                // Special handling for 200 status - show news title with processing state
                if (item.status_code === 200) {
                  return (
                    <Card key={item.uid} className="p-6 bg-blue-50 border-blue-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          {/* Processing Status */}
                          <div className="flex items-center space-x-3 mb-4">
                            {statusInfo.icon}
                            <Badge className={`${statusInfo.color} border-0`}>{statusInfo.text}</Badge>
                            <span className="text-xs text-blue-600 font-medium">Analysis in progress...</span>
                            {hasImage && (
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3 text-blue-500" />
                                <span className="text-xs text-blue-600">Screenshot captured</span>
                              </div>
                            )}
                          </div>

                          {/* Title, Summary, and Image - Enhanced Component */}
                          <TitleSummaryAndImage item={item} />

                          {/* URL Link */}
                          {url && (
                            <div className="mb-3">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-2 transition-colors text-sm"
                                title={url}
                              >
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <span className="break-all">
                                  {url.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                                </span>
                                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                              </a>
                            </div>
                          )}

                          {/* Processing Info */}
                          <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-blue-800 text-sm font-medium">
                              🔍 AI is currently analyzing this article for:
                            </p>
                            <ul className="text-blue-700 text-xs mt-2 ml-4 list-disc space-y-1">
                              <li>Content credibility and factual accuracy</li>
                              <li>Source reliability and reputation</li>
                              <li>Potential bias and misinformation patterns</li>
                            </ul>
                          </div>

                          {/* Meta info */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(item.create_date)}</span>
                            </span>
                            <span className="text-xs">ID: {item.uid.substring(0, 8)}...</span>
                            <span className="text-xs text-blue-600">Status: {item.status_code}</span>
                          </div>
                        </div>

                        {/* Actions - Now goes to analysis page like check now */}
                        <div className="flex flex-col items-end space-y-2 ml-4 flex-shrink-0">
                          <Link
                            href={`/analysis?uid=${item.uid}&url=${encodeURIComponent(url || item.title)}&from=history`}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs bg-transparent border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              View Analysis
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )
                }

                // Special handling for 500 errors - show simplified danger block
                if (item.status_code === 500) {
                  return (
                    <Card
                      key={item.uid}
                      className="p-6 bg-red-50 border-red-200 hover:shadow-lg transition-shadow border-l-4 border-l-red-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          {/* Danger Status */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <Badge className="bg-red-100 text-red-800 border-0 font-semibold">ANALYSIS FAILED</Badge>
                              <p className="text-xs text-red-600 font-medium mt-1">
                                Unable to analyze - please try again later
                              </p>
                            </div>
                          </div>

                          {/* Title, Summary, and Image - Enhanced Component */}
                          <TitleSummaryAndImage item={item} />

                          {/* URL Link */}
                          {url && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Globe className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-medium text-red-700">Source Link:</span>
                              </div>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-600 hover:text-red-800 hover:underline flex items-center space-x-2 transition-colors"
                                title={url}
                              >
                                <span className="break-all text-sm font-medium">
                                  {url.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                                </span>
                                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                              </a>
                            </div>
                          )}

                          {/* Error Message */}
                          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-red-800 text-sm font-semibold mb-2">
                                  Server Error - Analysis Could Not Be Completed
                                </p>
                                <p className="text-red-700 text-xs mb-2">This could be due to:</p>
                                <ul className="text-red-700 text-xs ml-4 list-disc space-y-1">
                                  <li>Website is temporarily unavailable or blocked</li>
                                  <li>Content requires login or subscription</li>
                                  <li>Server overload or maintenance in progress</li>
                                  <li>Network connectivity issues</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Meta info */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(item.create_date)}</span>
                            </span>
                            <span className="text-xs">ID: {item.uid.substring(0, 8)}...</span>
                            <span className="text-xs text-red-600 font-medium">Status: {item.status_code} ERROR</span>
                          </div>
                        </div>

                        {/* Retry Action */}
                        <div className="flex flex-col items-end space-y-2 ml-4 flex-shrink-0">
                          <a href="/" className="inline-block">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs bg-transparent border-red-300 text-red-600 hover:bg-red-50 font-medium"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Try Again
                            </Button>
                          </a>
                        </div>
                      </div>
                    </Card>
                  )
                }

                // Normal card rendering for other statuses - now goes to analysis page
                return (
                  <Card key={item.uid} className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        {/* Status */}
                        <div className="flex items-center space-x-3 mb-4">
                          {statusInfo.icon}
                          <Badge className={`${statusInfo.color} border-0`}>{statusInfo.text}</Badge>
                          <span className="text-xs text-gray-500">{statusInfo.description}</span>
                          {hasImage && (
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Screenshot available</span>
                            </div>
                          )}
                          {url && (
                            <div className="flex items-center space-x-1 ml-auto">
                              <Globe className="h-3 w-3 text-gray-400" />
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 transition-colors"
                                title={url}
                              >
                                <span className="max-w-[200px] truncate">
                                  {url.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                                </span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Title, Summary, and Image - Enhanced Component */}
                        <TitleSummaryAndImage item={item} />

                        {/* Keywords */}
                        {keywords.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500 font-medium">Keywords:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {keywords.slice(0, 8).map((keyword, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                              {keywords.length > 8 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500"
                                  title={keywords.slice(8).join(", ")}
                                >
                                  +{keywords.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(item.create_date)}</span>
                          </span>
                          <span className="text-xs">ID: {item.uid.substring(0, 8)}...</span>
                          <span className="text-xs">Status: {item.status_code}</span>
                        </div>
                      </div>

                      {/* Actions - All go to analysis page now */}
                      <div className="flex flex-col items-end space-y-2 ml-4 flex-shrink-0">
                        <Link
                          href={`/analysis?uid=${item.uid}&url=${encodeURIComponent(url || item.title)}&from=history`}
                        >
                          <Button size="sm" variant="outline" className="text-xs bg-transparent">
                            View Analysis
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="p-4 mt-8 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isRefreshing}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isRefreshing}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isRefreshing}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-6 mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start space-x-3">
              {getDatabaseStatusIcon()}
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Database History with Screenshots</h3>
                <p className="text-blue-800 text-sm">
                  This page shows analysis history directly from the database with real news titles, summaries, and page
                  screenshots when available. Status codes: 200 = Processing, 404 = Not Found, 500 = Error, Others =
                  Completed.
                  {totalPages > currentPage && ` ${totalPages - currentPage} pages remaining to load.`}
                  {databaseStatus !== "available" && " Database connection issues may affect data availability."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
