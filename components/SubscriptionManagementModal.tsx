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
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gray-900">
                    ⚙️ Subscription Settings
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your subscription
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

              {/* Content */}
              <div className="p-6">
                {!showCancelConfirm ? (
                  <>
                    {/* Current Plan */}
                    <div className={`rounded-lg p-6 mb-6 ${
                      isPremium 
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200'
                        : 'bg-gray-50 border-2 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {isPremium ? '✨ Premium Plan' : '🆓 Free Plan'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {isPremium ? '50 try-ons per month' : '3 try-ons per month'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ₹{isPremium ? '199' : '0'}
                          </div>
                          <div className="text-xs text-gray-500">per month</div>
                        </div>
                      </div>

                      {isPremium && (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-green-500' : 'bg-orange-500'
                            }`} />
                            <span className="text-sm font-medium text-gray-700">
                              {isActive ? 'Active' : 'Cancelled'}
                            </span>
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            {isCancelled ? (
                              <>
                                <p className="text-orange-600 font-medium">
                                  ⚠️ Subscription cancelled
                                </p>
                                <p>
                                  You'll keep Premium access until{' '}
                                  <strong>{endDateObj.toLocaleDateString()}</strong>
                                </p>
                                <p className="text-xs mt-2">
                                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                                </p>
                              </>
                            ) : (
                              <>
                                <p>
                                  Next billing date:{' '}
                                  <strong>{endDateObj.toLocaleDateString()}</strong>
                                </p>
                                <p className="text-xs mt-2">
                                  Auto-renewal: {isActive ? '✅ Enabled' : '❌ Disabled'}
                                </p>
                              </>
                            )}
                          </div>

                          {razorpaySubscriptionId && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                Subscription ID: {razorpaySubscriptionId.substring(0, 20)}...
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Features */}
                    {isPremium && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Your Premium Benefits</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">50 try-ons per month</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">All clothing categories</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">Unlimited pose variations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">AI style editing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">Priority generation</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    {isPremium && (
                      <div className="space-y-3">
                        {isCancelled ? (
                          <button
                            onClick={handleReactivate}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            🔄 Reactivate Subscription
                          </button>
                        ) : (
                          <button
                            onClick={handleCancelClick}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-red-200"
                          >
                            Cancel Subscription
                          </button>
                        )}
                      </div>
                    )}

                    {!isPremium && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                          💡 Upgrade to Premium to get 50 try-ons per month and unlock all features!
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Cancellation Confirmation */
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-900 text-lg mb-2">
                        ⚠️ Cancel Premium Subscription?
                      </h4>
                      <p className="text-sm text-orange-700 mb-3">
                        Are you sure you want to cancel your Premium subscription?
                      </p>
                      
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">✓</span>
                          <span>You'll keep Premium access until <strong>{endDateObj.toLocaleDateString()}</strong></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">✓</span>
                          <span>No immediate charges - use remaining {daysRemaining} days</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">✗</span>
                          <span>Auto-renewal will be stopped</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">✗</span>
                          <span>After {endDateObj.toLocaleDateString()}, you'll return to the Free plan (3 try-ons/month)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">✗</span>
                          <span><strong>No refunds</strong> will be issued for the remaining period</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs text-blue-700">
                        💡 <strong>Changed your mind?</strong> You can reactivate your subscription anytime before {endDateObj.toLocaleDateString()} without losing any benefits.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCancelling}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Keep Premium
                      </button>
                      <button
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
