/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: October 28, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Vismyras ("we," "our," or "us"). We are committed to protecting your personal information 
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our virtual try-on platform at{' '}
              <a href="https://tryonvismyras08.vercel.app" className="text-purple-600 hover:underline">
                https://tryonvismyras08.vercel.app
              </a>.
            </p>
            <p className="text-gray-700">
              By using our service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">When you create an account, we collect:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>Password (encrypted)</li>
              <li>Profile picture (if provided via Google OAuth)</li>
              <li>Authentication provider (email or Google)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Payment Information</h3>
            <p className="text-gray-700 mb-4">
              Payment processing is handled by Razorpay. We collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Transaction IDs</li>
              <li>Payment amounts</li>
              <li>Subscription status</li>
              <li>Payment timestamps</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We do NOT store your credit card details. All payment information is securely handled by Razorpay.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Images</h3>
            <p className="text-gray-700 mb-4">We collect and process:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Model photos you upload</li>
              <li>Garment images you upload</li>
              <li>Generated try-on images</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Images are stored temporarily in your browser's IndexedDB and are not transmitted to our servers 
              except during AI processing via Google Gemini API.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.4 Usage Data</h3>
            <p className="text-gray-700 mb-4">We automatically collect:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Number of try-ons performed</li>
              <li>Subscription tier</li>
              <li>Usage history and timestamps</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide and maintain our virtual try-on service</li>
              <li>Process your payments and manage subscriptions</li>
              <li>Generate AI-powered virtual try-on images</li>
              <li>Send you service-related notifications</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage to improve our service</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Third-Party Service Providers</h3>
            <p className="text-gray-700 mb-4">We share data with:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Supabase</strong> - Authentication and database hosting</li>
              <li><strong>Google (Gemini AI)</strong> - Image processing for virtual try-on</li>
              <li><strong>Razorpay</strong> - Payment processing</li>
              <li><strong>Vercel</strong> - Hosting and content delivery</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required by law or in response to valid requests by public 
              authorities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">We implement security measures including:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encrypted password storage (bcrypt)</li>
              <li>HTTPS/SSL encryption for all data transmission</li>
              <li>JWT-based authentication</li>
              <li>Row-level security on database</li>
              <li>Regular security audits</li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect 
              your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as your account is active or as needed to provide 
              services. You can request deletion of your account at any time.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Account data</strong>: Until account deletion</li>
              <li><strong>Transaction records</strong>: 7 years (legal requirement)</li>
              <li><strong>Images</strong>: Stored locally, deleted when you clear browser data</li>
              <li><strong>Usage logs</strong>: 90 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access</strong>: Request a copy of your personal data</li>
              <li><strong>Rectification</strong>: Correct inaccurate data</li>
              <li><strong>Erasure</strong>: Request deletion of your data</li>
              <li><strong>Portability</strong>: Receive your data in a portable format</li>
              <li><strong>Object</strong>: Object to processing of your data</li>
              <li><strong>Withdraw consent</strong>: Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:sendrightai@gmail.com" className="text-purple-600 hover:underline">
                sendrightai@gmail.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">We use:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Essential cookies</strong>: For authentication and security</li>
              <li><strong>LocalStorage</strong>: To store app data and preferences</li>
              <li><strong>IndexedDB</strong>: To store images locally in your browser</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We do not use third-party advertising cookies or trackers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for users under 13 years of age. We do not knowingly collect 
              information from children under 13. If you become aware that a child has provided us with 
              personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your data in compliance with 
              applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date. Continued use 
              of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li><strong>Email</strong>: sendrightai@gmail.com</li>
              <li><strong>Contact Page</strong>:{' '}
                <Link to="/contact" className="text-purple-600 hover:underline">
                  https://tryonvismyras08.vercel.app/contact
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/terms" className="text-purple-600 hover:underline">Terms & Conditions</Link>
            <span className="text-gray-400">•</span>
            <Link to="/refund" className="text-purple-600 hover:underline">Refund Policy</Link>
            <span className="text-gray-400">•</span>
            <Link to="/contact" className="text-purple-600 hover:underline">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
