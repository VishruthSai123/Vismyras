/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import type { WardrobeItem, Gender, Category } from '../types';
import { CheckCircleIcon, UploadCloudIcon, XIcon } from './icons';
import { AnimatePresence, motion } from 'framer-motion';
import { urlToFile, db, useObjectURL } from '../lib/utils';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

interface CategorySelectionModalProps {
  file: File;
  onConfirm: (gender: Gender, category: Category, aiPrompt?: string) => void;
  onCancel: () => void;
  genders: Gender[];
  categories: Category[];
}

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({ 
  file, 
  onConfirm, 
  onCancel, 
  genders, 
  categories 
}) => {
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  
  // Always include "Custom" option for uploaded items
  const allCategories: Category[] = useMemo(() => {
    const cats = [...categories];
    if (!cats.includes('Custom')) {
      cats.push('Custom');
    }
    return cats;
  }, [categories]);
  
  const handleCategorySelect = (category: Category) => {
    if (category === 'Custom') {
      setSelectedCategory(category);
    } else {
      onConfirm(selectedGender!, category);
    }
  };
  
  const handleCustomConfirm = () => {
    if (selectedCategory === 'Custom') {
      onConfirm(selectedGender!, selectedCategory, aiPrompt.trim() || undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-serif tracking-wider text-gray-800">
            {selectedCategory === 'Custom' ? 'AI Prompt (Optional)' : selectedGender ? 'Select Category' : 'Select Gender'}
          </h2>
          <button onClick={onCancel} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 active:scale-95 transition-transform">
            <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <div className="flex-shrink-0">
              <img src={imageUrl} alt="Uploaded garment preview" className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-lg border bg-gray-100" />
              <p className="text-xs text-gray-600 mt-1 text-center truncate max-w-[6rem] sm:max-w-[8rem]" title={file.name}>{file.name}</p>
            </div>
            <div className="flex-grow w-full">
              {!selectedGender ? (
                <>
                  <p className="text-sm sm:text-base text-gray-700 mb-3 font-medium text-center sm:text-left">Who is this garment for?</p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {genders.map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setSelectedGender(gender)}
                        className="w-full text-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg transition-all bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 active:scale-[0.98]"
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </>
              ) : selectedCategory === 'Custom' ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm sm:text-base text-gray-700 font-medium">
                      Category: <span className="text-gray-900">Custom</span>
                    </p>
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline active:scale-95 transition-transform"
                    >
                      Back
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 mb-2 font-medium">Tell AI what to do with this image:</p>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g., 'Remove background', 'Make it look more vibrant', 'Add a subtle pattern'..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1 mb-3">Optional: Leave blank to use as-is</p>
                  <button
                    onClick={handleCustomConfirm}
                    className="w-full px-4 py-2.5 text-sm sm:text-base font-semibold rounded-lg transition-all bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]"
                  >
                    {aiPrompt.trim() ? '✨ Apply with AI' : 'Continue'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm sm:text-base text-gray-700 font-medium">
                      Gender: <span className="text-gray-900">{selectedGender}</span>
                    </p>
                    <button 
                      onClick={() => setSelectedGender(null)}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline active:scale-95 transition-transform"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 mb-3 font-medium text-center sm:text-left">What type of garment is this?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {allCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        className="w-full text-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 active:scale-[0.98]"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface DBImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
}

const DBImage: React.FC<DBImageProps> = ({ src, ...props }) => {
    const isDbId = !/^(https?|data):/.test(src);
    const objectUrl = useObjectURL(isDbId ? src : null);
    const finalSrc = isDbId ? objectUrl : src;

    if (!finalSrc) {
        return <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />;
    }

    return <img src={finalSrc} {...props} />;
};


const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    
    // Extract unique genders and categories
    const genders: Gender[] = useMemo(() => {
        const uniqueGenders = [...new Set(wardrobe.map(item => item.gender))];
        return ['Men', 'Women'].filter(g => uniqueGenders.includes(g as Gender)) as Gender[];
    }, [wardrobe]);
    
    const categories: Category[] = useMemo(() => {
        const allCategories = [...new Set(wardrobe.map(item => item.category))];
        const orderPriority: Category[] = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Indian Festive', 'Custom'];
        return orderPriority.filter(c => allCategories.includes(c));
    }, [wardrobe]);
    
    const [selectedGender, setSelectedGender] = useState<Gender>(genders[0] || 'Men');
    const [activeCategory, setActiveCategory] = useState<Category>(categories[0] || 'Tops');

    // Filter wardrobe by gender first, then by category
    const filteredByGender = useMemo(() => 
        wardrobe.filter(item => item.gender === selectedGender), 
        [wardrobe, selectedGender]
    );
    
    const categoriesForGender = useMemo(() => {
        const cats = [...new Set(filteredByGender.map(item => item.category))];
        const orderPriority: Category[] = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Indian Festive', 'Custom'];
        return orderPriority.filter(c => cats.includes(c));
    }, [filteredByGender]);
    
    const filteredWardrobe = useMemo(() => 
        filteredByGender.filter(item => item.category === activeCategory), 
        [filteredByGender, activeCategory]
    );

    // Update active category when gender changes
    React.useEffect(() => {
        if (categoriesForGender.length > 0 && !categoriesForGender.includes(activeCategory)) {
            setActiveCategory(categoriesForGender[0]);
        }
    }, [categoriesForGender, activeCategory]);

    const handleGarmentClick = async (item: WardrobeItem) => {
        setError(null);
        try {
            // Check if it's a DB ID or external URL
            const isDbId = !/^https?:/.test(item.url);
            
            if (isDbId) {
                // Custom uploaded item stored in IndexedDB
                const blob = await db.getImage(item.url);
                if (!blob) throw new Error(`Image not found in DB: ${item.url}`);
                const file = new File([blob], item.name, { type: blob.type });
                onGarmentSelect(file, item);
            } else {
                // CDN URL - pass URL string directly (no need to convert to File)
                onGarmentSelect(item.url, item);
            }
        } catch (err) {
            const detailedError = `Failed to load wardrobe item.`;
            setError(detailedError);
            console.error(`Failed to load wardrobe item: ${item.url}.`, err);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            setError(null);
            setPendingFile(file);
            e.target.value = '';
        }
    };

    const handleCategoryConfirm = async (gender: Gender, category: Category, aiPrompt?: string) => {
        if (!pendingFile) return;

        try {
            const imageId = `custom-${Date.now()}`;
            await db.putImage(pendingFile, imageId);

            const customGarmentInfo: WardrobeItem = {
                id: imageId,
                name: pendingFile.name.replace(/\.[^/.]+$/, ""),
                url: imageId,
                gender: gender,
                category: category,
                aiPrompt: aiPrompt, // Store AI prompt with the item
            };
            
            onGarmentSelect(pendingFile, customGarmentInfo);
            setPendingFile(null);
            setSelectedGender(gender);
            setActiveCategory(category);
        } catch (err) {
            setError("Could not save the uploaded file.");
            console.error(err);
        }
    };


  return (
    <div className="pt-6 border-t border-gray-400/50">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-serif tracking-wider text-gray-800">Wardrobe</h2>
            <label htmlFor="custom-garment-upload" className={`cursor-pointer text-sm font-semibold text-gray-800 bg-gray-200/80 hover:bg-gray-300/80 px-3 py-1 rounded-md transition-colors flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <UploadCloudIcon className="w-4 h-4 mr-2" />
                <span>Upload</span>
                <input 
                  id="custom-garment-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                  onChange={handleFileChange} 
                  disabled={isLoading}
                />
            </label>
        </div>
        
        {/* Gender Selection Dropdown */}
        {genders.length > 0 && (
            <div className="mb-4">
                <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value as Gender)}
                    className="w-full px-4 py-2 text-sm font-semibold rounded-lg border-2 border-gray-300 bg-white text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
                >
                    {genders.map(gender => (
                        <option key={gender} value={gender}>
                            {gender}'s Collection
                        </option>
                    ))}
                </select>
            </div>
        )}
        
        {/* Category Pills */}
        <div className="mb-4 overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex space-x-2">
                {categoriesForGender.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${activeCategory === category ? 'bg-gray-900 text-white' : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80'}`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
            {filteredWardrobe.map((item) => {
            const isActive = activeGarmentIds.includes(item.id);
            return (
                <button
                key={item.id}
                onClick={() => handleGarmentClick(item)}
                disabled={isLoading || isActive}
                className="relative aspect-square border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 group disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`Select ${item.name}`}
                >
                <DBImage src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                </div>
                {isActive && (
                    <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                    </div>
                )}
                </button>
            );
            })}
        </div>
        {filteredWardrobe.length === 0 && (
          <p className="text-center text-sm text-gray-500 pt-4">No items in this category.</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <AnimatePresence>
            {pendingFile && (
                <CategorySelectionModal
                    file={pendingFile}
                    onConfirm={handleCategoryConfirm}
                    onCancel={() => setPendingFile(null)}
                    genders={genders}
                    categories={categories}
                />
            )}
        </AnimatePresence>
    </div>
  );
};

export default WardrobePanel;