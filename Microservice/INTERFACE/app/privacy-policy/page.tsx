import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/footer"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-gray max-w-none">
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to Fake Sniper ("we," "our," or "us"). This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our AI-powered fake news detection service (the
                "Service"). Please read this privacy policy carefully. If you do not agree with the terms of this
                privacy policy, please do not access the Service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>URLs of news articles you submit for analysis</li>
                <li>Account information (email address, username) if you create an account</li>
                <li>Communication data when you contact our support team</li>
                <li>Feedback and survey responses</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Device information and operating system</li>
                <li>Usage patterns and interaction data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>To provide and maintain our fake news detection service</li>
                <li>To analyze news articles and generate credibility reports</li>
                <li>To improve our AI algorithms and detection accuracy</li>
                <li>To personalize your experience and provide relevant insights</li>
                <li>To communicate with you about service updates and features</li>
                <li>To detect and prevent fraud, abuse, and security threats</li>
                <li>To comply with legal obligations and enforce our terms</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information. We may share your information in the following
                circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  <strong>Service Providers:</strong> With trusted third-party vendors who assist in operating our
                  service
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law, court order, or government request
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales
                </li>
                <li>
                  <strong>Safety and Security:</strong> To protect the rights, property, or safety of our users
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection practices</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in
                this Privacy Policy, unless a longer retention period is required by law. Analysis data may be retained
                in anonymized form for research and improvement purposes.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your personal information</li>
                <li>Restriction of processing</li>
                <li>Data portability</li>
                <li>Objection to processing</li>
                <li>Withdrawal of consent</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and improve
                our service. You can control cookie settings through your browser preferences, though this may affect
                service functionality.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Third-Party Links</h2>
              <p className="text-gray-700 mb-4">
                Our service may contain links to third-party websites. We are not responsible for the privacy practices
                of these external sites. We encourage you to review their privacy policies before providing any personal
                information.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13. If we become aware of such collection, we will take steps to delete
                the information promptly.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure
                appropriate safeguards are in place to protect your data in accordance with applicable privacy laws.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page and updating the "Last updated" date. Continued use of the service after
                changes constitutes acceptance of the updated policy.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@fakesniper.com
                  <br />
                  <strong>Address:</strong> [Your Company Address]
                  <br />
                  <strong>Phone:</strong> [Your Phone Number]
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
