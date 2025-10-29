/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckCircleIcon } from './icons';
import { SUBSCRIPTION_PLANS, SubscriptionTier, ONE_TIME_PACKAGES } from '../types/billing';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (tier: SubscriptionTier) => void;
  onBuyCredits: (tryOns: number, price: number) => void;
  currentTier: SubscriptionTier;
}

const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  onBuyCredits,
  currentTier,
}) => {
  const [selectedTab, setSelectedTab] = useState<'subscription' | 'credits'>('subscription');

  if (!isOpen) return null;

  const premiumPlan = SUBSCRIPTION_PLANS[SubscriptionTier.PREMIUM];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gray-900">
                    🚀 Unlock More Try-Ons
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    You've used all your free try-ons this month
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 px-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedTab('subscription')}
                    className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                      selectedTab === 'subscription'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Monthly Subscription
                  </button>
                  <button
                    onClick={() => setSelectedTab('credits')}
                    className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                      selectedTab === 'credits'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Buy Credits
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {selectedTab === 'subscription' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Premium Plan Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 relative overflow-hidden">
                      {/* Best Value Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                          BEST VALUE
                        </span>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-2xl font-serif font-bold text-gray-900">
                          {premiumPlan.name}
                        </h3>
                        <p className="text-gray-600 mt-1">{premiumPlan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-bold text-gray-900">₹{premiumPlan.price}</span>
                        <span className="text-gray-600">/month</span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-6">
                        {premiumPlan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <button
                        onClick={() => onSubscribe(SubscriptionTier.PREMIUM)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Subscribe Now
                      </button>

                      <p className="text-xs text-gray-500 text-center mt-3">
                        Cancel anytime. No commitments.
                      </p>
                    </div>

                    {/* Cost Comparison */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Why Premium?</h4>
                      <p className="text-xs text-blue-700">
                        Premium costs ₹199/month for 50 try-ons = <strong>₹4 per try-on</strong>.
                        Pay-per-use costs ₹9 per try-on. Save <strong>78%</strong> with Premium!
                      </p>
                    </div>
                  </motion.div>
                )}

                {selectedTab === 'credits' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-gray-600 mb-4">
                      Get instant credits for one-time use. Perfect for occasional try-ons!
                    </p>

                    {ONE_TIME_PACKAGES.map((pkg, index) => (
                      <div
                        key={index}
                        className={`relative border-2 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                          pkg.popular
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => onBuyCredits(pkg.tryOns, pkg.price)}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                              POPULAR
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {pkg.tryOns} Try-On{pkg.tryOns > 1 ? 's' : ''}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              ₹{Math.round(pkg.price / pkg.tryOns)} per try-on
                              {pkg.savings && (
                                <span className="text-green-600 font-medium ml-1">
                                  (Save ₹{pkg.savings})
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">₹{pkg.price}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onBuyCredits(pkg.tryOns, pkg.price);
                              }}
                              className={`mt-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                                pkg.popular
                                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 text-sm mb-2">💰 Best Value</h4>
                      <p className="text-xs text-yellow-700">
                        Credits valid for 30 days. For regular use, Premium subscription offers 2.5x better value at just ₹4 per try-on!
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;
