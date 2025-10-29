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
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 truncate">
                    🚀 Unlock More Try-Ons
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1">
                    You've used all your free try-ons this month
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex-shrink-0 border-b border-gray-200 px-4 sm:px-6 bg-white">
                <div className="flex gap-2 sm:gap-4">
                  <button
                    onClick={() => setSelectedTab('subscription')}
                    className={`py-2.5 sm:py-3 px-1 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      selectedTab === 'subscription'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Monthly Plan
                  </button>
                  <button
                    onClick={() => setSelectedTab('credits')}
                    className={`py-2.5 sm:py-3 px-1 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      selectedTab === 'credits'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Buy Credits
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {selectedTab === 'subscription' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Premium Plan Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 sm:p-6 relative overflow-hidden">
                      {/* Best Value Badge */}
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm">
                          BEST VALUE
                        </span>
                      </div>

                      <div className="mb-3 sm:mb-4 pr-20">
                        <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                          {premiumPlan.name}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">{premiumPlan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold text-gray-900">₹{premiumPlan.price}</span>
                        <span className="text-sm sm:text-base text-gray-600">/month</span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        {premiumPlan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      {currentTier === SubscriptionTier.PREMIUM ? (
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-600 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg cursor-not-allowed text-sm sm:text-base"
                        >
                          ✓ Using Premium
                        </button>
                      ) : (
                        <button
                          onClick={() => onSubscribe(SubscriptionTier.PREMIUM)}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                        >
                          Subscribe Now
                        </button>
                      )}

                      <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-2 sm:mt-3">
                        {currentTier === SubscriptionTier.PREMIUM 
                          ? 'Manage your subscription in Settings'
                          : 'Cancel anytime. No commitments.'
                        }
                      </p>
                    </div>

                    {/* Cost Comparison */}
                    <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-blue-900 text-xs sm:text-sm mb-1.5 sm:mb-2">💡 Why Premium?</h4>
                      <p className="text-[11px] sm:text-xs text-blue-700 leading-relaxed">
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
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                      Get instant credits for one-time use. Perfect for occasional try-ons!
                    </p>

                    <div className="space-y-2.5 sm:space-y-3">
                      {ONE_TIME_PACKAGES.map((pkg, index) => (
                        <div
                          key={index}
                          className={`relative border-2 rounded-lg p-3 sm:p-4 transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${
                            pkg.popular
                              ? 'border-purple-300 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          onClick={() => onBuyCredits(pkg.tryOns, pkg.price)}
                        >
                          {pkg.popular && (
                            <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-purple-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm">
                                POPULAR
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                {pkg.tryOns} Try-On{pkg.tryOns > 1 ? 's' : ''}
                              </h4>
                              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                                ₹{Math.round(pkg.price / pkg.tryOns)} per try-on
                                {pkg.savings && (
                                  <span className="text-green-600 font-medium ml-1">
                                    (Save ₹{pkg.savings})
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xl sm:text-2xl font-bold text-gray-900">₹{pkg.price}</div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBuyCredits(pkg.tryOns, pkg.price);
                                }}
                                className={`mt-1.5 sm:mt-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                                  pkg.popular
                                    ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              >
                                Buy Now
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 sm:mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-yellow-900 text-xs sm:text-sm mb-1.5 sm:mb-2">💰 Best Value</h4>
                      <p className="text-[11px] sm:text-xs text-yellow-700 leading-relaxed">
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
