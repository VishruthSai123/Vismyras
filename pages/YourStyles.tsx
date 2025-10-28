/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, Trash2, Eye, Calendar, Sparkles, 
  Search, Filter, SortAsc, SortDesc, RefreshCw 
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { UserOutfit, OutfitHistoryFilters } from '../types/outfitHistory';

interface YourStylesProps {
  onBack: () => void;
  onRestoreOutfit: (outfit: UserOutfit) => void;
  userId: string;
}

const YourStyles: React.FC<YourStylesProps> = ({ onBack, onRestoreOutfit, userId }) => {
  const [outfits, setOutfits] = useState<UserOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [total, setTotal] = useState(0);

  const loadOutfits = async () => {
    setLoading(true);
    try {
      const filters: OutfitHistoryFilters = {
        limit: 50,
        favorites_only: showFavoritesOnly,
        search: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const result = await supabaseService.getOutfitHistory(userId, filters);
      setOutfits(result.outfits);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading outfits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutfits();
  }, [userId, showFavoritesOnly, sortBy, sortOrder]);

  const handleSearch = () => {
    loadOutfits();
  };

  const handleToggleFavorite = async (outfitId: string) => {
    try {
      await supabaseService.toggleFavorite(userId, outfitId);
      loadOutfits();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDelete = async (outfitId: string) => {
    if (!confirm('Are you sure you want to delete this outfit? This action cannot be undone.')) {
      return;
    }

    try {
      await supabaseService.deleteOutfit(userId, outfitId);
      loadOutfits();
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Styles</h1>
                <p className="text-sm text-gray-600">{total} outfit{total !== 1 ? 's' : ''} created</p>
              </div>
            </div>

            <button
              onClick={loadOutfits}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search outfits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showFavoritesOnly
                  ? 'bg-pink-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart size={18} fill={showFavoritesOnly ? 'white' : 'none'} />
              Favorites
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {searchQuery || showFavoritesOnly ? 'No outfits found' : 'No styles yet'}
            </h2>
            <p className="text-gray-600">
              {searchQuery || showFavoritesOnly
                ? 'Try adjusting your filters'
                : 'Start creating virtual try-ons to build your style collection'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {outfits.map((outfit) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] bg-gray-100">
                  {outfit.final_image_url ? (
                    <img
                      src={outfit.final_image_url}
                      alt={outfit.outfit_name || 'Outfit'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles size={48} className="text-gray-300" />
                    </div>
                  )}

                  {/* Favorite overlay */}
                  <button
                    onClick={() => handleToggleFavorite(outfit.id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                  >
                    <Heart
                      size={20}
                      fill={outfit.is_favorite ? '#ec4899' : 'none'}
                      className={outfit.is_favorite ? 'text-pink-500' : 'text-gray-600'}
                    />
                  </button>

                  {/* Layer count */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full">
                    {outfit.garment_layers.length} layer{outfit.garment_layers.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {outfit.outfit_name || 'Untitled Outfit'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Calendar size={14} />
                    {formatDate(outfit.created_at)}
                  </div>

                  {outfit.tags && outfit.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {outfit.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRestoreOutfit(outfit)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(outfit.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourStyles;
