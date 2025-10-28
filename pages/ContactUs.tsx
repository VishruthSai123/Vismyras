/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Clock, MapPin, Send } from 'lucide-react';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission (email service or API)
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Contact Cards */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 mb-2">support@vismyras.com</p>
            <p className="text-sm text-gray-500">Response within 24-48 hours</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Hours</h3>
            <p className="text-gray-600 mb-2">Monday - Friday</p>
            <p className="text-sm text-gray-500">9:00 AM - 6:00 PM IST</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing Inquiries</h3>
            <p className="text-gray-600 mb-2">billing@vismyras.com</p>
            <p className="text-sm text-gray-500">For payment & refund questions</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">Message Sent!</h3>
                <p className="text-green-700">
                  Thank you for contacting us. We'll get back to you within 24-48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="refund">Refund Request</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Report a Bug</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Additional Info */}
          <div className="space-y-8">
            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How do I reset my password?</h3>
                  <p className="text-gray-600 text-sm">
                    Click on "Forgot Password" on the login page and follow the instructions sent to your email.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How do I cancel my subscription?</h3>
                  <p className="text-gray-600 text-sm">
                    Go to Account Settings → Billing → Cancel Subscription. You'll retain access until the end of your billing period.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Can I get a refund?</h3>
                  <p className="text-gray-600 text-sm">
                    Yes! We offer a 7-day money-back guarantee for new subscriptions. See our{' '}
                    <Link to="/refund" className="text-purple-600 hover:underline">Refund Policy</Link> for details.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Why did my try-on fail?</h3>
                  <p className="text-gray-600 text-sm">
                    Try-ons may fail due to image quality, format issues, or server load. Your credit will be automatically restored within 24 hours.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
                  <p className="text-gray-600 text-sm">
                    Yes! We use industry-standard encryption and secure cloud storage. Read our{' '}
                    <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link> for more information.
                  </p>
                </div>
              </div>
            </div>

            {/* Office Info */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Vismyras</h3>
                  <p className="text-purple-100">
                    Virtual Try-On Platform<br />
                    Powered by AI Innovation<br />
                    India
                  </p>
                </div>
              </div>
              
              <div className="border-t border-purple-400 my-6"></div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="block mb-1">General Support:</strong>
                  <a href="mailto:support@vismyras.com" className="text-purple-100 hover:text-white">
                    support@vismyras.com
                  </a>
                </div>
                <div>
                  <strong className="block mb-1">Billing Support:</strong>
                  <a href="mailto:billing@vismyras.com" className="text-purple-100 hover:text-white">
                    billing@vismyras.com
                  </a>
                </div>
                <div>
                  <strong className="block mb-1">Legal Inquiries:</strong>
                  <a href="mailto:legal@vismyras.com" className="text-purple-100 hover:text-white">
                    legal@vismyras.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
            <span className="text-gray-400">•</span>
            <Link to="/terms" className="text-purple-600 hover:underline">Terms and Conditions</Link>
            <span className="text-gray-400">•</span>
            <Link to="/refund" className="text-purple-600 hover:underline">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
