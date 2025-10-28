/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {
  SubscriptionTier,
  SubscriptionStatus,
  UserSubscription,
  UsageRecord,
  UsageHistoryEntry,
  UserBilling,
  OneTimePurchase,
  PaymentTransaction,
  SUBSCRIPTION_PLANS,
  UsageLimitError,
} from '../types/billing';

const STORAGE_KEY_PREFIX = 'vismyras_billing_';

/**
 * Manages user subscription, usage tracking, and billing
 */
export class BillingService {
  private static instance: BillingService;

  private constructor() {}

  public static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  /**
   * Get current month key (YYYY-MM format)
   */
  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Initialize default user billing
   */
  private getDefaultBilling(): UserBilling {
    const now = Date.now();
    return {
      subscription: {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: now + 365 * 24 * 60 * 60 * 1000, // 1 year
        autoRenew: false,
      },
      usage: {
        month: this.getCurrentMonth(),
        tryOnsUsed: 0,
        tryOnsLimit: SUBSCRIPTION_PLANS[SubscriptionTier.FREE].monthlyLimit,
        lastUpdated: now,
        history: [],
      },
      oneTimePurchases: [],
      transactions: [],
    };
  }

  /**
   * Load user billing from localStorage
   */
  public getUserBilling(): UserBilling {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
      if (stored) {
        const billing: UserBilling = JSON.parse(stored);
        
        // Check if month has changed, reset usage
        if (billing.usage.month !== this.getCurrentMonth()) {
          billing.usage = {
            month: this.getCurrentMonth(),
            tryOnsUsed: 0,
            tryOnsLimit: SUBSCRIPTION_PLANS[billing.subscription.tier].monthlyLimit,
            lastUpdated: Date.now(),
            history: [],
          };
          this.saveUserBilling(billing);
        }
        
        // Check if subscription has expired
        if (billing.subscription.endDate < Date.now() && billing.subscription.tier === SubscriptionTier.PREMIUM) {
          billing.subscription.status = SubscriptionStatus.EXPIRED;
          billing.subscription.tier = SubscriptionTier.FREE;
          billing.usage.tryOnsLimit = SUBSCRIPTION_PLANS[SubscriptionTier.FREE].monthlyLimit;
          this.saveUserBilling(billing);
        }
        
        return billing;
      }
    } catch (e) {
      console.error('Failed to load user billing:', e);
    }
    
    const defaultBilling = this.getDefaultBilling();
    this.saveUserBilling(defaultBilling);
    return defaultBilling;
  }

  /**
   * Save user billing to localStorage
   */
  public saveUserBilling(billing: UserBilling): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(billing));
    } catch (e) {
      console.error('Failed to save user billing:', e);
    }
  }

  /**
   * Get available one-time credits (unexpired)
   */
  private getAvailableOneTimeCredits(billing: UserBilling): number {
    const now = Date.now();
    return billing.oneTimePurchases
      .filter(purchase => purchase.expiryDate > now)
      .reduce((sum, purchase) => sum + purchase.tryOnsCount, 0);
  }

  /**
   * Check if user can make a try-on request
   */
  public canMakeRequest(): { allowed: boolean; reason?: string; billing: UserBilling } {
    const billing = this.getUserBilling();
    
    // Check subscription usage
    if (billing.usage.tryOnsUsed < billing.usage.tryOnsLimit) {
      return { allowed: true, billing };
    }
    
    // Check one-time credits
    const availableCredits = this.getAvailableOneTimeCredits(billing);
    if (availableCredits > 0) {
      return { allowed: true, billing };
    }
    
    // No credits available
    const plan = SUBSCRIPTION_PLANS[billing.subscription.tier];
    return {
      allowed: false,
      reason: `You've used all ${plan.monthlyLimit} try-ons for this month. Upgrade to Premium or purchase additional try-ons!`,
      billing,
    };
  }

  /**
   * Consume a try-on credit
   */
  public consumeTryOn(action: UsageHistoryEntry['action'], garmentId?: string): void {
    const billing = this.getUserBilling();
    
    const entry: UsageHistoryEntry = {
      timestamp: Date.now(),
      action,
      garmentId,
      cost: 0,
    };
    
    // Try to use subscription credits first
    if (billing.usage.tryOnsUsed < billing.usage.tryOnsLimit) {
      billing.usage.tryOnsUsed++;
      billing.usage.history.push(entry);
      billing.usage.lastUpdated = Date.now();
      this.saveUserBilling(billing);
      return;
    }
    
    // Use one-time credits
    const now = Date.now();
    for (const purchase of billing.oneTimePurchases) {
      if (purchase.expiryDate > now && purchase.tryOnsCount > 0) {
        purchase.tryOnsCount--;
        entry.cost = 29; // Mark that this used a paid credit
        billing.usage.history.push(entry);
        billing.usage.lastUpdated = Date.now();
        this.saveUserBilling(billing);
        return;
      }
    }
    
    throw new UsageLimitError(
      'No available credits',
      billing.usage.tryOnsUsed,
      billing.usage.tryOnsLimit,
      billing.subscription.tier
    );
  }

  /**
   * Upgrade to Premium subscription
   */
  public upgradeToPremium(razorpaySubscriptionId?: string): void {
    const billing = this.getUserBilling();
    const now = Date.now();
    const endDate = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    
    billing.subscription = {
      tier: SubscriptionTier.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
      razorpaySubscriptionId,
      autoRenew: true,
    };
    
    billing.usage.tryOnsLimit = SUBSCRIPTION_PLANS[SubscriptionTier.PREMIUM].monthlyLimit;
    
    this.saveUserBilling(billing);
  }

  /**
   * Add one-time purchase credits
   */
  public addOneTimePurchase(tryOnsCount: number, price: number, razorpayPaymentId?: string): string {
    const billing = this.getUserBilling();
    const now = Date.now();
    
    const purchase: OneTimePurchase = {
      id: `purchase-${now}`,
      tryOnsCount,
      price,
      purchaseDate: now,
      expiryDate: now + 30 * 24 * 60 * 60 * 1000, // 30 days
      razorpayPaymentId,
    };
    
    billing.oneTimePurchases.push(purchase);
    this.saveUserBilling(billing);
    
    return purchase.id;
  }

  /**
   * Add payment transaction record
   */
  public addTransaction(transaction: PaymentTransaction): void {
    const billing = this.getUserBilling();
    billing.transactions.push(transaction);
    this.saveUserBilling(billing);
  }

  /**
   * Cancel Premium subscription (downgrade to Free at end of period)
   */
  public cancelSubscription(): void {
    const billing = this.getUserBilling();
    if (billing.subscription.tier === SubscriptionTier.PREMIUM) {
      billing.subscription.autoRenew = false;
      billing.subscription.status = SubscriptionStatus.CANCELLED;
      this.saveUserBilling(billing);
    }
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): {
    used: number;
    limit: number;
    remaining: number;
    oneTimeCredits: number;
    percentUsed: number;
    tier: SubscriptionTier;
    daysUntilReset: number;
  } {
    const billing = this.getUserBilling();
    const used = billing.usage.tryOnsUsed;
    const limit = billing.usage.tryOnsLimit;
    const remaining = Math.max(0, limit - used);
    const oneTimeCredits = this.getAvailableOneTimeCredits(billing);
    const percentUsed = (used / limit) * 100;
    
    // Calculate days until month reset
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    return {
      used,
      limit,
      remaining,
      oneTimeCredits,
      percentUsed,
      tier: billing.subscription.tier,
      daysUntilReset,
    };
  }

  /**
   * Reset all billing data (for testing)
   */
  public resetBilling(): void {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}user`);
  }

  /**
   * Load billing data from Supabase (sync from cloud)
   */
  public loadFromSupabase(billingData: UserBilling): void {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(billingData));
  }

  /**
   * Get billing data for Supabase sync (to cloud)
   */
  public getBillingDataForSync(): UserBilling {
    return this.getUserBilling();
  }

  /**
   * Set current user ID for Supabase sync
   */
  private currentUserId: string | null = null;

  public setCurrentUser(userId: string | null): void {
    this.currentUserId = userId;
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }
}

// Export singleton instance
export const billingService = BillingService.getInstance();
