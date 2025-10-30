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
 * Note: Access granting/revoking/expiring is handled automatically by Razorpay webhooks
 * See WEBHOOK_SETUP.md for configuration details
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
        
        // Check if subscription has expired and handle downgrade
        if (this.isSubscriptionExpired(billing)) {
          this.handleSubscriptionExpiry(billing);
        }
        
        // Clean up expired one-time purchases
        this.cleanupExpiredPurchases(billing);
        
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
   * Check if subscription has expired
   */
  private isSubscriptionExpired(billing: UserBilling): boolean {
    return (
      billing.subscription.tier === SubscriptionTier.PREMIUM &&
      billing.subscription.endDate < Date.now() &&
      billing.subscription.status === SubscriptionStatus.ACTIVE
    );
  }

  /**
   * Handle subscription expiry - downgrade to free tier
   */
  private handleSubscriptionExpiry(billing: UserBilling): void {
    console.log('⚠️ Premium subscription expired, downgrading to FREE tier');
    
    billing.subscription.status = SubscriptionStatus.EXPIRED;
    billing.subscription.tier = SubscriptionTier.FREE;
    billing.subscription.autoRenew = false;
    billing.usage.tryOnsLimit = SUBSCRIPTION_PLANS[SubscriptionTier.FREE].monthlyLimit;
    
    // Add transaction record for expiry
    const expiryTransaction: PaymentTransaction = {
      id: `txn_expiry_${Date.now()}`,
      type: 'subscription' as any,
      amount: 0,
      currency: 'INR',
      status: 'success',
      timestamp: Date.now(),
      description: 'Premium subscription expired - Downgraded to FREE tier',
    };
    billing.transactions.push(expiryTransaction);
    
    this.saveUserBilling(billing);
  }

  /**
   * Clean up expired one-time purchases
   */
  private cleanupExpiredPurchases(billing: UserBilling): void {
    const now = Date.now();
    const expiredCount = billing.oneTimePurchases.filter(p => p.expiryDate <= now).length;
    
    if (expiredCount > 0) {
      billing.oneTimePurchases = billing.oneTimePurchases.filter(p => p.expiryDate > now);
      this.saveUserBilling(billing);
      console.log(`🧹 Cleaned up ${expiredCount} expired one-time purchase(s)`);
    }
  }

  /**
   * Save user billing to localStorage AND sync to database
   */
  public saveUserBilling(billing: UserBilling): void {
    try {
      // Save to localStorage for fast access
      localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(billing));
      
      // Sync to Supabase if user is logged in
      if (this.currentUserId) {
        this.syncToSupabase(billing).catch(err => {
          console.error('Failed to sync billing to Supabase:', err);
        });
      }
    } catch (e) {
      console.error('Failed to save user billing:', e);
    }
  }

  /**
   * Sync billing data to Supabase (background operation)
   */
  private async syncToSupabase(billing: UserBilling): Promise<void> {
    if (!this.currentUserId) return;
    
    try {
      const { supabaseService } = await import('./supabaseService');
      await supabaseService.saveUserBilling(this.currentUserId, billing);
    } catch (err) {
      console.error('Supabase sync failed:', err);
      throw err;
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
   * Uses atomic read-modify-write to prevent race conditions
   */
  public consumeTryOn(action: UsageHistoryEntry['action'], garmentId?: string): void {
    // Get fresh billing data to avoid stale state
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
    
    // Use one-time credits (find first available, non-expired purchase)
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
   * NOTE: In production, access is granted automatically by Razorpay webhooks
   * This method is for local testing only. See WEBHOOK_SETUP.md for webhook configuration.
   */
  public upgradeToPremium(razorpaySubscriptionId?: string): void {
    const billing = this.getUserBilling();
    const now = Date.now();
    const endDate = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    
    console.log('✅ GRANTING PREMIUM ACCESS (Manual - Testing Only)');
    console.log('📅 Valid until:', new Date(endDate).toLocaleString());
    console.log('⚠️  In production, this is handled automatically by webhooks');
    
    billing.subscription = {
      tier: SubscriptionTier.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
      razorpaySubscriptionId,
      autoRenew: true,
    };
    
    billing.usage.tryOnsLimit = SUBSCRIPTION_PLANS[SubscriptionTier.PREMIUM].monthlyLimit;
    
    // Add activation transaction
    const activationTransaction: PaymentTransaction = {
      id: `txn_activation_${now}`,
      type: 'subscription' as any,
      amount: 199,
      currency: 'INR',
      status: 'success',
      timestamp: now,
      description: 'Premium subscription activated (manual)',
      razorpayPaymentId: razorpaySubscriptionId,
    };
    billing.transactions.push(activationTransaction);
    
    this.saveUserBilling(billing);
  }

  /**
   * Revoke Premium access (immediate downgrade)
   * NOTE: In production, revocation is handled automatically by Razorpay webhooks
   * This method is for local testing/admin actions only. See WEBHOOK_SETUP.md
   */
  public revokePremium(reason: string = 'Manual revocation'): void {
    const billing = this.getUserBilling();
    
    if (billing.subscription.tier === SubscriptionTier.PREMIUM) {
      console.log('🚫 REVOKING PREMIUM ACCESS (Manual - Testing Only)');
      console.log('📝 Reason:', reason);
      console.log('⚠️  In production, this is handled automatically by webhooks');
      
      billing.subscription.status = SubscriptionStatus.CANCELLED;
      billing.subscription.tier = SubscriptionTier.FREE;
      billing.subscription.autoRenew = false;
      billing.subscription.endDate = Date.now(); // Expire immediately
      billing.usage.tryOnsLimit = SUBSCRIPTION_PLANS[SubscriptionTier.FREE].monthlyLimit;
      
      // Add revocation transaction
      const revocationTransaction: PaymentTransaction = {
        id: `txn_revoke_${Date.now()}`,
        type: 'subscription' as any,
        amount: 0,
        currency: 'INR',
        status: 'success',
        timestamp: Date.now(),
        description: `Premium access revoked (manual) - ${reason}`,
      };
      billing.transactions.push(revocationTransaction);
      
      this.saveUserBilling(billing);
    }
  }

  /**
   * Add one-time purchase credits
   * NOTE: In production, credits are granted automatically by Razorpay webhooks
   * This method is for local testing only. See WEBHOOK_SETUP.md
   */
  public addOneTimePurchase(tryOnsCount: number, price: number, razorpayPaymentId?: string): string {
    const billing = this.getUserBilling();
    const now = Date.now();
    const expiryDate = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    
    console.log('✅ GRANTING ONE-TIME CREDITS (Manual - Testing Only)');
    console.log('🎫 Credits:', tryOnsCount);
    console.log('📅 Expires:', new Date(expiryDate).toLocaleString());
    console.log('⚠️  In production, this is handled automatically by webhooks');
    
    const purchase: OneTimePurchase = {
      id: `purchase-${now}`,
      tryOnsCount,
      price,
      purchaseDate: now,
      expiryDate,
      razorpayPaymentId,
    };
    
    billing.oneTimePurchases.push(purchase);
    this.saveUserBilling(billing);
    
    return purchase.id;
  }

  /**
   * Revoke one-time purchase credits
   * NOTE: In production, revocation is handled automatically by Razorpay webhooks (e.g., refunds)
   * This method is for local testing/admin actions only. See WEBHOOK_SETUP.md
   */
  public revokeOneTimePurchase(purchaseId: string, reason: string = 'Manual revocation'): void {
    const billing = this.getUserBilling();
    const purchaseIndex = billing.oneTimePurchases.findIndex(p => p.id === purchaseId);
    
    if (purchaseIndex !== -1) {
      const purchase = billing.oneTimePurchases[purchaseIndex];
      console.log('🚫 REVOKING ONE-TIME CREDITS (Manual - Testing Only)');
      console.log('🎫 Credits:', purchase.tryOnsCount);
      console.log('📝 Reason:', reason);
      console.log('⚠️  In production, this is handled automatically by webhooks');
      
      billing.oneTimePurchases.splice(purchaseIndex, 1);
      
      // Add revocation transaction
      const revocationTransaction: PaymentTransaction = {
        id: `txn_revoke_${Date.now()}`,
        type: 'one_time' as any,
        amount: 0,
        currency: 'INR',
        status: 'success',
        timestamp: Date.now(),
        description: `One-time credits revoked - ${reason}`,
      };
      billing.transactions.push(revocationTransaction);
      
      this.saveUserBilling(billing);
    }
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
      console.log('⚠️ Premium subscription cancelled - will expire at:', new Date(billing.subscription.endDate).toLocaleString());
      
      billing.subscription.autoRenew = false;
      billing.subscription.status = SubscriptionStatus.CANCELLED;
      
      // Add cancellation transaction
      const cancellationTransaction: PaymentTransaction = {
        id: `txn_cancel_${Date.now()}`,
        type: 'subscription' as any,
        amount: 0,
        currency: 'INR',
        status: 'success',
        timestamp: Date.now(),
        description: 'Premium subscription cancelled - Will expire at end of billing period',
      };
      billing.transactions.push(cancellationTransaction);
      
      this.saveUserBilling(billing);
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  public reactivateSubscription(): void {
    const billing = this.getUserBilling();
    if (
      billing.subscription.tier === SubscriptionTier.PREMIUM &&
      billing.subscription.status === SubscriptionStatus.CANCELLED &&
      billing.subscription.endDate > Date.now()
    ) {
      console.log('✅ Premium subscription reactivated');
      
      billing.subscription.autoRenew = true;
      billing.subscription.status = SubscriptionStatus.ACTIVE;
      
      // Add reactivation transaction
      const reactivationTransaction: PaymentTransaction = {
        id: `txn_reactivate_${Date.now()}`,
        type: 'subscription' as any,
        amount: 0,
        currency: 'INR',
        status: 'success',
        timestamp: Date.now(),
        description: 'Premium subscription reactivated',
      };
      billing.transactions.push(reactivationTransaction);
      
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

  public async setCurrentUser(userId: string | null): Promise<void> {
    this.currentUserId = userId;
    
    if (userId) {
      // User logged in - load billing from Supabase database
      await this.loadBillingFromSupabase(userId);
    } else {
      // User logged out - clear localStorage billing data
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}user`);
    }
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Load billing data from Supabase on login
   * This fixes the localStorage reset issue by loading from database
   */
  private async loadBillingFromSupabase(userId: string): Promise<void> {
    try {
      const { supabaseService } = await import('./supabaseService');
      const dbBilling = await supabaseService.getUserBilling(userId);
      
      if (dbBilling) {
        // Save to localStorage for fast access
        localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(dbBilling));
        console.log('✅ Billing data loaded from database');
      } else {
        // No billing data yet - use default (will be created by database trigger)
        const defaultBilling = this.getDefaultBilling();
        this.saveUserBilling(defaultBilling);
        console.log('✅ Initialized default billing data');
      }
    } catch (err) {
      console.error('Failed to load billing from Supabase:', err);
      // Fallback to default billing
      const defaultBilling = this.getDefaultBilling();
      localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(defaultBilling));
    }
  }
}

// Export singleton instance
export const billingService = BillingService.getInstance();
