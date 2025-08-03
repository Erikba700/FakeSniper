"use client"

import { useState, useCallback } from "react"

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface ApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (url: string, options: RequestInit = {}, apiOptions: ApiOptions = {}) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || `HTTP error! status: ${response.status}`
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
        apiOptions.onError?.(errorMessage)
        return null
      }

      setState((prev) => ({ ...prev, loading: false, data }))
      apiOptions.onSuccess?.(data)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      apiOptions.onError?.(errorMessage)
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}
