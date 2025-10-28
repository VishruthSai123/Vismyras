/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Calendar, Sparkles, Package, Clock } from 'lucide-react';
import { billingService } from '../services/billingService';
import { UserBilling, SubscriptionTier, SUBSCRIPTION_PLANS } from '../types/billing';

interface UsageScreenProps {
  onBack: () => void;
}

const UsageScreen: React.FC<UsageScreenProps> = ({ onBack }) => {
  const [billing, setBilling] = useState<UserBilling | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const userBilling = billingService.getUserBilling();
    const usageStats = billingService.getUsageStats();
    setBilling(userBilling);
    setStats(usageStats);
  }, []);

  if (!billing || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTierBadgeColor = (tier: SubscriptionTier) => {
    return tier === SubscriptionTier.PREMIUM
      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      : 'bg-gray-200 text-gray-700';
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'try-on':
        return 'Virtual Try-On';
      case 'save':
        return 'Saved Outfit';
      case 'share':
        return 'Shared Design';
      default:
        return action;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usage & Statistics</h1>
            <p className="text-sm text-gray-600">Track your try-ons and subscription</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Plan</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTierBadgeColor(
                    stats.tier
                  )}`}
                >
                  {stats.tier.toUpperCase()}
                </span>
              </div>
              <Sparkles className="text-purple-500" size={24} />
            </div>
            <p className="text-sm text-gray-600">
              {SUBSCRIPTION_PLANS[stats.tier].monthlyLimit} try-ons per month
            </p>
          </motion.div>

          {/* Usage This Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Used This Month</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.used}
                  <span className="text-lg text-gray-500">/{stats.limit}</span>
                </p>
              </div>
              <TrendingUp className="text-blue-500" size={24} />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {stats.remaining} remaining
            </p>
          </motion.div>

          {/* Additional Credits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">One-Time Credits</p>
                <p className="text-3xl font-bold text-gray-900">{stats.oneTimeCredits}</p>
              </div>
              <Package className="text-green-500" size={24} />
            </div>
            <p className="text-sm text-gray-600">
              {stats.oneTimeCredits > 0
                ? 'Extra try-ons available'
                : 'No additional credits'}
            </p>
          </motion.div>
        </div>

        {/* Reset Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={24} />
            <div>
              <p className="font-semibold text-gray-900">Monthly Reset</p>
              <p className="text-sm text-gray-600">
                Your try-on limit resets in {stats.daysUntilReset} day{stats.daysUntilReset !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Usage History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock size={24} className="text-purple-500" />
              Usage History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {billing.usage.history.length} activity this month
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {billing.usage.history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No activity yet</p>
                <p className="text-sm">Start creating virtual try-ons to see your history</p>
              </div>
            ) : (
              billing.usage.history
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <Sparkles size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getActionLabel(entry.action)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(entry.timestamp)}
                        </p>
                        {entry.garmentId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Garment: {entry.garmentId}
                          </p>
                        )}
                      </div>
                    </div>
                    {entry.cost > 0 && (
                      <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        Paid Credit
                      </span>
                    )}
                  </div>
                ))
            )}
          </div>
        </motion.div>

        {/* One-Time Purchases */}
        {billing.oneTimePurchases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package size={24} className="text-green-500" />
                Credit Packages
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {billing.oneTimePurchases.length} purchase
                {billing.oneTimePurchases.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {billing.oneTimePurchases.map((purchase, index) => {
                const isExpired = purchase.expiryDate < Date.now();
                return (
                  <div
                    key={purchase.id}
                    className={`p-4 flex items-center justify-between ${
                      isExpired ? 'opacity-50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {purchase.tryOnsCount === 0
                          ? 'Used'
                          : `${purchase.tryOnsCount} Credits`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Purchased: {formatDate(purchase.purchaseDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isExpired
                          ? 'Expired'
                          : `Expires: ${formatDate(purchase.expiryDate)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{purchase.price}</p>
                      {purchase.razorpayPaymentId && (
                        <p className="text-xs text-gray-500 mt-1">
                          {purchase.razorpayPaymentId.slice(0, 15)}...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UsageScreen;
