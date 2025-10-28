/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { OutfitLayer, SavedOutfit, WardrobeItem } from '../types';

/**
 * User outfit history entry
 */
export interface UserOutfit {
  id: string;
  user_id: string;
  outfit_name: string | null;
  description: string | null;
  tags: string[];
  model_image_url: string;
  model_image_id: string | null;
  garment_layers: OutfitLayer[];
  final_image_url: string | null;
  final_image_id: string | null;
  pose_variation: string | null;
  generation_settings: Record<string, any> | null;
  is_favorite: boolean;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Custom wardrobe item
 */
export interface CustomWardrobeItem {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  description: string | null;
  color: string | null;
  brand: string | null;
  price: number | null;
  image_url: string;
  image_id: string | null;
  thumbnail_url: string | null;
  usage_count: number;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Outfit collection
 */
export interface OutfitCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Parameters for saving a new outfit
 */
export interface SaveOutfitParams {
  user_id: string;
  outfit_name?: string;
  description?: string;
  tags?: string[];
  model_image_url: string;
  model_image_id?: string;
  garment_layers: OutfitLayer[];
  final_image_url?: string;
  final_image_id?: string;
  pose_variation?: string;
  generation_settings?: Record<string, any>;
  is_favorite?: boolean;
}

/**
 * Parameters for updating an outfit
 */
export interface UpdateOutfitParams {
  outfit_name?: string;
  description?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_public?: boolean;
}

/**
 * Outfit history filters
 */
export interface OutfitHistoryFilters {
  limit?: number;
  offset?: number;
  favorites_only?: boolean;
  tags?: string[];
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'view_count';
  sort_order?: 'asc' | 'desc';
}
