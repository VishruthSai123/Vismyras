/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon, PlusIcon } from './icons';
import { useObjectURL } from '../lib/utils';

interface DBImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const DBImage: React.FC<DBImageProps> = ({ src, ...props }) => {
    // We assume an ID is a non-URL string (doesn't start with http, https, or data:)
    const isDbId = !/^(https?|data):/.test(src);
    const objectUrl = useObjectURL(isDbId ? src : null);
  
    const finalSrc = isDbId ? objectUrl : src;
  
    if (!finalSrc) {
      return <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md animate-pulse" />;
    }
  
    return <img src={finalSrc} {...props} />;
};


interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRemoveLastGarment: () => void;
  onSaveOutfit: () => void;
}

const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, onRemoveLastGarment, onSaveOutfit }) => {
  const canSave = outfitHistory.length > 1;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-400/50 pb-2 mb-3">
        <h2 className="text-xl font-serif tracking-wider text-gray-800">Outfit Stack</h2>
        <button
          onClick={onSaveOutfit}
          disabled={!canSave}
          className="text-sm font-semibold text-gray-800 bg-gray-200/80 hover:bg-gray-300/80 px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
      <div className="space-y-2">
        {outfitHistory.map((layer, index) => (
          <div
            key={layer.garment?.id || 'base'}
            className="flex items-center justify-between bg-white/50 p-2 rounded-lg animate-fade-in border border-gray-200/80"
          >
            <div className="flex items-center overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 mr-3 text-xs font-bold text-gray-600 bg-gray-200 rounded-full">
                  {index + 1}
                </span>
                {layer.garment && (
                    <DBImage src={layer.garment.url} alt={layer.garment.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md mr-3" />
                )}
                <span className="font-semibold text-gray-800 truncate" title={layer.garment?.name}>
                  {layer.garment ? layer.garment.name : 'Base Model'}
                </span>
            </div>
            {index > 0 && index === outfitHistory.length - 1 && (
               <button
                onClick={onRemoveLastGarment}
                className="flex-shrink-0 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                aria-label={`Remove ${layer.garment?.name}`}
              >
                <Trash2Icon className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {outfitHistory.length === 1 && (
            <p className="text-center text-sm text-gray-500 pt-4">Your stacked items will appear here. Select an item from the wardrobe below.</p>
        )}
      </div>
    </div>
  );
};

export default OutfitStack;