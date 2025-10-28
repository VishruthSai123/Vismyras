/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Subscription Tiers
 */
export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * Payment type
 */
export enum PaymentType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  ONE_TIME = 'ONE_TIME',
}

/**
 * Subscription plan details
 */
export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // in INR
  monthlyLimit: number;
  description: string;
  features: string[];
}

/**
 * User subscription information
 */
export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: number; // timestamp
  endDate: number; // timestamp
  razorpaySubscriptionId?: string;
  autoRenew: boolean;
}

/**
 * Usage record for tracking try-ons
 */
export interface UsageRecord {
  month: string; // Format: 'YYYY-MM'
  tryOnsUsed: number;
  tryOnsLimit: number;
  lastUpdated: number; // timestamp
  history: UsageHistoryEntry[];
}

/**
 * Individual usage history entry
 */
export interface UsageHistoryEntry {
  timestamp: number;
  action: 'try-on' | 'pose-change' | 'chat-edit';
  garmentId?: string;
  cost: number; // Cost in INR (0 for free tier usage)
}

/**
 * Payment transaction record
 */
export interface PaymentTransaction {
  id: string;
  type: PaymentType;
  amount: number; // in INR
  currency: string;
  status: 'pending' | 'success' | 'failed';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  timestamp: number;
  description: string;
}

/**
 * One-time purchase record (pay-per-use)
 */
export interface OneTimePurchase {
  id: string;
  tryOnsCount: number;
  price: number; // in INR
  purchaseDate: number;
  expiryDate: number; // One-time credits expire after 30 days
  razorpayPaymentId?: string;
}

/**
 * Complete user billing information
 */
export interface UserBilling {
  subscription: UserSubscription;
  usage: UsageRecord;
  oneTimePurchases: OneTimePurchase[];
  transactions: PaymentTransaction[];
}

/**
 * Predefined subscription plans
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    price: 0,
    monthlyLimit: 3,
    description: 'Perfect for trying out Vismyras',
    features: [
      '3 try-ons per month',
      'All clothing categories',
      'Basic pose variations',
      'Save outfits',
    ],
  },
  [SubscriptionTier.PREMIUM]: {
    tier: SubscriptionTier.PREMIUM,
    name: 'Premium',
    price: 199,
    monthlyLimit: 25,
    description: 'Best for fashion enthusiasts',
    features: [
      '25 try-ons per month',
      'All clothing categories',
      'Unlimited pose variations',
      'AI style editing',
      'Priority generation',
      'Save unlimited outfits',
    ],
  },
};

/**
 * Pay-per-use pricing
 */
export const PAY_PER_USE_PRICE = 29; // INR per try-on

/**
 * One-time purchase options
 */
export const ONE_TIME_PACKAGES = [
  { tryOns: 1, price: 29, popular: false },
  { tryOns: 5, price: 129, popular: true, savings: 16 }, // ₹26 per try-on (11% off)
  { tryOns: 10, price: 249, popular: false, savings: 41 }, // ₹25 per try-on (14% off)
];

/**
 * Razorpay configuration
 */
export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

/**
 * Razorpay payment options
 */
export interface RazorpayPaymentOptions {
  key: string;
  amount: number; // in paise (1 INR = 100 paise)
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

/**
 * Razorpay payment response
 */
export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Usage limit error
 */
export class UsageLimitError extends Error {
  public readonly currentUsage: number;
  public readonly limit: number;
  public readonly tier: SubscriptionTier;

  constructor(message: string, currentUsage: number, limit: number, tier: SubscriptionTier) {
    super(message);
    this.name = 'UsageLimitError';
    this.currentUsage = currentUsage;
    this.limit = limit;
    this.tier = tier;
  }
}
