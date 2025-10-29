/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Gender = 'Men' | 'Women';

export type Category = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Accessories' | 'Indian Festive' | 'Custom';

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  gender: Gender;
  category: Category;
  aiPrompt?: string; // Optional AI instructions for custom items
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}

export interface SavedOutfit {
  id: string;
  name?: string;
  modelImageUrl: string; // Base64 or URL of the model image
  modelImageId?: string; // For reference
  layers: OutfitLayer[]; // Complete outfit stack (all layers)
  previewUrl: string; // Final result image (thumbnail)
  poseVariation?: string;
  createdAt?: string;
}
