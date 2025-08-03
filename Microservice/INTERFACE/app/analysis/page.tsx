"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Globe,
  CheckCircle,
  Clock,
  Tag,
  FileText,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Home,
  Loader2,
  XCircle,
  ImageIcon,
  Eye,
  ExternalLink,
  Newspaper,
  LinkIcon,
  Shield,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import { Suspense, useEffect, useState } from "react"
import { Footer } from "@/components/footer"

interface CredentialsResponse {
  title?: string
  keywords?: string // JSON string format like "[\"China\", \"agriculture\"]"
  summary?: string
  image?: string // S3 URL for screenshot
  status?: number
  message?: string
  retry?: boolean
}

interface SimilarNewsItem {
  target: string
  title: string
}

interface SimilarNewsResponse {
  status?: number
  data?: SimilarNewsItem[] // Изменено с results на data
}

interface ScoreResponse {
  score: number
  score_short: string
  status_code: number
}

interface AnalysisState {
  phase: "initializing" | "fetching" | "processing" | "completed" | "error" | "retrying"
  title?: string
  summary?: string
  keywords?: string[]
  image?: string
  error?: string
  errorCode?: string
  retryCount: number
  isPolling: boolean
  imageLoaded?: boolean
  imageError?: boolean
  similarNews?: SimilarNewsItem[]
  similarNewsLoading?: boolean
  similarNewsError?: string
  similarNewsRetryCount?: number
  score?: number
  scoreShort?: string
  scoreLoading?: boolean
  scoreError?: string
  scoreRetryCount?: number
  scoreStatus?: number
}

function AnalysisContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const uid = searchParams.get("uid") || ""
  const url = searchParams.get("url") || ""

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    phase: "initializing",
    retryCount: 0,
    isPolling: false,
    imageLoaded: false,
    imageError: false,
    similarNews: [],
    similarNewsLoading: false,
    similarNewsError: undefined,
    similarNewsRetryCount: 0,
    score: undefined,
    scoreShort: undefined,
    scoreLoading: false,
    scoreError: undefined,
    scoreRetryCount: 0,
    scoreStatus: undefined,
  })

  // Maximum retry attempts and polling interval
  const MAX_RETRIES = 100
  const POLL_INTERVAL = 3000 // 3 seconds
  const SIMILAR_NEWS_MAX_RETRIES = 20
  const SIMILAR_NEWS_POLL_INTERVAL = 5000 // 5 seconds
  const SCORE_MAX_RETRIES = 20
  const SCORE_POLL_INTERVAL = 4000 // 4 seconds

  const updateAnalysisState = (updates: Partial<AnalysisState>) => {
    setAnalysisState((prev) => ({ ...prev, ...updates }))
  }

  const fetchScore = async () => {
    if (!uid) {
      console.log(`[Score] No UID provided, skipping score fetch`)
      return
    }

    try {
      console.log(`[Score] 🔄 Fetching score for UID: ${uid} (attempt ${(analysisState.scoreRetryCount || 0) + 1})`)

      updateAnalysisState({
        scoreLoading: true,
        scoreError: undefined,
      })

      const response = await fetch(`/api/get-score?uid=${uid}`)
      const responseText = await response.text()
      console.log(`[Score] 📥 Raw response (${response.status}):`, responseText)

      if (!response.ok) {
        console.error(`[Score] ❌ API request failed: ${response.status} ${response.statusText}`)

        // If we get an error, continue polling (might be temporary)
        if ((analysisState.scoreRetryCount || 0) < SCORE_MAX_RETRIES) {
          updateAnalysisState({
            scoreError: `Loading credibility score... (${response.status})`,
            scoreRetryCount: (analysisState.scoreRetryCount || 0) + 1,
            scoreLoading: true,
          })
          setTimeout(() => fetchScore(), SCORE_POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            scoreError: "Unable to load credibility score at this time",
            scoreLoading: false,
          })
          return
        }
      }

      if (!responseText || responseText.trim() === "") {
        console.error(`[Score] ❌ Empty response received`)
        if ((analysisState.scoreRetryCount || 0) < SCORE_MAX_RETRIES) {
          updateAnalysisState({
            scoreError: "Waiting for score data...",
            scoreRetryCount: (analysisState.scoreRetryCount || 0) + 1,
            scoreLoading: true,
          })
          setTimeout(() => fetchScore(), SCORE_POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            scoreError: "Empty response from score service",
            scoreLoading: false,
          })
          return
        }
      }

      // Parse successful response
      let data: ScoreResponse
      try {
        data = JSON.parse(responseText)
        console.log(`[Score] ✅ Parsed JSON data:`, data)
      } catch (parseError) {
        console.error(`[Score] ❌ Failed to parse JSON:`, parseError)
        if ((analysisState.scoreRetryCount || 0) < SCORE_MAX_RETRIES) {
          updateAnalysisState({
            scoreError: "Processing score data...",
            scoreRetryCount: (analysisState.scoreRetryCount || 0) + 1,
            scoreLoading: true,
          })
          setTimeout(() => fetchScore(), SCORE_POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            scoreError: "Invalid response format from score service",
            scoreLoading: false,
          })
          return
        }
      }

      // Handle status 300 - continue polling but show current score
      if (data.status_code === 300) {
        console.log(`[Score] 📝 Score still processing (status: 300), showing current data...`)

        updateAnalysisState({
          score: data.score,
          scoreShort: data.score_short || undefined,
          scoreStatus: 300,
          scoreError: undefined,
          scoreRetryCount: (analysisState.scoreRetryCount || 0) + 1,
          scoreLoading: true, // Keep loading state for status 300
        })

        // Continue polling for status 200
        if ((analysisState.scoreRetryCount || 0) < SCORE_MAX_RETRIES) {
          setTimeout(() => fetchScore(), SCORE_POLL_INTERVAL)
          return
        } else {
          // Max retries reached, stop polling but keep current data
          updateAnalysisState({
            scoreLoading: false,
            scoreError: "Score analysis completed with available data",
          })
          return
        }
      }

      // Handle status 200 - final results, stop polling
      if (data.status_code === 200) {
        console.log(`[Score] 🎉 Score analysis completed! (status: 200)`)

        updateAnalysisState({
          score: data.score,
          scoreShort: data.score_short,
          scoreStatus: 200,
          scoreLoading: false,
          scoreError: undefined,
        })

        console.log(`[Score] 🛑 SCORE COMPLETE - Stopping polling`)
        return // Stop polling completely
      }

      // Handle other statuses
      console.log(`[Score] ⚠️ Unexpected status: ${data.status_code}`)

      updateAnalysisState({
        score: data.score,
        scoreShort: data.score_short || undefined,
        scoreStatus: data.status_code,
        scoreLoading: false,
        scoreError: undefined,
      })
    } catch (error) {
      console.error(`[Score] 💥 Unexpected error:`, error)

      if ((analysisState.scoreRetryCount || 0) < SCORE_MAX_RETRIES) {
        updateAnalysisState({
          scoreError: `Connection issue, retrying... (${(analysisState.scoreRetryCount || 0) + 1}/${SCORE_MAX_RETRIES})`,
          scoreRetryCount: (analysisState.scoreRetryCount || 0) + 1,
          scoreLoading: true,
        })
        setTimeout(() => fetchScore(), SCORE_POLL_INTERVAL)
      } else {
        updateAnalysisState({
          scoreError: error instanceof Error ? error.message : "An unexpected error occurred",
          scoreLoading: false,
        })
      }
    }
  }

  const fetchSimilarNews = async () => {
    if (!uid) {
      console.log(`[SimilarNews] No UID provided, skipping similar news fetch`)
      return
    }

    try {
      console.log(
        `[SimilarNews] 🔄 Fetching similar news for UID: ${uid} (attempt ${(analysisState.similarNewsRetryCount || 0) + 1})`,
      )

      updateAnalysisState({
        similarNewsLoading: true,
        similarNewsError: undefined,
      })

      const response = await fetch(`/api/similar-news?uid=${uid}`)
      const responseText = await response.text()
      console.log(`[SimilarNews] 📥 Raw response (${response.status}):`, responseText)

      if (!response.ok) {
        console.error(`[SimilarNews] ❌ API request failed: ${response.status} ${response.statusText}`)

        // If we get an error, continue polling (might be temporary)
        if ((analysisState.similarNewsRetryCount || 0) < SIMILAR_NEWS_MAX_RETRIES) {
          updateAnalysisState({
            similarNewsError: `Loading similar news... (${response.status})`,
            similarNewsRetryCount: (analysisState.similarNewsRetryCount || 0) + 1,
            similarNewsLoading: true,
          })
          setTimeout(() => fetchSimilarNews(), SIMILAR_NEWS_POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            similarNewsError: "Unable to load similar news at this time",
            similarNewsLoading: false,
          })
          return
        }
      }

      if (!responseText || responseText.trim() === "") {
        console.error(`[SimilarNews] ❌ Empty response received`)
        if ((analysisState.similarNewsRetryCount || 0) < SIMILAR_NEWS_MAX_RETRIES) {
          updateAnalysisState({
            similarNewsError: "Waiting for similar news data...",
            similarNewsRetryCount: (analysisState.similarNewsRetryCount || 0) + 1,
            similarNewsLoading: true,
          })
          setTimeout(() => fetchSimilarNews(), SIMILAR_NEWS_POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            similarNewsError: "Empty response from similar news service",
            similarNewsLoading: false,
          })
          return
        }
      }

      // Parse successful response
      let data: SimilarNewsResponse
      try {
        data = JSON.parse(responseText)
        console.log(`[SimilarNews] ✅ Parsed JSON data:`, data)
      } catch (parseError) {
        console.error(`[SimilarNews] ❌ Failed to parse JSON:`, parseError)
        if ((analysisState.similarNewsRetryCount || 0) < SIMILAR_NEWS_MAX_RETRIES) {
          updateAnalysisState({
            similarNewsError: "Processing similar news data...",
            similarNewsRetryCount: (analysisState.similarNewsRetryCount || 0) + 1,
            similarNewsLoading: true,
          })
          setTimeout(() => fetchSimilarNews(), SIMILAR_NEWS_POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            similarNewsError: "Invalid response format from similar news service",
            similarNewsLoading: false,
          })
          return
        }
      }

      // Handle status 300 - continue polling but update data dynamically
      if (data.status === 300) {
        console.log(`[SimilarNews] 📝 Similar news still processing (status: 300), but updating data...`)

        // Update with current data (even if partial)
        const currentData = data.data || []
        console.log(`[SimilarNews] 📊 Updating with ${currentData.length} articles (status 300)`)

        updateAnalysisState({
          similarNews: currentData,
          similarNewsError: undefined,
          similarNewsRetryCount: (analysisState.similarNewsRetryCount || 0) + 1,
          similarNewsLoading: true, // Keep loading state for status 300
        })

        // Continue polling for status 200
        if ((analysisState.similarNewsRetryCount || 0) < SIMILAR_NEWS_MAX_RETRIES) {
          setTimeout(() => fetchSimilarNews(), SIMILAR_NEWS_POLL_INTERVAL)
          return
        } else {
          // Max retries reached, stop polling but keep current data
          updateAnalysisState({
            similarNewsLoading: false,
            similarNewsError: "Search completed with available results",
          })
          return
        }
      }

      // Handle status 200 - final results, stop polling
      if (data.status === 200) {
        console.log(`[SimilarNews] 🎉 Similar news search completed! (status: 200)`)

        const finalData = data.data || []
        console.log(`[SimilarNews] 📊 Final results: ${finalData.length} articles`)

        updateAnalysisState({
          similarNews: finalData,
          similarNewsLoading: false,
          similarNewsError: undefined,
        })

        console.log(`[SimilarNews] 🛑 SIMILAR NEWS COMPLETE - Stopping polling`)
        return // Stop polling completely
      }

      // Handle other statuses
      console.log(`[SimilarNews] ⚠️ Unexpected status: ${data.status}`)

      const currentData = data.data || []
      if (currentData.length > 0) {
        // We have some data, use it
        updateAnalysisState({
          similarNews: currentData,
          similarNewsLoading: false,
          similarNewsError: undefined,
        })
      } else {
        // No data and unexpected status
        if ((analysisState.similarNewsRetryCount || 0) < SIMILAR_NEWS_MAX_RETRIES) {
          updateAnalysisState({
            similarNewsError: "Searching for similar news...",
            similarNewsRetryCount: (analysisState.similarNewsRetryCount || 0) + 1,
            similarNewsLoading: true,
          })
          setTimeout(() => fetchSimilarNews(), SIMILAR_NEWS_POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            similarNewsError: "No similar news found for this article",
            similarNewsLoading: false,
          })
          return
        }
      }
    } catch (error) {
      console.error(`[SimilarNews] 💥 Unexpected error:`, error)

      if ((analysisState.similarNewsRetryCount || 0) < SIMILAR_NEWS_MAX_RETRIES) {
        updateAnalysisState({
          similarNewsError: `Connection issue, retrying... (${(analysisState.similarNewsRetryCount || 0) + 1}/${SIMILAR_NEWS_MAX_RETRIES})`,
          similarNewsRetryCount: (analysisState.similarNewsRetryCount || 0) + 1,
          similarNewsLoading: true,
        })
        setTimeout(() => fetchSimilarNews(), SIMILAR_NEWS_POLL_INTERVAL)
      } else {
        updateAnalysisState({
          similarNewsError: error instanceof Error ? error.message : "An unexpected error occurred",
          similarNewsLoading: false,
        })
      }
    }
  }

  const checkCredentials = async () => {
    // If analysis is already completed, don't poll
    if (analysisState.phase === "completed") {
      console.log(`[Analysis] ✅ Analysis already completed, skipping polling`)
      return
    }

    if (!uid) {
      console.error(`[Analysis] ❌ No UID provided`)
      updateAnalysisState({
        phase: "error",
        error: "No analysis UID provided",
        errorCode: "NO_UID",
        isPolling: false,
      })
      return
    }

    try {
      console.log(`[Analysis] 🔄 Checking credentials for UID: ${uid} (attempt ${analysisState.retryCount + 1})`)

      updateAnalysisState({
        phase: "processing",
        error: undefined,
        errorCode: undefined,
        isPolling: true,
      })

      // Make request to the correct endpoint format
      const response = await fetch(`/api/check-credentials?uid=${uid}`)
      const responseText = await response.text()
      console.log(`[Analysis] 📥 Raw response (${response.status}):`, responseText)

      if (!response.ok) {
        console.error(`[Analysis] ❌ API request failed: ${response.status} ${response.statusText}`)

        // If we get an error, continue polling (might be temporary)
        if (analysisState.retryCount < MAX_RETRIES) {
          updateAnalysisState({
            phase: "processing",
            error: `Waiting for analysis to complete... (${response.status})`,
            retryCount: analysisState.retryCount + 1,
            isPolling: true,
          })
          setTimeout(() => checkCredentials(), POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            phase: "error",
            error: "Analysis is taking too long to complete. Please try again later.",
            errorCode: "TIMEOUT",
            isPolling: false,
          })
          return
        }
      }

      if (!responseText || responseText.trim() === "") {
        console.error(`[Analysis] ❌ Empty response received`)
        if (analysisState.retryCount < MAX_RETRIES) {
          updateAnalysisState({
            phase: "processing",
            error: "Waiting for analysis data...",
            retryCount: analysisState.retryCount + 1,
            isPolling: true,
          })
          setTimeout(() => checkCredentials(), POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            phase: "error",
            error: "Empty response from analysis service",
            errorCode: "EMPTY_RESPONSE",
            isPolling: false,
          })
          return
        }
      }

      // Parse successful response
      let data: CredentialsResponse
      try {
        data = JSON.parse(responseText)
        console.log(`[Analysis] ✅ Parsed JSON data:`, data)

        // Check if we have ALL required data INCLUDING image - if so, complete immediately
        if (data.title && data.summary && data.keywords && data.image) {
          console.log(`[Analysis] 🎉 ALL DATA INCLUDING IMAGE RECEIVED! Analysis complete!`)

          // Parse keywords from JSON string format
          let parsedKeywords: string[] = []
          if (data.keywords) {
            try {
              parsedKeywords = JSON.parse(data.keywords)
              console.log(`[Analysis] 📋 Parsed keywords:`, parsedKeywords)
            } catch (keywordError) {
              console.warn(`[Analysis] ⚠️ Failed to parse keywords JSON, trying fallback:`, keywordError)
              parsedKeywords = data.keywords
                .replace(/[[\]"]/g, "")
                .split(",")
                .map((k) => k.trim())
                .filter((k) => k.length > 0)
            }
          }

          updateAnalysisState({
            phase: "completed",
            title: data.title,
            summary: data.summary,
            keywords: parsedKeywords,
            image: data.image,
            error: undefined,
            errorCode: undefined,
            isPolling: false,
            imageLoaded: false,
            imageError: false,
          })

          console.log(`[Analysis] 🛑 ANALYSIS COMPLETE - Stopping polling`)

          // Start fetching similar news and score once analysis is complete
          console.log(`[Analysis] 🚀 Starting similar news and score fetch`)
          setTimeout(() => {
            fetchSimilarNews()
            fetchScore()
          }, 1000)

          return // Stop polling immediately
        }

        // Check if we have text data but no image yet
        else if (data.title && data.summary && data.keywords && !data.image) {
          console.log(`[Analysis] 📝 Text data complete, waiting for image...`)

          // Parse keywords
          let parsedKeywords: string[] = []
          if (data.keywords) {
            try {
              parsedKeywords = JSON.parse(data.keywords)
            } catch (keywordError) {
              parsedKeywords = data.keywords
                .replace(/[[\]"]/g, "")
                .split(",")
                .map((k) => k.trim())
                .filter((k) => k.length > 0)
            }
          }

          // Update with text data and continue polling for image
          updateAnalysisState({
            phase: "processing",
            title: data.title,
            summary: data.summary,
            keywords: parsedKeywords,
            image: undefined,
            retryCount: analysisState.retryCount + 1,
            isPolling: true,
          })

          if (analysisState.retryCount < MAX_RETRIES) {
            setTimeout(() => checkCredentials(), POLL_INTERVAL)
          } else {
            // If we have text data but no image after max retries, complete anyway
            console.log(`[Analysis] ⏰ Max retries reached, completing without image`)
            updateAnalysisState({
              phase: "completed",
              title: data.title,
              summary: data.summary,
              keywords: parsedKeywords,
              image: undefined,
              error: undefined,
              errorCode: undefined,
              isPolling: false,
            })

            // Start fetching similar news and score even without image
            setTimeout(() => {
              fetchSimilarNews()
              fetchScore()
            }, 1000)
          }
          return
        }
      } catch (parseError) {
        console.error(`[Analysis] ❌ Failed to parse JSON:`, parseError)
        if (analysisState.retryCount < MAX_RETRIES) {
          updateAnalysisState({
            phase: "processing",
            error: "Processing response data...",
            retryCount: analysisState.retryCount + 1,
            isPolling: true,
          })
          setTimeout(() => checkCredentials(), POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            phase: "error",
            error: "Invalid response format from analysis service",
            errorCode: "PARSE_ERROR",
            isPolling: false,
          })
          return
        }
      }

      // Handle special case where record is not found but analysis is initializing
      if (data.status === 404 || data.status === 205 || data.retry) {
        console.log(`[Analysis] 📝 Analysis still processing (status: ${data.status || "no status"})`)

        if (analysisState.retryCount < MAX_RETRIES) {
          updateAnalysisState({
            phase: "processing",
            error: undefined,
            retryCount: analysisState.retryCount + 1,
            isPolling: true,
          })
          setTimeout(() => checkCredentials(), POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            phase: "error",
            error: "Analysis is taking too long to complete. Please try again later.",
            errorCode: "TIMEOUT",
            isPolling: false,
          })
          return
        }
      }

      // Check if we have meaningful data (any of the main fields)
      const hasData = data.title || data.summary || data.keywords || data.image
      if (!hasData) {
        console.log(`[Analysis] ⏳ No data received yet, continuing polling...`)

        if (analysisState.retryCount < MAX_RETRIES) {
          updateAnalysisState({
            phase: "processing",
            error: "Waiting for analysis data...",
            retryCount: analysisState.retryCount + 1,
            isPolling: true,
          })
          setTimeout(() => checkCredentials(), POLL_INTERVAL)
          return
        } else {
          updateAnalysisState({
            phase: "error",
            error: "Analysis is taking too long to complete. The service may be overloaded.",
            errorCode: "TIMEOUT",
            isPolling: false,
          })
          return
        }
      }

      // Parse keywords from JSON string format
      let parsedKeywords: string[] = []
      if (data.keywords) {
        try {
          // Parse the JSON string like "[\"China\", \"agriculture\"]"
          parsedKeywords = JSON.parse(data.keywords)
          console.log(`[Analysis] 📋 Parsed keywords:`, parsedKeywords)
        } catch (keywordError) {
          console.warn(`[Analysis] ⚠️ Failed to parse keywords JSON, trying fallback:`, keywordError)
          // Fallback: treat as comma-separated string
          parsedKeywords = data.keywords
            .replace(/[[\]"]/g, "") // Remove brackets and quotes
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0)
        }
      }

      // Check if we have ALL required data INCLUDING image
      if (data.title && data.summary && data.keywords && data.image) {
        console.log(`[Analysis] 🎉 ALL DATA INCLUDING IMAGE RECEIVED! Analysis complete!`)

        updateAnalysisState({
          phase: "completed",
          title: data.title,
          summary: data.summary,
          keywords: parsedKeywords,
          image: data.image, // S3 URL for screenshot
          error: undefined,
          errorCode: undefined,
          isPolling: false,
          imageLoaded: false,
          imageError: false,
        })

        console.log(`[Analysis] 🛑 ANALYSIS COMPLETE - Stopping polling`)
        console.log(`[Analysis] 📊 Final data:`, {
          title: data.title?.substring(0, 50) + "...",
          summary: data.summary?.substring(0, 100) + "...",
          keywordsCount: parsedKeywords.length,
          hasImage: !!data.image,
          imageUrl: data.image?.substring(0, 50) + "...",
        })

        // Start fetching similar news and score
        setTimeout(() => {
          fetchSimilarNews()
          fetchScore()
        }, 1000)

        return // Stop polling
      }
      // Check if we have text data but no image yet
      else if (data.title && data.summary && data.keywords && !data.image) {
        console.log(`[Analysis] 📝 Text data complete, waiting for image...`)

        // Update with text data and continue polling for image
        updateAnalysisState({
          phase: "processing",
          title: data.title,
          summary: data.summary,
          keywords: parsedKeywords,
          image: undefined, // No image yet
          retryCount: analysisState.retryCount + 1,
          isPolling: true,
        })

        if (analysisState.retryCount < MAX_RETRIES) {
          setTimeout(() => checkCredentials(), POLL_INTERVAL)
        } else {
          // If we have text data but no image after max retries, complete anyway
          console.log(`[Analysis] ⏰ Max retries reached, completing without image`)
          updateAnalysisState({
            phase: "completed",
            title: data.title,
            summary: data.summary,
            keywords: parsedKeywords,
            image: undefined,
            error: undefined,
            errorCode: undefined,
            isPolling: false,
          })

          // Start fetching similar news and score even without image
          setTimeout(() => {
            fetchSimilarNews()
            fetchScore()
          }, 1000)
        }
        return
      }
      // Partial data - continue polling
      else {
        console.log(`[Analysis] ⏳ Partial data received, continuing polling...`)
        console.log(
          `[Analysis] Has title: ${!!data.title}, Has summary: ${!!data.summary}, Has keywords: ${!!data.keywords}, Has image: ${!!data.image}`,
        )

        // Update with partial data if available
        const updates: Partial<AnalysisState> = {
          phase: "processing",
          retryCount: analysisState.retryCount + 1,
          isPolling: true,
        }

        if (data.title) updates.title = data.title
        if (data.summary) updates.summary = data.summary
        if (data.image) updates.image = data.image
        if (data.keywords) {
          updates.keywords = parsedKeywords
        }

        updateAnalysisState(updates)

        if (analysisState.retryCount < MAX_RETRIES) {
          setTimeout(() => checkCredentials(), POLL_INTERVAL)
        } else {
          updateAnalysisState({
            phase: "error",
            error: "Analysis is taking too long to complete. The service may be overloaded.",
            errorCode: "TIMEOUT",
            isPolling: false,
          })
        }
      }
    } catch (error) {
      console.error(`[Analysis] 💥 Unexpected error:`, error)

      if (analysisState.retryCount < MAX_RETRIES) {
        updateAnalysisState({
          phase: "processing",
          error: `Connection issue, retrying... (${analysisState.retryCount + 1}/${MAX_RETRIES})`,
          retryCount: analysisState.retryCount + 1,
          isPolling: true,
        })
        setTimeout(() => checkCredentials(), POLL_INTERVAL)
      } else {
        updateAnalysisState({
          phase: "error",
          error: error instanceof Error ? error.message : "An unexpected error occurred",
          errorCode: "UNEXPECTED_ERROR",
          isPolling: false,
        })
      }
    }
  }

  useEffect(() => {
    if (uid) {
      console.log(`[Analysis] 🚀 Starting analysis for UID: ${uid}`)

      // Check if we're coming from history with potentially complete data
      const urlParams = new URLSearchParams(window.location.search)
      const fromHistory = urlParams.get("from") === "history"

      if (fromHistory) {
        console.log(`[Analysis] 📚 Coming from history, checking for complete data immediately`)
        updateAnalysisState({ phase: "fetching" })
        setTimeout(() => checkCredentials(), 500) // Shorter delay for history items
      } else {
        console.log(`[Analysis] 🆕 New analysis, starting with normal flow`)
        updateAnalysisState({ phase: "initializing" })
        setTimeout(() => checkCredentials(), 1000)
      }
    } else {
      console.error(`[Analysis] ❌ No UID provided`)
      updateAnalysisState({
        phase: "error",
        error: "No analysis UID provided",
        errorCode: "NO_UID",
      })
    }

    // Cleanup function to stop polling when component unmounts
    return () => {
      console.log(`[Analysis] 🧹 Component unmounting, stopping polling`)
      updateAnalysisState({
        isPolling: false,
        similarNewsLoading: false,
        scoreLoading: false,
      })
    }
  }, [uid])

  const decodeUnicodeString = (str: string): string => {
    if (!str) return ""

    try {
      let decoded = str
        .replace(/&#8211;/g, "–")
        .replace(/&#8212;/g, "—")
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')

      if (decoded.includes("\\u")) {
        decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
          return String.fromCharCode(Number.parseInt(code, 16))
        })
      }

      return decoded
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r")
        .replace(/\\\\/g, "\\\\")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
    } catch (e) {
      console.warn("Failed to decode unicode string:", str, e)
      return str
    }
  }

  const processKeywords = (keywords: string[]): string[] => {
    if (!Array.isArray(keywords)) return []

    return keywords
      .map((keyword) => {
        if (typeof keyword === "string") {
          return decodeUnicodeString(keyword.trim())
        }
        return String(keyword).trim()
      })
      .filter((keyword) => keyword.length > 0 && keyword !== "null" && keyword !== "undefined")
      .slice(0, 12)
  }

  const handleRetry = () => {
    console.log(`[Analysis] 🔄 Manual retry requested`)
    updateAnalysisState({
      phase: "initializing",
      error: undefined,
      errorCode: undefined,
      retryCount: 0,
      isPolling: false,
      imageLoaded: false,
      imageError: false,
      similarNews: [],
      similarNewsLoading: false,
      similarNewsError: undefined,
      similarNewsRetryCount: 0,
      score: undefined,
      scoreShort: undefined,
      scoreLoading: false,
      scoreError: undefined,
      scoreRetryCount: 0,
      scoreStatus: undefined,
    })
    setTimeout(() => checkCredentials(), 500)
  }

  const handleImageLoad = () => {
    updateAnalysisState({ imageLoaded: true, imageError: false })
  }

  const handleImageError = () => {
    updateAnalysisState({ imageLoaded: false, imageError: true })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-green-600"
    if (score >= 60) return "from-yellow-500 to-yellow-600"
    if (score >= 40) return "from-orange-500 to-orange-600"
    return "from-red-500 to-red-600"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Shield className="h-6 w-6 text-green-600" />
    if (score >= 60) return <CheckCircle className="h-6 w-6 text-yellow-600" />
    if (score >= 40) return <AlertTriangle className="h-6 w-6 text-orange-600" />
    return <XCircle className="h-6 w-6 text-red-600" />
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Highly Credible"
    if (score >= 60) return "Moderately Credible"
    if (score >= 40) return "Low Credibility"
    return "Not Credible"
  }

  const ScoreDisplay = () => {
    if (analysisState.phase !== "completed") return null

    return (
      <Card className="p-6 mb-8 bg-white/90 backdrop-blur-sm shadow-lg border-l-4 border-l-red-500">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Credibility Score</h3>
            <p className="text-sm text-red-600 font-medium">
              {analysisState.scoreLoading
                ? "🔍 Analyzing credibility..."
                : typeof analysisState.score === "number"
                  ? `✓ Analysis ${analysisState.scoreStatus === 300 ? "in progress" : "complete"}`
                  : analysisState.scoreError
                    ? "⚠️ Unable to calculate score"
                    : "📊 Credibility assessment"}
            </p>
          </div>
          {/* Loading indicator for score */}
          {analysisState.scoreLoading && (
            <div className="ml-auto">
              <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
            </div>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          {/* Show score if available */}
          {typeof analysisState.score === "number" && (
            <div className="mb-6">
              {/* Score Circle and Bar */}
              <div className="flex items-center space-x-6 mb-4">
                {/* Circular Score Display */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisState.score / 100)}`}
                      className={`transition-all duration-1000 ${getScoreColor(analysisState.score).replace("text-", "text-")}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysisState.score)}`}>
                        {analysisState.score}
                      </div>
                      <div className="text-xs text-gray-500">/ 100</div>
                    </div>
                  </div>
                </div>

                {/* Score Details */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getScoreIcon(analysisState.score)}
                    <div>
                      <h4 className={`text-xl font-bold ${getScoreColor(analysisState.score)}`}>
                        {getScoreLabel(analysisState.score)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Score: {analysisState.score}/100
                        {analysisState.scoreStatus === 300 && " (Analysis in progress)"}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${getScoreGradient(analysisState.score)} transition-all duration-1000`}
                      style={{ width: `${analysisState.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Not Credible</span>
                    <span>Low</span>
                    <span>Moderate</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              {/* Score Explanation */}
              {analysisState.scoreShort && (
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Analysis Explanation:</h5>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {decodeUnicodeString(analysisState.scoreShort)}
                  </p>
                </div>
              )}

              {/* Processing indicator for status 300 */}
              {analysisState.scoreStatus === 300 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      Analysis in progress - score may be updated as more data becomes available
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {analysisState.scoreLoading && typeof analysisState.score !== "number" && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-red-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">
                  Calculating credibility score...
                  {analysisState.scoreRetryCount &&
                    analysisState.scoreRetryCount > 0 &&
                    ` (attempt ${analysisState.scoreRetryCount + 1})`}
                </span>
              </div>
            </div>
          )}

          {/* Error State */}
          {analysisState.scoreError && !analysisState.scoreLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-red-700">
                <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium mb-1">Score Calculation Issue</p>
                <p className="text-xs">{analysisState.scoreError}</p>
              </div>
            </div>
          )}

          {/* No Score State */}
          {!analysisState.scoreLoading && !analysisState.scoreError && typeof analysisState.score !== "number" && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-red-700">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium mb-1">Score Not Available</p>
                <p className="text-xs">Credibility score could not be calculated for this article</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  const getPhaseIcon = () => {
    switch (analysisState.phase) {
      case "initializing":
        return <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      case "fetching":
        return <Globe className="h-10 w-10 text-blue-600 animate-pulse" />
      case "processing":
        return <Sparkles className="h-10 w-10 text-purple-600 animate-pulse" />
      case "completed":
        return <CheckCircle className="h-10 w-10 text-green-600" />
      case "error":
        return <XCircle className="h-10 w-10 text-red-600" />
      case "retrying":
        return <RefreshCw className="h-10 w-10 text-orange-600 animate-spin" />
      default:
        return <Loader2 className="h-10 w-10 text-gray-600 animate-spin" />
    }
  }

  const getPhaseTitle = () => {
    switch (analysisState.phase) {
      case "initializing":
        return "Initializing Analysis"
      case "fetching":
        return "Fetching Article Data"
      case "processing":
        return "Processing Content"
      case "completed":
        return analysisState.title ? decodeUnicodeString(analysisState.title) : "Analysis Complete"
      case "error":
        return "Analysis Error"
      case "retrying":
        return "Retrying Analysis"
      default:
        return "AI Analysis"
    }
  }

  const getPhaseDescription = () => {
    switch (analysisState.phase) {
      case "initializing":
        return "Setting up the analysis environment and waiting for the backend to create the analysis record"
      case "fetching":
        return "Retrieving article content and metadata from the source"
      case "processing":
        // Show different messages based on what data we have
        if (analysisState.title && analysisState.summary && analysisState.keywords && !analysisState.image) {
          return "Text analysis complete, waiting for page screenshot to be captured..."
        }
        return "AI is analyzing the content for credibility indicators and extracting key information"
      case "completed":
        return analysisState.summary
          ? decodeUnicodeString(analysisState.summary)
          : "Article analysis has been completed successfully"
      case "error":
        return analysisState.error || "An error occurred during analysis"
      case "retrying":
        return `Attempting to recover from error... (attempt ${analysisState.retryCount})`
      default:
        return "Processing your request..."
    }
  }

  const getPhaseColor = () => {
    switch (analysisState.phase) {
      case "initializing":
      case "fetching":
        return "from-blue-100 to-indigo-100"
      case "processing":
        return "from-purple-100 to-pink-100"
      case "completed":
        return "from-green-100 to-emerald-100"
      case "error":
        return "from-red-100 to-rose-100"
      case "retrying":
        return "from-orange-100 to-yellow-100"
      default:
        return "from-gray-100 to-slate-100"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Fake Sniper Logo" className="h-8 w-auto" />
            <div>
              <span className="font-semibold text-gray-900">FAKE SNIPER</span>
              <p className="text-xs text-gray-500 -mt-0.5">AI DETECTOR</p>
            </div>
          </div>
        </div>
      </header>

      {/* Analysis Progress */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Status Card - Only show when not completed */}
          {analysisState.phase !== "completed" && (
            <Card className={`p-8 mb-8 bg-gradient-to-r ${getPhaseColor()} shadow-lg border-0`}>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-white/50 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                  {getPhaseIcon()}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{getPhaseTitle()}</h1>
                <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">{getPhaseDescription()}</p>

                {/* Polling status */}
                {analysisState.isPolling && (
                  <div className="mt-4 p-3 bg-white/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-2 text-purple-800">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">
                        Checking for updates... (attempt {analysisState.retryCount + 1})
                        {analysisState.title &&
                          analysisState.summary &&
                          analysisState.keywords &&
                          !analysisState.image &&
                          " • Waiting for screenshot"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {analysisState.phase === "error" && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/")} className="px-6 py-3 bg-white/50">
                      <Home className="h-4 w-4 mr-2" />
                      Start New Analysis
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* URL Display */}
          <Card className="p-6 mb-8 bg-white/90 backdrop-blur-sm shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-2">Article Source:</p>
                <p className="text-gray-900 break-all text-lg font-medium">{decodeURIComponent(url)}</p>
                {uid && (
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-400">Analysis ID: {uid}</span>
                    {analysisState.isPolling && (
                      <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Credibility Score Display */}
          <ScoreDisplay />

          {/* Results Display - Show as they come in */}
          {(analysisState.title || analysisState.summary || analysisState.keywords || analysisState.image) && (
            <div className="space-y-6 mb-8">
              {/* Article Screenshot - Show when available */}
              {analysisState.image && (
                <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-l-4 border-l-indigo-500">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Article Screenshot</h3>
                      <p className="text-sm text-indigo-600 font-medium">
                        ✓ Page screenshot captured
                        {analysisState.imageLoaded && " • Loaded successfully"}
                        {analysisState.imageError && " • Failed to load"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="relative">
                      {!analysisState.imageLoaded && !analysisState.imageError && (
                        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Loading screenshot...</span>
                          </div>
                        </div>
                      )}

                      {analysisState.imageError && (
                        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-500">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Screenshot unavailable</p>
                            <p className="text-xs text-gray-400">Failed to load image</p>
                          </div>
                        </div>
                      )}

                      <img
                        src={analysisState.image || "/placeholder.svg"}
                        alt={`Screenshot of ${analysisState.title || "article"}`}
                        className={`w-full rounded-lg border shadow-sm transition-opacity duration-200 ${
                          analysisState.imageLoaded && !analysisState.imageError
                            ? "opacity-100"
                            : "opacity-0 absolute inset-0"
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        loading="lazy"
                        style={{ maxHeight: "400px", objectFit: "cover" }}
                      />

                      {analysisState.imageLoaded && (
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>Screenshot from S3</span>
                          </div>
                          <a
                            href={analysisState.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            View full size
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Article Title */}
                {analysisState.title && (
                  <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-l-4 border-l-green-500">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Article Title</h3>
                        <p className="text-sm text-green-600 font-medium">✓ Successfully extracted</p>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-gray-800 font-medium leading-relaxed">
                        {decodeUnicodeString(analysisState.title)}
                      </p>
                    </div>
                  </Card>
                )}

                {/* Article Summary */}
                {analysisState.summary && (
                  <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-l-4 border-l-blue-500">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Article Summary</h3>
                        <p className="text-sm text-blue-600 font-medium">✓ AI-generated summary</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">{decodeUnicodeString(analysisState.summary)}</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Article Keywords */}
              {analysisState.keywords && analysisState.keywords.length > 0 && (
                <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-l-4 border-l-purple-500">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Tag className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Article Keywords</h3>
                      <p className="text-sm text-purple-600 font-medium">
                        ✓ Key topics identified ({analysisState.keywords.length} found)
                      </p>
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {processKeywords(analysisState.keywords).map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-300 hover:from-purple-200 hover:to-indigo-200 transition-colors font-medium"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Similar News Section */}
          {analysisState.phase === "completed" && (
            <Card className="p-6 mb-8 bg-white/90 backdrop-blur-sm shadow-lg border-l-4 border-l-orange-500">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Newspaper className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Similar News</h3>
                  <p className="text-sm text-orange-600 font-medium">
                    {analysisState.similarNewsLoading
                      ? `🔍 Searching for related articles... (${analysisState.similarNews?.length || 0} found so far)`
                      : analysisState.similarNews && analysisState.similarNews.length > 0
                        ? `✓ Found ${analysisState.similarNews.length} related articles`
                        : analysisState.similarNewsError
                          ? "⚠️ Unable to find similar news"
                          : "📰 Related news articles"}
                  </p>
                </div>
                {/* Loading indicator for status 300 */}
                {analysisState.similarNewsLoading && (
                  <div className="ml-auto">
                    <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                  </div>
                )}
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                {/* Show current results even while loading (status 300) */}
                {analysisState.similarNews && analysisState.similarNews.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {analysisState.similarNews.map((newsItem, index) => (
                      <div
                        key={index}
                        className="bg-white border border-orange-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <LinkIcon className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 leading-tight">
                              {decodeUnicodeString(newsItem.title)}
                            </h4>
                            <a
                              href={newsItem.target}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-800 hover:underline flex items-center space-x-2 transition-colors text-xs"
                              title={newsItem.target}
                            >
                              <Globe className="h-3 w-3 flex-shrink-0" />
                              <span className="break-all">
                                {newsItem.target.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                              </span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading State - show when loading and no results yet */}
                {analysisState.similarNewsLoading &&
                  (!analysisState.similarNews || analysisState.similarNews.length === 0) && (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3 text-orange-700">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">
                          Searching for similar news articles...
                          {analysisState.similarNewsRetryCount &&
                            analysisState.similarNewsRetryCount > 0 &&
                            ` (attempt ${analysisState.similarNewsRetryCount + 1})`}
                        </span>
                      </div>
                    </div>
                  )}

                {/* Loading indicator when we have results but still searching (status 300) */}
                {analysisState.similarNewsLoading &&
                  analysisState.similarNews &&
                  analysisState.similarNews.length > 0 && (
                    <div className="flex items-center justify-center py-4 border-t border-orange-200">
                      <div className="flex items-center gap-3 text-orange-700">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">
                          Searching for more articles...
                          {analysisState.similarNewsRetryCount &&
                            analysisState.similarNewsRetryCount > 0 &&
                            ` (attempt ${analysisState.similarNewsRetryCount + 1})`}
                        </span>
                      </div>
                    </div>
                  )}

                {/* Error State */}
                {analysisState.similarNewsError && !analysisState.similarNewsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center text-orange-700">
                      <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium mb-1">Similar News Search Issue</p>
                      <p className="text-xs">{analysisState.similarNewsError}</p>
                    </div>
                  </div>
                )}

                {/* No Results State - only show when not loading and no results */}
                {!analysisState.similarNewsLoading &&
                  !analysisState.similarNewsError &&
                  (!analysisState.similarNews || analysisState.similarNews.length === 0) && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center text-orange-700">
                        <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium mb-1">No Similar News Found</p>
                        <p className="text-xs">No related articles were found for this news item</p>
                      </div>
                    </div>
                  )}
              </div>
            </Card>
          )}

          {/* Progress Indicators */}
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  {analysisState.phase === "processing" || analysisState.phase === "initializing" ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : analysisState.title ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Content Retrieval</h3>
                  <p className="text-sm text-gray-600">
                    {analysisState.title
                      ? "Complete"
                      : analysisState.phase === "processing"
                        ? "In Progress"
                        : "Pending"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  {analysisState.phase === "processing" ? (
                    <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                  ) : analysisState.summary ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Processing</h3>
                  <p className="text-sm text-gray-600">
                    {analysisState.summary
                      ? "Complete"
                      : analysisState.phase === "processing"
                        ? "Analyzing"
                        : "Waiting"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  {analysisState.image ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : analysisState.phase === "processing" ? (
                    <ImageIcon className="h-5 w-5 text-indigo-600 animate-pulse" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Screenshot</h3>
                  <p className="text-sm text-gray-600">
                    {analysisState.image ? "Captured" : analysisState.phase === "processing" ? "Capturing" : "Pending"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  {typeof analysisState.score === "number" && !analysisState.scoreLoading ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : analysisState.scoreLoading ? (
                    <TrendingUp className="h-5 w-5 text-red-600 animate-pulse" />
                  ) : analysisState.phase === "completed" ? (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Credibility Score</h3>
                  <p className="text-sm text-gray-600">
                    {typeof analysisState.score === "number"
                      ? analysisState.scoreLoading
                        ? `${analysisState.score} (updating...)`
                        : `${analysisState.score}/100`
                      : analysisState.scoreLoading
                        ? "Calculating"
                        : analysisState.phase === "completed"
                          ? "Not Available"
                          : "Pending"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  {analysisState.similarNews &&
                  analysisState.similarNews.length > 0 &&
                  !analysisState.similarNewsLoading ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : analysisState.similarNewsLoading ? (
                    <Newspaper className="h-5 w-5 text-orange-600 animate-pulse" />
                  ) : analysisState.phase === "completed" ? (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Similar News</h3>
                  <p className="text-sm text-gray-600">
                    {analysisState.similarNews && analysisState.similarNews.length > 0
                      ? analysisState.similarNewsLoading
                        ? `Found ${analysisState.similarNews.length} (searching...)`
                        : `Found ${analysisState.similarNews.length}`
                      : analysisState.similarNewsLoading
                        ? "Searching"
                        : analysisState.phase === "completed"
                          ? "None Found"
                          : "Pending"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <Card className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getPhaseIcon()}
                <div>
                  <p className="text-lg font-semibold">
                    {analysisState.phase === "completed" ? "Analysis Complete" : "Analysis in Progress"}
                  </p>
                  <p className="text-blue-100">
                    {analysisState.phase === "completed"
                      ? "Your article has been successfully processed"
                      : analysisState.isPolling
                        ? `Polling for updates • Attempt ${analysisState.retryCount + 1}${
                            analysisState.title &&
                            analysisState.summary &&
                            analysisState.keywords &&
                            !analysisState.image
                              ? " • Waiting for screenshot"
                              : ""
                          }`
                        : "Preparing analysis..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {analysisState.phase === "completed" ? (
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    onClick={() => router.push(`/results?url=${encodeURIComponent(url)}&uid=${uid}`)}
                  >
                    View Results
                  </Button>
                ) : analysisState.phase === "error" ? (
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    disabled
                  >
                    {analysisState.isPolling ? "Checking..." : "Please Wait..."}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Initializing analysis...</p>
          </div>
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  )
}
