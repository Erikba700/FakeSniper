import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Brain, Users, Target, CheckCircle, Globe, Zap } from "lucide-react"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Aleksey Sokolov",
      role: "Chief AI Officer and Cyber Security Expert",
      bio: "Former researcher at MIT with 2+ years in machine learning and natural language processing. Cyber Security expert with more than 5+ years of experience.",
      image: "/team/aleksey-sokolov.jpeg",
    },
    {
      name: "Marcus Rodriguez",
      role: "Lead Engineer",
      bio: "Full-stack developer with expertise in scalable AI systems and real-time data processing.",
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      name: "Dr. Emily Watson",
      role: "Journalism Advisor",
      bio: "Award-winning journalist and media literacy expert with 15 years of investigative experience.",
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      name: "Alex Kim",
      role: "Product Designer",
      bio: "UX/UI specialist focused on making complex AI insights accessible and actionable for users.",
      image: "/placeholder.svg?height=200&width=200",
    },
  ]

  const milestones = [
    {
      year: "2025 JUL 23",
      title: "Company Founded",
      description: "Started with a mission to combat misinformation using AI technology",
    },
    {
      year: "2025 JUL 24",
      title: "AI Model Launch",
      description: "Released our first-generation fake news detection algorithm powered by Ollama core technology",
    },
    {
      year: "2025 JUL 24",
      title: "Advanced Analytics",
      description: "Introduced comprehensive source verification and bias detection capabilities",
    },
    {
      year: "2025 JUL 25",
      title: "Global Expansion",
      description: "Extended support for multiple languages and international news sources",
    },
  ]

  const stats = [
    { number: "1M+", label: "Articles Analyzed" },
    { number: "95%", label: "Accuracy Rate" },
    { number: "50K+", label: "Active Users" },
    { number: "24/7", label: "Service Uptime" },
  ]

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
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center">
                <Target className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About FAKE SNIPER</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to combat misinformation and help people make informed decisions by providing advanced
              AI-powered fake news detection technology that's accessible to everyone.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center bg-white/80 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Mission Section */}
          <div className="mb-16">
            <Card className="p-8 bg-white/80 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    In an era of information overload, distinguishing fact from fiction has become increasingly
                    challenging. FAKE SNIPER was created to empower individuals, journalists, and organizations with
                    cutting-edge AI technology to identify misinformation quickly and accurately.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">Promote media literacy and critical thinking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">Provide accessible AI-powered fact-checking tools</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">Support democratic discourse and informed decision-making</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="/about-hero.png"
                    alt="AI-powered fake news detection illustration showing person using laptop with AI analysis tools"
                    className="rounded-lg shadow-lg w-full h-auto"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Technology Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our advanced AI system combines multiple detection methods to provide comprehensive analysis
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Natural Language Processing</h3>
                <p className="text-gray-600">
                  Advanced NLP algorithms powered by Ollama core technology analyze writing patterns, sentiment, and
                  linguistic markers commonly found in misinformation.
                </p>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Source Verification</h3>
                <p className="text-gray-600">
                  Cross-references information with trusted databases and evaluates publisher credibility and historical
                  accuracy.
                </p>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Analysis</h3>
                <p className="text-gray-600">
                  Provides instant credibility scores and detailed breakdowns, enabling quick decision-making for users.
                </p>
              </Card>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                From concept to cutting-edge AI platform, here's how we've evolved
              </p>
            </div>
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className={`flex items-center ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-1/2 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}>
                      <Card className="p-6 bg-white/80 backdrop-blur-sm">
                        <Badge variant="secondary" className="mb-2">
                          {milestone.year}
                        </Badge>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                        <p className="text-gray-600">{milestone.description}</p>
                      </Card>
                    </div>
                    <div className="relative z-10">
                      <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                    </div>
                    <div className="w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our diverse team combines expertise in AI, journalism, and technology to create the most effective fake
                news detection platform
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <Card key={index} className="p-6 text-center bg-white/80 backdrop-blur-sm">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">The principles that guide everything we do</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparency</h3>
                  <p className="text-gray-600">
                    We believe in open, explainable AI that users can understand and trust
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Accessibility</h3>
                  <p className="text-gray-600">
                    Making advanced AI technology available to everyone, regardless of technical expertise
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Accuracy</h3>
                  <p className="text-gray-600">
                    Continuously improving our algorithms to provide the most reliable results possible
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="p-8 bg-white/80 backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Fight Misinformation?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join thousands of users who trust FAKE SNIPER to help them navigate today's complex information
                landscape
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3">
                    Try FAKE SNIPER Now
                  </Button>
                </Link>
                <Button variant="outline" className="px-8 py-3 bg-transparent">
                  Contact Our Team
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
