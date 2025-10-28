/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { SignUpCredentials, LoginCredentials, UserProfile, VismyrasUser, AuthError } from '../types/auth';
import { billingService } from './billingService';

/**
 * Supabase service for authentication and user management
 */
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
   * Initialize Supabase client
   */
  public initialize(): void {
    if (this.initialized) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Supabase credentials not configured. Authentication will not work.');
      console.warn('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file');
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
    console.log('✅ Supabase client initialized');
  }

  /**
   * Get Supabase client instance
   */
  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new AuthError('Supabase client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Sign up with email and password
   */
  public async signUp(credentials: SignUpCredentials): Promise<VismyrasUser> {
    const client = this.getClient();

    const { data, error } = await client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName || '',
        },
      },
    });

    if (error) {
      throw new AuthError(this.getFriendlyErrorMessage(error.message), error.message);
    }

    if (!data.user) {
      throw new AuthError('Failed to create user account');
    }

    // Create user profile
    const profile = await this.createUserProfile(data.user, 'email');

    // Initialize billing for new user
    const billing = billingService.getUserBilling();

    return {
      auth: data.user,
      profile,
      billing,
    };
  }

  /**
   * Login with email and password
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
      throw new AuthError('Login failed. Please try again.');
    }

    // Get user profile and billing
    const profile = await this.getUserProfile(data.user.id);
    const billing = await this.loadUserBilling(data.user.id);

    return {
      auth: data.user,
      profile,
      billing,
    };
  }

  /**
   * Sign in with Google OAuth
   */
  public async signInWithGoogle(): Promise<void> {
    const client = this.getClient();

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new AuthError(this.getFriendlyErrorMessage(error.message), error.message);
    }

    // OAuth redirect happens automatically
    // Session will be picked up by onAuthStateChange listener
  }

  /**
   * Logout current user
   */
  public async logout(): Promise<void> {
    const client = this.getClient();

    const { error } = await client.auth.signOut();

    if (error) {
      throw new AuthError('Failed to logout. Please try again.');
    }

    // Clear local billing data
    billingService.resetBilling();
  }

  /**
   * Get current session
   */
  public async getSession(): Promise<Session | null> {
    const client = this.getClient();

    try {
      const { data, error } = await client.auth.getSession();

      if (error) {
        console.error('❌ Error getting session:', error);
        
        // Try to refresh session
        const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Failed to refresh session:', refreshError);
          return null;
        }
        
        console.log('✅ Session refreshed successfully');
        return refreshData.session;
      }

      return data.session;
    } catch (err) {
      console.error('❌ Session error:', err);
      return null;
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(): Promise<VismyrasUser | null> {
    const client = this.getClient();

    try {
      // First check session
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return null;
      }

      if (!session?.user) {
        return null;
      }

      // Get fresh user data
      const { data: { user }, error: userError } = await client.auth.getUser();

      if (userError || !user) {
        console.error('User error:', userError);
        return null;
      }

      const profile = await this.getUserProfile(user.id);
      const billing = await this.loadUserBilling(user.id);

      return {
        auth: user,
        profile,
        billing,
      };
    } catch (err) {
      console.error('Error loading user data:', err);
      return null;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  public onAuthStateChange(callback: (user: VismyrasUser | null) => void): () => void {
    const client = this.getClient();

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event, 'Session:', session ? 'exists' : 'null');

      // Ignore initial session load if we already have user
      if (event === 'INITIAL_SESSION' && !session) {
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
        try {
          let profile: UserProfile;

          // Check if profile exists
          const existingProfile = await this.getUserProfile(session.user.id).catch(() => null);

          if (existingProfile) {
            profile = existingProfile;
          } else {
            // Create profile for OAuth users
            const provider = session.user.app_metadata.provider || 'email';
            profile = await this.createUserProfile(session.user, provider as 'email' | 'google');
          }

          const billing = await this.loadUserBilling(session.user.id);

          callback({
            auth: session.user,
            profile,
            billing,
          });
        } catch (err) {
          console.error('Error handling auth state change:', err);
          // Don't call callback with null - keep existing session
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        billingService.resetBilling();
        callback(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        // User data updated, refresh
        try {
          const profile = await this.getUserProfile(session.user.id);
          const billing = await this.loadUserBilling(session.user.id);
          
          callback({
            auth: session.user,
            profile,
            billing,
          });
        } catch (err) {
          console.error('Error updating user data:', err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Send password reset email
   */
  public async resetPassword(email: string): Promise<void> {
    const client = this.getClient();

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new AuthError(this.getFriendlyErrorMessage(error.message));
    }
  }

  /**
   * Update user password
   */
  public async updatePassword(newPassword: string): Promise<void> {
    const client = this.getClient();

    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new AuthError('Failed to update password. Please try again.');
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const client = this.getClient();

    const { data, error } = await client
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AuthError('Failed to update profile');
    }

    return data;
  }

  /**
   * Create user profile in database
   */
  private async createUserProfile(user: User, provider: 'email' | 'google'): Promise<UserProfile> {
    const client = this.getClient();

    const profile: Omit<UserProfile, 'created_at' | 'updated_at'> = {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      auth_provider: provider,
    };

    const { data, error } = await client
      .from('user_profiles')
      .upsert({
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      // Return profile anyway - database table might not exist yet
      return {
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data;
  }

  /**
   * Get user profile from database
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    const client = this.getClient();

    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AuthError('Failed to load user profile');
    }

    return data;
  }

  /**
   * Load user billing data from Supabase
   */
  private async loadUserBilling(userId: string): Promise<any> {
    const client = this.getClient();

    const { data, error } = await client
      .from('user_billing')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // No billing data yet, return default
      return billingService.getUserBilling();
    }

    // Sync with billing service
    billingService.loadFromSupabase(data.billing_data);
    return billingService.getUserBilling();
  }

  /**
   * Save billing data to Supabase
   */
  public async saveBillingData(userId: string, billingData: any): Promise<void> {
    const client = this.getClient();

    const { error } = await client
      .from('user_billing')
      .upsert({
        user_id: userId,
        billing_data: billingData,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving billing data:', error);
      // Don't throw - allow app to continue with localStorage
    }
  }

  /**
   * Get friendly error messages
   */
  private getFriendlyErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password. Please try again.',
      'Email not confirmed': 'Please check your email and confirm your account before logging in.',
      'User already registered': 'An account with this email already exists. Please login instead.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'Unable to validate email address': 'Please enter a valid email address.',
      'Email rate limit exceeded': 'Too many requests. Please wait a few minutes and try again.',
    };

    for (const [key, message] of Object.entries(errorMap)) {
      if (error.includes(key)) {
        return message;
      }
    }

    return 'An error occurred. Please try again.';
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }
}

export const supabaseService = SupabaseService.getInstance();
