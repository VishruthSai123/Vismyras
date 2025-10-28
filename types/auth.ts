/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { User as SupabaseUser } from '@supabase/supabase-js';
import { UserBilling } from './billing';

/**
 * Extended user profile with billing information
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  auth_provider: 'email' | 'google';
}

/**
 * Complete user data including auth and billing
 */
export interface VismyrasUser {
  auth: SupabaseUser;
  profile: UserProfile;
  billing: UserBilling;
}

/**
 * Auth state
 */
export interface AuthState {
  user: VismyrasUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Auth error types
 */
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}
