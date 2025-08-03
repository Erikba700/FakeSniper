"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Globe, Users, Calendar, TrendingUp, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { Suspense } from "react"
import { Footer } from "@/components/footer"

function DetailedResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get("url") || ""

  // Mock detailed analysis data
  const analysis = {
    overallScore: 25,
    breakdown: {
      contentCredibility: 70,
      sourceReliability: 85,
      factualAccuracy: 60,
      biasDetection: 40,
    },
    siteInfo: {
      domain: "example-news.com",
      established: "2018",
      reputation: "Mixed",
      monthlyVisitors: "2.3M",
      trustScore: 65,
    },
    detailedAnalysis: {
      strengths: [
        "Article cites multiple sources",
        "Author has journalism credentials",
        "Recent publication date",
        "Proper fact-checking methodology mentioned",
      ],
      concerns: [
        "Some claims lack direct source attribution",
        "Potential selection bias in source choice",
        "Emotional language used in key sections",
        "Missing context for statistical claims",
      ],
      recommendations: [
        "Cross-reference with additional sources",
        "Verify statistical claims independently",
        "Consider potential bias in source selection",
        "Look for expert opinions on the topic",
      ],
    },
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBackground = (score: number) => {
    if (score >= 70) return "bg-green-100"
    if (score >= 40) return "bg-yellow-100"
    return "bg-red-100"
  }

  const ScoreSpinner = ({ score, label }: { score: number; label: string }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>{score}%</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div
          className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
            score >= 70 ? "border-green-500" : score >= 40 ? "border-yellow-500" : "border-red-500"
          }`}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Results</span>
          </Button>
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Fake Sniper Logo" className="h-8 w-auto" />
            <div>
              <span className="font-semibold text-gray-900">FAKE SNIPER</span>
              <p className="text-xs text-gray-500 -mt-0.5">AI DETECTOR PRO</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Detailed Analysis Report</h1>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500 mb-1">Analyzed URL:</p>
              <div className="flex items-center space-x-2">
                <p className="text-gray-800 break-all flex-1">{decodeURIComponent(url)}</p>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="analysis" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Content Analysis</TabsTrigger>
              <TabsTrigger value="source">Source Information</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-6">
              {/* Score Breakdown */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Credibility Score Breakdown</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <ScoreSpinner score={analysis.breakdown.contentCredibility} label="Content Credibility" />
                    <ScoreSpinner score={analysis.breakdown.sourceReliability} label="Source Reliability" />
                  </div>
                  <div className="space-y-4">
                    <ScoreSpinner score={analysis.breakdown.factualAccuracy} label="Factual Accuracy" />
                    <ScoreSpinner score={analysis.breakdown.biasDetection} label="Bias Detection" />
                  </div>
                </div>
              </Card>

              {/* Strengths and Concerns */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.detailedAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Concerns</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.detailedAnalysis.concerns.map((concern, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="source" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Source Information</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Domain</p>
                        <p className="font-medium text-gray-900">{analysis.siteInfo.domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Established</p>
                        <p className="font-medium text-gray-900">{analysis.siteInfo.established}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Monthly Visitors</p>
                        <p className="font-medium text-gray-900">{analysis.siteInfo.monthlyVisitors}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Trust Score</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              analysis.siteInfo.trustScore >= 70
                                ? "bg-green-500"
                                : analysis.siteInfo.trustScore >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${analysis.siteInfo.trustScore}%` }}
                          />
                        </div>
                        <span className={`font-semibold ${getScoreColor(analysis.siteInfo.trustScore)}`}>
                          {analysis.siteInfo.trustScore}%
                        </span>
                        <div
                          className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                            analysis.siteInfo.trustScore >= 70
                              ? "border-green-500"
                              : analysis.siteInfo.trustScore >= 40
                                ? "border-yellow-500"
                                : "border-red-500"
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Reputation</p>
                      <Badge variant="secondary" className={`${getScoreBackground(analysis.siteInfo.trustScore)}`}>
                        {analysis.siteInfo.reputation}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Expert Recommendations</h2>
                <div className="space-y-4">
                  {analysis.detailedAnalysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
                <p className="text-gray-700 mb-4">
                  Based on our analysis, we recommend approaching this article with caution and cross-referencing the
                  information with additional trusted sources before sharing or acting on the content.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    Find Similar Articles
                  </Button>
                  <Button variant="outline" size="sm">
                    Check Source History
                  </Button>
                  <Button variant="outline" size="sm">
                    Export Report
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function DetailedResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading detailed analysis...</p>
          </div>
        </div>
      }
    >
      <DetailedResultsContent />
    </Suspense>
  )
}
