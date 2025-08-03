import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/footer"

export default function TermsConditionsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-gray max-w-none">
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Fake Sniper ("the Service"), you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Fake Sniper is an AI-powered service that analyzes news articles and content to assess their credibility
                and potential for containing misinformation. Our service provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Automated analysis of news articles and web content</li>
                <li>Credibility scoring and risk assessment</li>
                <li>Source verification and reputation analysis</li>
                <li>Detailed reports on content reliability</li>
                <li>Educational resources about misinformation</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Acceptable Use</h3>
              <p className="text-gray-700 mb-4">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not
                to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Submit malicious, harmful, or illegal content for analysis</li>
                <li>Attempt to reverse engineer or manipulate our AI algorithms</li>
                <li>Use the Service to harass, abuse, or harm others</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with the Service's security features</li>
                <li>Create multiple accounts to circumvent usage limits</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                If you create an account, you are responsible for maintaining the confidentiality of your login
                credentials and for all activities that occur under your account.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Service Limitations and Disclaimers</h2>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 AI Analysis Limitations</h3>
              <p className="text-gray-700 mb-4">
                Our AI-powered analysis is provided for informational purposes only. While we strive for accuracy, our
                Service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>May not detect all forms of misinformation</li>
                <li>Can produce false positives or false negatives</li>
                <li>Should not be the sole basis for important decisions</li>
                <li>Is continuously being improved but is not infallible</li>
                <li>May have varying accuracy across different content types</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.2 No Professional Advice</h3>
              <p className="text-gray-700 mb-4">
                The Service does not provide professional, legal, medical, or financial advice. Our analysis should not
                replace critical thinking, fact-checking, or consultation with qualified professionals.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Intellectual Property Rights</h2>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.1 Our Rights</h3>
              <p className="text-gray-700 mb-4">
                The Service, including its algorithms, software, design, and content, is owned by us and protected by
                intellectual property laws. You may not copy, modify, distribute, or create derivative works without
                permission.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.2 User Content</h3>
              <p className="text-gray-700 mb-4">
                By submitting URLs or content for analysis, you grant us a limited license to process, analyze, and
                store this information for the purpose of providing our Service and improving our algorithms.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our
                Privacy Policy, which is incorporated into these Terms by reference.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Service Availability</h2>
              <p className="text-gray-700 mb-4">
                We strive to maintain high service availability but do not guarantee uninterrupted access. The Service
                may be temporarily unavailable due to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Scheduled maintenance</li>
                <li>Technical difficulties</li>
                <li>Third-party service disruptions</li>
                <li>Force majeure events</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING
                OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use
                of the Service, violation of these Terms, or infringement of any rights of another party.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your access to the Service immediately, without prior notice, for conduct
                that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Modifications to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes via
                email or through the Service. Continued use after modifications constitutes acceptance of the updated
                Terms.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction],
                without regard to its conflict of law provisions.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                Any disputes arising from these Terms or your use of the Service shall be resolved through binding
                arbitration in accordance with the rules of [Arbitration Organization].
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Severability</h2>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in
                full force and effect.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@fakesniper.com
                  <br />
                  <strong>Address:</strong> [Your Company Address]
                  <br />
                  <strong>Phone:</strong> [Your Phone Number]
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
                <p className="text-blue-800">
                  <strong>Important Notice:</strong> This service is designed to assist in identifying potential
                  misinformation, but should not be your only source for verifying news credibility. Always use multiple
                  sources and critical thinking when evaluating information.
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
