/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckCircleIcon } from './icons';
import { SubscriptionTier, SubscriptionStatus } from '../types/billing';

interface SubscriptionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  endDate: number;
  razorpaySubscriptionId?: string;
  onCancelSubscription: () => Promise<void>;
  onReactivateSubscription: () => void;
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  subscriptionStatus,
  endDate,
  razorpaySubscriptionId,
  onCancelSubscription,
  onReactivateSubscription,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen) return null;

  const isPremium = currentTier === SubscriptionTier.PREMIUM;
  const isActive = subscriptionStatus === SubscriptionStatus.ACTIVE;
  const isCancelled = subscriptionStatus === SubscriptionStatus.CANCELLED;
  const endDateObj = new Date(endDate);
  const daysRemaining = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancelSubscription();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Cancellation error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivate = () => {
    onReactivateSubscription();
    setShowCancelConfirm(false);
  };

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
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 truncate">
                    ⚙️ Subscription Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                    Manage your subscription
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

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {!showCancelConfirm ? (
                  <>
                    {/* Current Plan */}
                    <div className={`rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 ${
                      isPremium 
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200'
                        : 'bg-gray-50 border-2 border-gray-200'
                    }`}>
                      <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                            {isPremium ? '✨ Premium Plan' : '🆓 Free Plan'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                            {isPremium ? '50 try-ons per month' : '3 try-ons per month'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl sm:text-2xl font-bold text-gray-900">
                            ₹{isPremium ? '199' : '0'}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500">per month</div>
                        </div>
                      </div>

                      {isPremium && (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-green-500' : 'bg-orange-500'
                            }`} />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                              {isActive ? 'Active' : 'Cancelled'}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                            {isCancelled ? (
                              <>
                                <p className="text-orange-600 font-medium">
                                  ⚠️ Subscription cancelled
                                </p>
                                <p className="leading-relaxed">
                                  You'll keep Premium access until{' '}
                                  <strong>{endDateObj.toLocaleDateString()}</strong>
                                </p>
                                <p className="text-[11px] sm:text-xs mt-1.5 sm:mt-2">
                                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="leading-relaxed">
                                  Next billing date:{' '}
                                  <strong>{endDateObj.toLocaleDateString()}</strong>
                                </p>
                                <p className="text-[11px] sm:text-xs mt-1.5 sm:mt-2">
                                  Auto-renewal: {isActive ? '✅ Enabled' : '❌ Disabled'}
                                </p>
                              </>
                            )}
                          </div>

                          {razorpaySubscriptionId && (
                            <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-gray-200">
                              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                Subscription ID: {razorpaySubscriptionId.substring(0, 20)}...
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Features */}
                    {isPremium && (
                      <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Your Premium Benefits</h4>
                        <ul className="space-y-1.5 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-700">50 try-ons per month</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-700">All clothing categories</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-700">Unlimited pose variations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-700">AI style editing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-700">Priority generation</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    {isPremium && (
                      <div className="space-y-2.5 sm:space-y-3">
                        {isCancelled ? (
                          <button
                            onClick={handleReactivate}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                          >
                            🔄 Reactivate Subscription
                          </button>
                        ) : (
                          <button
                            onClick={handleCancelClick}
                            className="w-full bg-red-50 hover:bg-red-100 active:scale-[0.98] text-red-600 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 border border-red-200 text-sm sm:text-base"
                          >
                            Cancel Subscription
                          </button>
                        )}
                      </div>
                    )}

                    {!isPremium && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                          💡 Upgrade to Premium to get 50 try-ons per month and unlock all features!
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Cancellation Confirmation */
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-orange-900 text-base sm:text-lg mb-1.5 sm:mb-2">
                        ⚠️ Cancel Premium Subscription?
                      </h4>
                      <p className="text-xs sm:text-sm text-orange-700 mb-2 sm:mb-3 leading-relaxed">
                        Are you sure you want to cancel your Premium subscription?
                      </p>
                      
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                          <span className="leading-relaxed">You'll keep Premium access until <strong>{endDateObj.toLocaleDateString()}</strong></span>
                        </div>
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                          <span className="leading-relaxed">No immediate charges - use remaining {daysRemaining} days</span>
                        </div>
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <span className="text-orange-600 font-bold flex-shrink-0">✗</span>
                          <span className="leading-relaxed">Auto-renewal will be stopped</span>
                        </div>
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <span className="text-orange-600 font-bold flex-shrink-0">✗</span>
                          <span className="leading-relaxed">After {endDateObj.toLocaleDateString()}, you'll return to the Free plan (3 try-ons/month)</span>
                        </div>
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <span className="text-red-600 font-bold flex-shrink-0">✗</span>
                          <span className="leading-relaxed"><strong>No refunds</strong> will be issued for the remaining period</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <p className="text-[11px] sm:text-xs text-blue-700 leading-relaxed">
                        💡 <strong>Changed your mind?</strong> You can reactivate your subscription anytime before {endDateObj.toLocaleDateString()} without losing any benefits.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCancelling}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
                      >
                        Keep Premium
                      </button>
                      <button
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                        className="flex-1 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2"
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionManagementModal;
