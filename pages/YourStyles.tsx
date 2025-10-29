import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Trash2, Search, Star } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import type { UserOutfit, OutfitHistoryFilters } from '../types/outfitHistory';
import type { VismyrasUser } from '../types/auth';
import Header from '../components/Header';

interface YourStylesProps {
  user: VismyrasUser;
  onBack: () => void;
  onRestoreOutfit: (outfit: UserOutfit) => void;
  onLogout?: () => void;
  onViewBilling?: () => void;
  onViewUsage?: () => void;
  onViewStyles?: () => void;
}

export default function YourStyles({ 
  user, 
  onBack, 
  onRestoreOutfit,
  onLogout,
  onViewBilling,
  onViewUsage,
  onViewStyles
}: YourStylesProps) {
  const [outfits, setOutfits] = useState<UserOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [total, setTotal] = useState(0);

  // Load outfits
  const loadOutfits = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: OutfitHistoryFilters = {
        limit: 50,
        sort_by: 'created_at',
        sort_order: 'desc',
        favorites_only: showFavoritesOnly,
      };

      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const result = await supabaseService.getOutfitHistory(user.auth.id, filters);
      setOutfits(result.outfits);
      setTotal(result.total);
    } catch (err) {
      setError('Failed to load your styles. Please try again.');
      console.error('Error loading outfits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount and when filters change
  useEffect(() => {
    loadOutfits();
  }, [showFavoritesOnly, searchTerm]);

  // Toggle favorite
  const handleToggleFavorite = async (outfitId: string) => {
    try {
      await supabaseService.toggleFavorite(user.auth.id, outfitId);
      // Update local state
      setOutfits(prev =>
        prev.map(o =>
          o.id === outfitId ? { ...o, is_favorite: !o.is_favorite } : o
        )
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Delete outfit
  const handleDelete = async (outfitId: string) => {
    if (!confirm('Delete this outfit? This cannot be undone.')) return;

    try {
      await supabaseService.deleteOutfit(user.auth.id, outfitId);
      setOutfits(prev => prev.filter(o => o.id !== outfitId));
      setTotal(prev => prev - 1);
    } catch (err) {
      setError('Failed to delete outfit. Please try again.');
      console.error('Error deleting outfit:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      {/* Main Header */}
      <Header 
        user={user}
        onLogout={onLogout}
        onViewBilling={onViewBilling}
        onViewUsage={onViewUsage}
        onViewStyles={onViewStyles}
      />
      
      {/* Sub-header with back button */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-grow">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Your Styles</h1>
              <p className="text-sm text-gray-600">{total} saved outfit{total !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search outfits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                showFavoritesOnly
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Heart size={20} className={showFavoritesOnly ? 'fill-current' : ''} />
              <span className="text-sm">Favorites</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <p className="text-red-800 text-sm">{error}</p>
          </motion.div>
        )}

        {!isLoading && outfits.length === 0 && (
          <div className="text-center py-20">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || showFavoritesOnly
                ? 'No outfits found'
                : 'No saved outfits yet'}
            </h2>
            <p className="text-gray-500 text-sm">
              {searchTerm || showFavoritesOnly
                ? 'Try adjusting your filters'
                : 'Create and save your first outfit to see it here'}
            </p>
          </div>
        )}

        {!isLoading && outfits.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {outfits.map((outfit) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] bg-gray-100">
                  {outfit.final_image_url ? (
                    <img
                      src={outfit.final_image_url}
                      alt={outfit.outfit_name}
                      className="w-full h-full object-cover"
                    />
                  ) : outfit.model_image_url ? (
                    <img
                      src={outfit.model_image_url}
                      alt={outfit.outfit_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* Favorite Badge */}
                  {outfit.is_favorite && (
                    <div className="absolute top-3 right-3 bg-pink-500 text-white p-2 rounded-full">
                      <Heart size={16} className="fill-current" />
                    </div>
                  )}

                  {/* Layers Count */}
                  {outfit.garment_layers && outfit.garment_layers.length > 0 && (
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {outfit.garment_layers.length} layer{outfit.garment_layers.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {outfit.outfit_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {new Date(outfit.created_at).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRestoreOutfit(outfit)}
                      className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors font-medium text-sm"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(outfit.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        outfit.is_favorite
                          ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      aria-label="Toggle favorite"
                    >
                      <Heart size={20} className={outfit.is_favorite ? 'fill-current' : ''} />
                    </button>
                    <button
                      onClick={() => handleDelete(outfit.id)}
                      className="p-2 bg-gray-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      aria-label="Delete outfit"
                    >
                      <Trash2 size={20} />
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
}
