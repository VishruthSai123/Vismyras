/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Gender = 'Men' | 'Women';

export type Category = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Accessories' | 'Indian Festive';

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  gender: Gender;
  category: Category;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}

export interface SavedOutfit {
  id: string;
  layers: OutfitLayer[];
  previewUrl: string;
}
