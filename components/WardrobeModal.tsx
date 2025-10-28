/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import type { WardrobeItem } from '../types';
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
  onConfirm: (category: string) => void;
  onCancel: () => void;
  categories: string[];
}

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({ file, onConfirm, onCancel, categories }) => {
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-white rounded-2xl w-full max-w-md flex flex-col shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-serif tracking-wider text-gray-800">Select Category</h2>
          <button onClick={onCancel} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex-shrink-0">
              <img src={imageUrl} alt="Uploaded garment preview" className="w-32 h-32 object-contain rounded-lg border bg-gray-100" />
              <p className="text-xs text-gray-600 mt-1 text-center truncate max-w-[8rem]" title={file.name}>{file.name}</p>
            </div>
            <div className="flex-grow w-full">
              <p className="text-gray-700 mb-3 font-medium">What type of garment is this?</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => onConfirm(category)}
                    className="w-full text-center px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-gray-200/80 text-gray-700 hover:bg-gray-300/80"
                  >
                    {category}
                  </button>
                ))}
              </div>
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
    const categories = useMemo(() => {
        const allCategories = [...new Set(wardrobe.map(item => item.category))].sort();
        if (allCategories.includes('Tops')) {
            return ['Tops', ...allCategories.filter(c => c !== 'Tops')];
        }
        return allCategories;
    }, [wardrobe]);
    const [activeCategory, setActiveCategory] = useState<string>(categories[0] || '');

    const filteredWardrobe = useMemo(() => 
        wardrobe.filter(item => item.category === activeCategory), 
        [wardrobe, activeCategory]
    );

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            let file: File;
            const isDbId = !/^(https?|data):/.test(item.url);
            if (isDbId) {
                const blob = await db.getImage(item.url);
                if (!blob) throw new Error(`Image not found in DB: ${item.url}`);
                file = new File([blob], item.name, { type: blob.type });
            } else {
                file = await urlToFile(item.url, item.name);
            }
            onGarmentSelect(file, item);
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

    const handleCategoryConfirm = async (category: string) => {
        if (!pendingFile) return;

        try {
            const imageId = `custom-${Date.now()}`;
            await db.putImage(pendingFile, imageId);

            const customGarmentInfo: WardrobeItem = {
                id: imageId,
                name: pendingFile.name.replace(/\.[^/.]+$/, ""),
                url: imageId,
                category: category,
            };
            
            onGarmentSelect(pendingFile, customGarmentInfo);
            setPendingFile(null);
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
        
        <div className="mb-4 overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex space-x-2">
                {categories.map(category => (
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
                    categories={categories}
                />
            )}
        </AnimatePresence>
    </div>
  );
};

export default WardrobePanel;