/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Outfit History Types - Complete Rewrite
 */

import { OutfitLayer } from '../types';

export interface UserOutfit {
  id: string;
  user_id: string;
  workspace_id: string; // Unique ID for this styling session/workspace
  outfit_name: string | null;
  description: string | null;
  tags: string[];
  
  model_image_url: string;
  model_image_id: string | null;
  model_image_path: string | null;
  
  garment_layers: OutfitLayer[];
  
  final_image_url: string | null;
  final_image_id: string | null;
  final_image_path: string | null;
  
  pose_variation: string | null;
  generation_settings: Record<string, any> | null;
  
  is_favorite: boolean;
  is_public: boolean;
  view_count: number;
  
  created_at: string;
  updated_at: string;
}

export interface SaveOutfitParams {
  user_id: string;
  workspace_id: string; // Unique ID for this styling session
  outfit_name?: string;
  model_image_url: string;
  model_image_id?: string;
  garment_layers: OutfitLayer[];
  final_image_url?: string;
  final_image_id?: string;
  pose_variation?: string;
  tags?: string[];
}

export interface OutfitHistoryFilters {
  limit?: number;
  offset?: number;
  favorites_only?: boolean;
  search?: string;
  sort_by?: 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}
