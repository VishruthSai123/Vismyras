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
  private isScriptLoaded: boolean = false;

  private constructor() {
    // Get key from environment variable
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
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
   * Create a payment order (this would typically call your backend)
   */
  private async createOrder(amount: number, currency: string, notes: any): Promise<string> {
    // TODO: In production, this should call your backend API
    // Backend will create order using Razorpay Orders API
    // For now, we'll generate a mock order ID
    
    // Example backend call:
    // const response = await fetch('/api/create-order', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ amount, currency, notes })
    // });
    // const data = await response.json();
    // return data.orderId;
    
    return `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Verify payment signature (this should be done on backend)
   */
  private async verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    // TODO: In production, verify on backend using:
    // crypto.createHmac('sha256', keySecret)
    //   .update(orderId + "|" + paymentId)
    //   .digest('hex') === signature
    
    // Example backend call:
    // const response = await fetch('/api/verify-payment', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ orderId, paymentId, signature })
    // });
    // const data = await response.json();
    // return data.verified;
    
    console.log('Payment verification (backend required):', { orderId, paymentId, signature });
    return true; // Mock verification for development
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
      // Create transaction record
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
            // Update transaction
            transaction.status = 'success';
            transaction.razorpayPaymentId = response.razorpay_payment_id;
            transaction.razorpayOrderId = response.razorpay_order_id;
            billingService.addTransaction(transaction);

            // Upgrade user to premium
            billingService.upgradeToPremium(response.razorpay_payment_id);

            onSuccess(response);
          } else {
            transaction.status = 'failed';
            billingService.addTransaction(transaction);
            onFailure(new Error('Payment verification failed'));
          }
        },
        modal: {
          ondismiss: () => {
            transaction.status = 'failed';
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
      // Create transaction record
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
            // Update transaction
            transaction.status = 'success';
            transaction.razorpayPaymentId = response.razorpay_payment_id;
            transaction.razorpayOrderId = response.razorpay_order_id;
            billingService.addTransaction(transaction);

            // Add credits
            billingService.addOneTimePurchase(tryOnsCount, amount, response.razorpay_payment_id);

            onSuccess(response);
          } else {
            transaction.status = 'failed';
            billingService.addTransaction(transaction);
            onFailure(new Error('Payment verification failed'));
          }
        },
        modal: {
          ondismiss: () => {
            transaction.status = 'failed';
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
