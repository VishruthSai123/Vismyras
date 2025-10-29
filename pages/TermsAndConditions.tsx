/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-gray-600">Last updated: October 28, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Vismyras! By accessing or using our virtual try-on platform at{' '}
              <a href="https://tryonvismyras08.vercel.app" className="text-purple-600 hover:underline">
                https://tryonvismyras08.vercel.app
              </a>{' '}
              ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree 
              to these Terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">
              Vismyras provides an AI-powered virtual try-on platform that allows users to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Upload model photos and garment images</li>
              <li>Generate virtual try-on images using AI technology</li>
              <li>Experiment with different poses and styles</li>
              <li>Save and manage outfits</li>
              <li>Access premium features through subscriptions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.1 Registration</h3>
            <p className="text-gray-700 mb-4">
              To use certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Age Requirement</h3>
            <p className="text-gray-700">
              You must be at least 13 years old to use our Service. Users under 18 must have parental consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription Plans and Pricing</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Free Tier</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>3 virtual try-ons per month</li>
              <li>Resets on the 1st of each month</li>
              <li>Basic features included</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Premium Plan</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>₹199 per month</li>
              <li>50 virtual try-ons per month</li>
              <li>All premium features</li>
              <li>Priority processing</li>
              <li>Auto-renewal (can be cancelled anytime)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.3 Pay-Per-Use</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>₹29 per try-on</li>
              <li>Bulk packages available (5 for ₹129, 10 for ₹249)</li>
              <li>Credits expire after 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.4 Price Changes</h3>
            <p className="text-gray-700">
              We reserve the right to modify pricing with 30 days' notice. Existing subscribers will be 
              notified via email before any price changes take effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment Terms</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Payments are processed securely through Razorpay</li>
              <li>All prices are in Indian Rupees (INR)</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>You authorize us to charge your payment method</li>
              <li>Failed payments may result in service suspension</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.1 You Agree NOT To:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Upload inappropriate, offensive, or illegal content</li>
              <li>Upload images of minors without parental consent</li>
              <li>Use the Service for commercial purposes without authorization</li>
              <li>Reverse engineer or attempt to extract our AI models</li>
              <li>Abuse or exploit the Service in any way</li>
              <li>Share your account credentials with others</li>
              <li>Circumvent usage limits or payment systems</li>
              <li>Upload images that violate third-party rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Content Guidelines</h3>
            <p className="text-gray-700 mb-4">Uploaded images must NOT contain:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Nudity or sexually explicit content</li>
              <li>Violence or graphic content</li>
              <li>Hate speech or discriminatory content</li>
              <li>Copyrighted material without permission</li>
              <li>Personal information of others without consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.1 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain all rights to images you upload. By using our Service, you grant us a limited license to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Process your images to generate virtual try-ons</li>
              <li>Store images temporarily for service delivery</li>
              <li>Use aggregated, anonymized data for improvement</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Generated Images</h3>
            <p className="text-gray-700">
              AI-generated try-on images are provided to you for personal use. You may download and use them 
              for personal purposes but may not resell or commercially distribute them without authorization.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.3 Our Platform</h3>
            <p className="text-gray-700">
              All platform features, design, code, and functionality are owned by Vismyras and protected by 
              copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cancellation and Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.1 By You</h3>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time through your account settings. Cancellation takes 
              effect at the end of the current billing period.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">8.2 By Us</h3>
            <p className="text-gray-700 mb-4">
              We may suspend or terminate your account if you:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violate these Terms</li>
              <li>Engage in fraudulent activity</li>
              <li>Abuse the Service</li>
              <li>Fail to pay subscription fees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">9.1 Service Availability</h3>
            <p className="text-gray-700">
              We provide the Service "as is" without warranties. We do not guarantee uninterrupted access 
              or error-free operation.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">9.2 AI Accuracy</h3>
            <p className="text-gray-700">
              Virtual try-on results are AI-generated approximations. We do not guarantee perfect accuracy 
              in fit, color, or appearance.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">9.3 Limitation of Liability</h3>
            <p className="text-gray-700">
              To the maximum extent permitted by law, Vismyras shall not be liable for any indirect, 
              incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold harmless Vismyras from any claims, damages, or expenses 
              arising from your use of the Service, violation of these Terms, or infringement of any 
              third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              Any disputes arising from these Terms or use of the Service shall be resolved through:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Good faith negotiation between parties</li>
              <li>Mediation if negotiation fails</li>
              <li>Arbitration in accordance with Indian law</li>
            </ul>
            <p className="text-gray-700 mt-4">
              These Terms are governed by the laws of India. Courts in [Your City], India shall have 
              exclusive jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700">
              We may modify these Terms at any time. Material changes will be notified via email. Continued 
              use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms, please contact us:
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

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Miscellaneous</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Severability</strong>: If any provision is invalid, the remaining provisions remain in effect</li>
              <li><strong>No Waiver</strong>: Failure to enforce a right does not constitute a waiver</li>
              <li><strong>Entire Agreement</strong>: These Terms constitute the entire agreement between you and Vismyras</li>
              <li><strong>Assignment</strong>: You may not assign these Terms; we may assign them to affiliates or successors</li>
            </ul>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
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

export default TermsAndConditions;
