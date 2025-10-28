/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'framer-motion';
import { SubscriptionTier, SUBSCRIPTION_PLANS } from '../types/billing';

interface UsageDisplayProps {
  used: number;
  limit: number;
  remaining: number;
  oneTimeCredits: number;
  percentUsed: number;
  tier: SubscriptionTier;
  daysUntilReset: number;
  onUpgradeClick: () => void;
}

const UsageDisplay: React.FC<UsageDisplayProps> = ({
  used,
  limit,
  remaining,
  oneTimeCredits,
  percentUsed,
  tier,
  daysUntilReset,
  onUpgradeClick,
}) => {
  const plan = SUBSCRIPTION_PLANS[tier];
  const totalAvailable = remaining + oneTimeCredits;
  
  // Determine color based on usage
  const getBarColor = () => {
    if (percentUsed >= 90) return 'bg-red-500';
    if (percentUsed >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (percentUsed >= 90) return 'text-red-600';
    if (percentUsed >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{plan.name} Plan</h3>
            {tier === SubscriptionTier.FREE && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Free
              </span>
            )}
            {tier === SubscriptionTier.PREMIUM && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-medium">
                Premium
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
          </p>
        </div>
        
        {tier === SubscriptionTier.FREE && (
          <button
            onClick={onUpgradeClick}
            className="text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm hover:shadow"
          >
            Upgrade
          </button>
        )}
      </div>

      {/* Usage Stats */}
      <div className="space-y-2">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-600">Monthly Try-Ons</span>
            <span className={`font-semibold ${getTextColor()}`}>
              {used} / {limit}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getBarColor()} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentUsed, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Remaining Credits */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-gray-600">Remaining</span>
          <span className="font-semibold text-gray-900">
            {remaining} {oneTimeCredits > 0 && `+ ${oneTimeCredits} paid`}
          </span>
        </div>

        {/* One-Time Credits Display */}
        {oneTimeCredits > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-green-50 border border-green-200 rounded-md p-2 mt-2"
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-green-700">
                {oneTimeCredits} bonus credits available
              </span>
            </div>
          </motion.div>
        )}

        {/* Warning when low */}
        {totalAvailable === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-md p-2 mt-2"
          >
            <p className="text-xs text-red-700 font-medium">
              ⚠️ No try-ons remaining this month
            </p>
          </motion.div>
        )}
        
        {totalAvailable > 0 && totalAvailable <= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mt-2"
          >
            <p className="text-xs text-yellow-700 font-medium">
              ⚡ Only {totalAvailable} try-on{totalAvailable !== 1 ? 's' : ''} left!
            </p>
          </motion.div>
        )}
      </div>

      {/* Upgrade CTA for Free users */}
      {tier === SubscriptionTier.FREE && used >= limit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pt-3 border-t border-gray-200"
        >
          <p className="text-xs text-gray-600 mb-2">
            Get 25 try-ons/month with Premium
          </p>
          <button
            onClick={onUpgradeClick}
            className="w-full text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-md transition-all duration-200"
          >
            Upgrade for ₹199/month
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default UsageDisplay;
