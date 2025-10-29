/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {
  RazorpayPaymentOptions,
  RazorpayPaymentResponse,
  PaymentType,
  PaymentTransaction,
} from '../types/billing';
import { billingService } from './billingService';

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Razorpay Payment Service
 * Handles all payment-related operations
 */
export class RazorpayService {
  private static instance: RazorpayService;
  private razorpayKeyId: string;
  private isLiveMode: boolean;
  private isScriptLoaded: boolean = false;

  private constructor() {
    // Determine if we're in live mode or test mode
    this.isLiveMode = import.meta.env.VITE_RAZORPAY_LIVE_MODE === 'true';
    
    // Get the appropriate key based on mode
    if (this.isLiveMode) {
      this.razorpayKeyId = import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID || '';
      console.log('🔴 Razorpay: LIVE MODE');
    } else {
      this.razorpayKeyId = import.meta.env.VITE_RAZORPAY_TEST_KEY_ID || '';
      console.log('🟢 Razorpay: TEST MODE');
    }
    
    if (!this.razorpayKeyId) {
      console.warn(`Razorpay ${this.isLiveMode ? 'LIVE' : 'TEST'} Key ID not found. Add VITE_RAZORPAY_${this.isLiveMode ? 'LIVE' : 'TEST'}_KEY_ID to .env.local`);
    }
  }

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Load Razorpay script dynamically
   */
  private async loadRazorpayScript(): Promise<boolean> {
    if (this.isScriptLoaded) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Create a payment order via Supabase Edge Function
   */
  private async createOrder(amount: number, currency: string, notes: any): Promise<string> {
    try {
      // Call Supabase Edge Function to create Razorpay order
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ amount: amount * 100, currency, notes })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      return data.orderId;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      // Fallback to mock order for development
      return `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  /**
   * Verify payment signature via Supabase Edge Function
   */
  private async verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Call Supabase Edge Function to verify payment
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ orderId, paymentId, signature })
      });

      if (!response.ok) {
        console.error('Payment verification request failed:', response.status);
        return false;
      }

      const data = await response.json();
      return data.verified === true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      // SECURITY: Always return false if verification fails
      // Webhooks will handle access granting in production
      return false;
    }
  }

  /**
   * Open Razorpay checkout for subscription
   */
  public async subscribeTomonth(
    amount: number,
    onSuccess: (response: RazorpayPaymentResponse) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    const loaded = await this.loadRazorpayScript();
    if (!loaded) {
      onFailure(new Error('Failed to load Razorpay'));
      return;
    }

    if (!this.razorpayKeyId) {
      onFailure(new Error('Razorpay key not configured. Please add RAZORPAY_KEY_ID to .env.local'));
      return;
    }

    try {
      // Create transaction record for initial tracking only
      const transactionId = `txn_${Date.now()}`;
      const transaction: PaymentTransaction = {
        id: transactionId,
        type: PaymentType.SUBSCRIPTION,
        amount,
        currency: 'INR',
        status: 'pending',
        timestamp: Date.now(),
        description: 'Premium Subscription - Monthly',
      };
      billingService.addTransaction(transaction);

      // Create order
      const orderId = await this.createOrder(amount * 100, 'INR', {
        type: 'subscription',
        plan: 'premium_monthly',
      });

      // Razorpay options
      const options: RazorpayPaymentOptions = {
        key: this.razorpayKeyId,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'Vismyras',
        description: 'Premium Subscription - ₹199/month',
        order_id: orderId,
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#a855f7', // Purple color
        },
        handler: async (response: RazorpayPaymentResponse) => {
          // Verify payment
          const verified = await this.verifyPaymentSignature(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          if (verified) {
            // Upgrade user to premium (this also logs transaction internally)
            billingService.upgradeToPremium(response.razorpay_payment_id);
            onSuccess(response);
          } else {
            // Update transaction to failed
            transaction.status = 'failed';
            transaction.description = 'Payment verification failed';
            billingService.addTransaction(transaction);
            onFailure(new Error('Payment verification failed'));
          }
        },
        modal: {
          ondismiss: () => {
            // Update transaction to cancelled
            transaction.status = 'failed';
            transaction.description = 'Payment cancelled by user';
            billingService.addTransaction(transaction);
            onFailure(new Error('Payment cancelled by user'));
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      onFailure(error);
    }
  }

  /**
   * Open Razorpay checkout for one-time purchase
   */
  public async buyCredits(
    tryOnsCount: number,
    amount: number,
    onSuccess: (response: RazorpayPaymentResponse) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    const loaded = await this.loadRazorpayScript();
    if (!loaded) {
      onFailure(new Error('Failed to load Razorpay'));
      return;
    }

    if (!this.razorpayKeyId) {
      onFailure(new Error('Razorpay key not configured. Please add RAZORPAY_KEY_ID to .env.local'));
      return;
    }

    try {
      // Create transaction record for initial tracking only
      const transactionId = `txn_${Date.now()}`;
      const transaction: PaymentTransaction = {
        id: transactionId,
        type: PaymentType.ONE_TIME,
        amount,
        currency: 'INR',
        status: 'pending',
        timestamp: Date.now(),
        description: `Buy ${tryOnsCount} Try-On Credits`,
      };
      billingService.addTransaction(transaction);

      // Create order
      const orderId = await this.createOrder(amount * 100, 'INR', {
        type: 'credits',
        tryOnsCount,
      });

      // Razorpay options
      const options: RazorpayPaymentOptions = {
        key: this.razorpayKeyId,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'Vismyras',
        description: `${tryOnsCount} Try-On Credits`,
        order_id: orderId,
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#a855f7',
        },
        handler: async (response: RazorpayPaymentResponse) => {
          // Verify payment
          const verified = await this.verifyPaymentSignature(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          if (verified) {
            // Add credits (this also logs transaction internally)
            billingService.addOneTimePurchase(tryOnsCount, amount, response.razorpay_payment_id);
            onSuccess(response);
          } else {
            // Update transaction to failed
            transaction.status = 'failed';
            transaction.description = 'Payment verification failed';
            billingService.addTransaction(transaction);
            onFailure(new Error('Payment verification failed'));
          }
        },
        modal: {
          ondismiss: () => {
            // Update transaction to cancelled
            transaction.status = 'failed';
            transaction.description = 'Payment cancelled by user';
            billingService.addTransaction(transaction);
            onFailure(new Error('Payment cancelled by user'));
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      onFailure(error);
    }
  }
}

// Export singleton instance
export const razorpayService = RazorpayService.getInstance();
