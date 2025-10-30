/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Supabase Service - Complete Rewrite
 * Simple, reliable auth with proper session handling
 */

import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { SignUpCredentials, LoginCredentials, UserProfile, VismyrasUser, AuthError } from '../types/auth';
import { 
  UserOutfit, 
  SaveOutfitParams, 
  OutfitHistoryFilters 
} from '../types/outfitHistory';
import { billingService } from './billingService';

class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Initialize Supabase client - called once on app start
   */
  public initialize(): void {
    if (this.initialized) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'vismyras-auth-token',
        flowType: 'pkce',
      },
    });

    this.initialized = true;
  }

  /**
   * Get Supabase client
   */
  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new AuthError('Supabase not initialized');
    }
    return this.client;
  }

  /**
   * Build VismyrasUser from Supabase User
   */
  private buildUserFromSession(user: User): VismyrasUser {
    const profile: UserProfile = {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      auth_provider: (user.app_metadata?.provider || 'email') as 'email' | 'google',
      created_at: user.created_at,
      updated_at: user.created_at,
    };

    return {
      auth: user,
      profile,
      billing: billingService.getUserBilling(),
    };
  }

  /**
   * Subscribe to auth state changes - THE ONLY SOURCE OF TRUTH
   */
  public onAuthStateChange(callback: (user: VismyrasUser | null) => void): () => void {
    const client = this.getClient();
    
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Handle session changes
        if (session?.user) {
          callback(this.buildUserFromSession(session.user));
        } else {
          callback(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  /**
   * Sign up with email/password
   */
  public async signUp(credentials: SignUpCredentials): Promise<VismyrasUser | null> {
    const client = this.getClient();

    try {
      const { data, error } = await client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: {
            full_name: credentials.fullName || '',
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw new AuthError(this.getFriendlyErrorMessage(error.message), error.message);
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required - user needs to check email
        return null; // Return null to indicate confirmation needed
      }

      if (!data.user || !data.session) {
        throw new AuthError('Failed to create account');
      }

      // User is authenticated immediately (email confirmation disabled)
      return this.buildUserFromSession(data.user);
    } catch (err: any) {
      console.error('Signup failed:', err);
      throw err;
    }
  }

  /**
   * Login with email/password
   */
  public async login(credentials: LoginCredentials): Promise<VismyrasUser> {
    const client = this.getClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new AuthError(this.getFriendlyErrorMessage(error.message), error.message);
    }

    if (!data.user) {
      throw new AuthError('Login failed');
    }

    return this.buildUserFromSession(data.user);
  }

  /**
   * Login with Google OAuth
   */
  public async loginWithGoogle(): Promise<void> {
    const client = this.getClient();

    // Get the current origin for redirect
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google OAuth error:', error);
      throw new AuthError('Google login failed: ' + error.message);
    }
  }

  /**
   * Sign in with Google OAuth (alias for loginWithGoogle)
   */
  public async signInWithGoogle(): Promise<void> {
    return this.loginWithGoogle();
  }

  /**
   * Logout
   */
  public async logout(): Promise<void> {
    const client = this.getClient();
    await client.auth.signOut();
    billingService.resetBilling();
  }

  /**
   * Get friendly error message
   */
  private getFriendlyErrorMessage(message: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Incorrect email or password',
      'Email not confirmed': 'Please verify your email address',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 6 characters',
    };

    for (const [key, value] of Object.entries(errorMap)) {
      if (message.includes(key)) {
        return value;
      }
    }

    return 'Authentication failed. Please try again.';
  }

  /**
   * Reset password
   */
  public async resetPassword(email: string): Promise<void> {
    const client = this.getClient();

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new AuthError('Failed to send reset email');
    }
  }

  /**
   * Update password
   */
  public async updatePassword(newPassword: string): Promise<void> {
    const client = this.getClient();

    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new AuthError('Failed to update password');
    }
  }

  // ==================== OUTFIT HISTORY ====================

  /**
   * Save outfit
   */
  public async saveOutfit(params: SaveOutfitParams): Promise<void> {
    const client = this.getClient();

    // Use upsert to update existing workspace or create new one
    // This ensures one workspace = one style, preventing duplicates
    const { error } = await client
      .from('user_outfit_history')
      .upsert({
        user_id: params.user_id,
        workspace_id: params.workspace_id,
        outfit_name: params.outfit_name || `Style ${new Date().toLocaleDateString()}`,
        model_image_url: params.model_image_url,
        model_image_id: params.model_image_id,
        garment_layers: params.garment_layers,
        final_image_url: params.final_image_url,
        final_image_id: params.final_image_id,
        pose_variation: params.pose_variation,
        tags: params.tags || [],
      }, {
        onConflict: 'user_id,workspace_id', // Update if workspace already exists
      });

    if (error) throw new Error('Failed to save outfit');
  }

  /**
   * Get outfit history
   */
  public async getOutfitHistory(
    userId: string,
    filters?: OutfitHistoryFilters
  ): Promise<{ outfits: UserOutfit[]; total: number }> {
    const client = this.getClient();

    let query = client
      .from('user_outfit_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (filters?.favorites_only) {
      query = query.eq('is_favorite', true);
    }

    if (filters?.search) {
      query = query.ilike('outfit_name', `%${filters.search}%`);
    }

    query = query.order(filters?.sort_by || 'created_at', { 
      ascending: filters?.sort_order === 'asc' 
    });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error, count } = await query;

    if (error) throw new Error('Failed to load outfits');

    return {
      outfits: data || [],
      total: count || 0,
    };
  }

  /**
   * Delete outfit
   */
  public async deleteOutfit(userId: string, outfitId: string): Promise<void> {
    const client = this.getClient();

    const { error } = await client
      .from('user_outfit_history')
      .delete()
      .eq('id', outfitId)
      .eq('user_id', userId);

    if (error) throw new Error('Failed to delete outfit');
  }

  /**
   * Toggle favorite
   */
  public async toggleFavorite(userId: string, outfitId: string): Promise<void> {
    const client = this.getClient();

    const { data: outfit } = await client
      .from('user_outfit_history')
      .select('is_favorite')
      .eq('id', outfitId)
      .eq('user_id', userId)
      .single();

    if (!outfit) throw new Error('Outfit not found');

    const { error } = await client
      .from('user_outfit_history')
      .update({ is_favorite: !outfit.is_favorite })
      .eq('id', outfitId)
      .eq('user_id', userId);

    if (error) throw new Error('Failed to toggle favorite');
  }

  // ==================== STORAGE METHODS ====================

  /**
   * Upload image to storage bucket
   */
  public async uploadImage(
    bucket: 'model-images' | 'garment-images' | 'final-outputs',
    userId: string,
    file: Blob,
    filename: string
  ): Promise<{ url: string; path: string }> {
    const client = this.getClient();

    const path = `${userId}/${Date.now()}-${filename}`;

    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: path,
    };
  }

  /**
   * Delete image from storage
   */
  public async deleteImage(
    bucket: 'model-images' | 'garment-images' | 'final-outputs',
    path: string
  ): Promise<void> {
    const client = this.getClient();

    const { error } = await client.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Get signed URL for private image
   */
  public async getSignedUrl(
    bucket: 'model-images' | 'garment-images' | 'final-outputs',
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const client = this.getClient();

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Get current session access token
   */
  public async getAccessToken(): Promise<string | null> {
    const client = this.getClient();
    const { data: { session } } = await client.auth.getSession();
    return session?.access_token || null;
  }

  // ==================== BILLING METHODS ====================

  /**
   * Get user billing data from database
   * Schema: monthly_limit, monthly_used, period_start, period_end (matches webhook)
   */
  public async getUserBilling(userId: string): Promise<any | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('user_billing')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No billing record found - will be created by trigger on_user_created
        return null;
      }
      throw new Error(`Failed to load billing data: ${error.message}`);
    }

    return await this.dbBillingToUserBilling(data, userId);
  }

  /**
   * Save user billing data to database
   * Schema: monthly_limit, monthly_used, period_start, period_end (matches webhook)
   */
  public async saveUserBilling(userId: string, billingData: any): Promise<void> {
    const client = this.getClient();

    // Convert millisecond timestamps to ISO format for PostgreSQL TIMESTAMPTZ
    const periodStart = billingData.usage.lastUpdated 
      ? new Date(billingData.usage.lastUpdated).toISOString()
      : new Date().toISOString();
    
    // Calculate period end (30 days from start)
    const periodEnd = new Date(new Date(periodStart).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await client
      .from('user_billing')
      .upsert({
        user_id: userId,
        subscription_tier: billingData.subscription.tier,
        subscription_status: billingData.subscription.status.toLowerCase(), // active/cancelled/expired/paused
        monthly_limit: billingData.usage.tryOnsLimit,
        monthly_used: billingData.usage.tryOnsUsed,
        period_start: periodStart,
        period_end: periodEnd,
        razorpay_subscription_id: billingData.subscription.razorpaySubscriptionId || null,
        subscription_auto_renew: billingData.subscription.autoRenew,
      }, {
        onConflict: 'user_id', // Specify conflict column for upsert
        ignoreDuplicates: false, // Update on conflict, don't ignore
      });

    if (error) {
      throw new Error(`Failed to save billing data: ${error.message}`);
    }
  }

  /**
   * Increment usage count (atomic, race-condition safe)
   * Automatically uses one-time credits if monthly limit reached
   */
  public async incrementUsage(userId: string): Promise<boolean> {
    const client = this.getClient();

    const { data, error } = await client.rpc('increment_usage', {
      p_user_id: userId
    });

    if (error) {
      throw new Error(`Failed to increment usage: ${error.message}`);
    }

    return data as boolean; // Returns true if incremented, false if limit reached
  }

  /**
   * Get one-time purchases for a user
   */
  public async getOneTimePurchases(userId: string): Promise<any[]> {
    const client = this.getClient();

    const { data, error } = await client
      .from('user_one_time_purchases')
      .select('*')
      .eq('user_id', userId)
      .gt('expiry_date', new Date().toISOString())
      .gt('credits_remaining', 0)
      .order('expiry_date', { ascending: true });

    if (error) {
      // Table doesn't exist yet - migration not run
      console.warn('One-time purchases table not found - run migration 007');
      return [];
    }

    return data || [];
  }

  /**
   * Get available one-time credits count
   */
  public async getAvailableOneTimeCredits(userId: string): Promise<number> {
    const client = this.getClient();

    const { data, error } = await client.rpc('get_available_one_time_credits', {
      p_user_id: userId
    });

    if (error) {
      throw new Error(`Failed to get one-time credits: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Add one-time purchase to database
   * Used when user manually buys credits (calls database function)
   */
  public async addOneTimePurchaseToDatabase(
    userId: string,
    creditsCount: number,
    price: number,
    paymentId: string
  ): Promise<string> {
    const client = this.getClient();

    const { data, error } = await client.rpc('add_one_time_credits', {
      p_user_id: userId,
      p_credits: creditsCount,
      p_payment_id: paymentId,
      p_price: price
    });

    if (error) {
      throw new Error(`Failed to add one-time purchase: ${error.message}`);
    }

    return data as string; // Returns purchase ID
  }

  /**
   * Convert database billing record to UserBilling format
   * Database schema: monthly_limit, monthly_used, period_start, period_end
   * App format: usage { month, tryOnsUsed, tryOnsLimit, lastUpdated, history }
   */
  public async dbBillingToUserBilling(dbBilling: any, userId: string): Promise<any> {
    // Convert ISO timestamps to milliseconds
    const periodStartMs = dbBilling.period_start 
      ? new Date(dbBilling.period_start).getTime()
      : Date.now();
    const periodEndMs = dbBilling.period_end
      ? new Date(dbBilling.period_end).getTime()
      : Date.now() + 30 * 24 * 60 * 60 * 1000;

    // Calculate current month from period_start
    const periodStart = new Date(dbBilling.period_start || Date.now());
    const month = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;

    // Fetch one-time purchases from database
    const dbPurchases = await this.getOneTimePurchases(userId);
    const oneTimePurchases = dbPurchases.map((p: any) => ({
      id: p.id,
      tryOnsCount: p.credits_remaining, // Remaining credits
      price: parseFloat(p.price),
      purchaseDate: new Date(p.purchase_date).getTime(),
      expiryDate: new Date(p.expiry_date).getTime(),
      razorpayPaymentId: p.razorpay_payment_id,
    }));

    return {
      subscription: {
        tier: dbBilling.subscription_tier,
        status: dbBilling.subscription_status.toUpperCase(), // ACTIVE/CANCELLED/EXPIRED/PAUSED
        startDate: periodStartMs,
        endDate: periodEndMs,
        autoRenew: dbBilling.subscription_auto_renew || false,
        razorpaySubscriptionId: dbBilling.razorpay_subscription_id,
      },
      usage: {
        month: month,
        tryOnsUsed: dbBilling.monthly_used,
        tryOnsLimit: dbBilling.monthly_limit,
        lastUpdated: periodStartMs,
        history: [], // History not stored in this schema
      },
      oneTimePurchases: oneTimePurchases, // From database
      transactions: [], // Not stored in this schema
    };
  }
}

export const supabaseService = SupabaseService.getInstance();
