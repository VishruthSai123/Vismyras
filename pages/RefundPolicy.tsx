/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Link } from 'react-router-dom';

const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cancellation and Refund Policy</h1>
          <p className="text-gray-600">Last updated: October 28, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Overview</h2>
            <p className="text-gray-700">
              At Vismyras, we strive to provide the best virtual try-on experience. This Refund Policy 
              explains your rights regarding cancellations and refunds for our services. Please read this 
              carefully before making a purchase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Premium Subscription Refunds</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Subscription Details</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Monthly Plan</strong>: ₹199/month</li>
              <li><strong>Includes</strong>: 50 virtual try-ons per month</li>
              <li><strong>Billing</strong>: Automatically renewed monthly</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 7-Day Money-Back Guarantee</h3>
            <p className="text-gray-700 mb-4">
              We offer a <strong>full refund</strong> if you cancel within <strong>7 days</strong> of your 
              first subscription payment, provided:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>You have used fewer than 5 virtual try-ons</li>
              <li>This is your first subscription to Vismyras</li>
              <li>No previous refunds have been issued to your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Cancellation Process</h3>
            <p className="text-gray-700 mb-4">To cancel your subscription:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
              <li>Log in to your Vismyras account</li>
              <li>Go to <strong>Account Settings</strong> → <strong>Billing</strong></li>
              <li>Click <strong>"Cancel Subscription"</strong></li>
              <li>Confirm cancellation</li>
            </ol>
            <p className="text-gray-700 mt-4">
              Your subscription will remain active until the end of the current billing period. You will 
              not be charged for subsequent months.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.4 Prorated Refunds</h3>
            <p className="text-gray-700">
              After the 7-day period, we do <strong>not</strong> offer prorated refunds for unused time. 
              However, you will retain access to premium features until your current billing period ends.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Pay-Per-Use Credits Refunds</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.1 Credit Packages</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Single Try-On</strong>: ₹29</li>
              <li><strong>5-Pack</strong>: ₹129 (₹25.80 each)</li>
              <li><strong>10-Pack</strong>: ₹249 (₹24.90 each)</li>
              <li><strong>Expiry</strong>: 30 days from purchase</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Refund Eligibility</h3>
            <p className="text-gray-700 mb-4">
              Credits are <strong>non-refundable</strong> except in the following cases:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Technical Failure</strong>: If a try-on fails due to our system error and cannot be regenerated</li>
              <li><strong>Duplicate Charge</strong>: If you were charged multiple times for the same purchase</li>
              <li><strong>Unused Credits</strong>: If purchased by mistake and no credits have been used (within 24 hours)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.3 Credit Restoration</h3>
            <p className="text-gray-700">
              If a virtual try-on fails due to technical issues on our end, we will automatically restore 
              the credit to your account within 24 hours.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Free Tier</h2>
            <p className="text-gray-700">
              The free tier (10 try-ons per month) is provided at no cost. No refunds are applicable to 
              free service usage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Non-Refundable Items</h2>
            <p className="text-gray-700 mb-4">
              The following are <strong>not eligible</strong> for refunds:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Virtual try-ons that have been successfully generated</li>
              <li>Used credits or try-ons</li>
              <li>Subscription renewals after the 7-day grace period</li>
              <li>Expired credits (after 30 days)</li>
              <li>Services used in violation of our Terms of Service</li>
              <li>Refunds previously granted (one refund per customer)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Refund Request Process</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.1 How to Request</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
              <li>Contact our support team at <strong>sendrightai@gmail.com</strong></li>
              <li>Include your:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Account email address</li>
                  <li>Transaction ID or order number</li>
                  <li>Date of purchase</li>
                  <li>Reason for refund request</li>
                </ul>
              </li>
              <li>Our team will review and respond within 2-3 business days</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Processing Time</h3>
            <p className="text-gray-700 mb-4">
              Approved refunds will be processed as follows:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Credit/Debit Card</strong>: 5-7 business days</li>
              <li><strong>UPI</strong>: 2-3 business days</li>
              <li><strong>Net Banking</strong>: 5-7 business days</li>
              <li><strong>Wallet (Paytm, PhonePe, etc.)</strong>: 1-2 business days</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Refunds are processed to the original payment method. Processing times may vary depending on 
              your bank or payment provider.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Razorpay Payment Issues</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.1 Failed Transactions</h3>
            <p className="text-gray-700">
              If your payment was deducted but you did not receive credits or subscription access:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Wait 30 minutes for automatic processing</li>
              <li>Check your email for transaction confirmation</li>
              <li>Contact support with your Razorpay Transaction ID</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Duplicate Charges</h3>
            <p className="text-gray-700">
              If you were charged multiple times for a single purchase, we will refund the duplicate 
              charges within 3-5 business days upon verification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Interruptions</h2>
            <p className="text-gray-700 mb-4">
              In case of extended service outages (more than 24 hours):
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Premium subscribers will receive a credit extension equivalent to the downtime</li>
              <li>Pay-per-use customers will have their credit expiry extended by the downtime period</li>
              <li>No monetary refunds will be issued for service interruptions under 24 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Abuse and Fraud</h2>
            <p className="text-gray-700">
              Vismyras reserves the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Deny refund requests that appear fraudulent</li>
              <li>Suspend accounts that abuse the refund policy</li>
              <li>Ban users who repeatedly request refunds after using services</li>
              <li>Report suspicious activity to payment processors and authorities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Chargebacks</h2>
            <p className="text-gray-700 mb-4">
              If you initiate a chargeback with your bank:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Your account will be immediately suspended</li>
              <li>All access to services will be revoked</li>
              <li>We will dispute invalid chargebacks with evidence</li>
              <li>Please contact us first before filing a chargeback</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We encourage resolving disputes directly with our support team before initiating chargebacks.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Refund Policy from time to time. Material changes will be notified via 
              email. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For refund requests or questions about this policy:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li><strong>Email</strong>: sendrightai@gmail.com</li>
              <li><strong>Billing Support</strong>: sendrightai@gmail.com</li>
              <li><strong>Contact Page</strong>:{' '}
                <Link to="/contact" className="text-purple-600 hover:underline">
                  https://tryonvismyras08.vercel.app/contact
                </Link>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              Our support team typically responds within 24-48 hours on business days.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
            <span className="text-gray-400">•</span>
            <Link to="/terms" className="text-purple-600 hover:underline">Terms and Conditions</Link>
            <span className="text-gray-400">•</span>
            <Link to="/contact" className="text-purple-600 hover:underline">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
