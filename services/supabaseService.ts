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
      console.error('Supabase signup error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new AuthError(this.getFriendlyErrorMessage(error.message), error.message);
    }

    if (!data.user) {
      throw new AuthError('Failed to create account');
    }

    return this.buildUserFromSession(data.user);
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

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      throw new AuthError('Google login failed');
    }
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

    const { error } = await client
      .from('user_outfit_history')
      .insert({
        user_id: params.user_id,
        outfit_name: params.outfit_name || `Outfit ${new Date().toLocaleDateString()}`,
        model_image_url: params.model_image_url,
        model_image_id: params.model_image_id,
        garment_layers: params.garment_layers,
        final_image_url: params.final_image_url,
        final_image_id: params.final_image_id,
        pose_variation: params.pose_variation,
        tags: params.tags || [],
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
}

export const supabaseService = SupabaseService.getInstance();
