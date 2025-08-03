// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://api.fakesniper.com",
  ENDPOINTS: {
    ADD_TARGET: "/add-target",
    CHECK_STATUS: "/status",
    CHECK_CREDENTIALS: "/check_credentials",
    GET_HISTORY: "/get_history",
    SIMILAR_NEWS: "/similar_news",
    GET_SCORE: "/get_score",
    HEALTH: "/health",
  },
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    "Content-Type": "application/json",
    "User-Agent": "FakeSniper-Frontend/1.0",
    Accept: "application/json",
  },
} as const

// Helper function to build full URL
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}
