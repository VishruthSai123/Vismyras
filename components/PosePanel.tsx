/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SavedOutfit } from '../types';
import { Trash2Icon, DownloadIcon } from './icons';
import { useObjectURL, db } from '../lib/utils';

interface SavedOutfitsPanelProps {
  savedOutfits: SavedOutfit[];
  onLoadOutfit: (outfit: SavedOutfit) => void;
  onDeleteOutfit: (outfitId: string) => void;
  isLoading: boolean;
}

interface SavedOutfitCardProps {
  outfit: SavedOutfit;
  onLoadOutfit: (outfit: SavedOutfit) => void;
  onDeleteOutfit: (outfitId: string) => void;
  isLoading: boolean;
}

const SavedOutfitCard: React.FC<SavedOutfitCardProps> = ({ outfit, onLoadOutfit, onDeleteOutfit, isLoading }) => {
    const previewImageUrl = useObjectURL(outfit.previewUrl);

    const handleDownloadOutfit = async (imageId: string, outfitId: string) => {
        const blob = await db.getImage(imageId);
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vismyras-outfit-${outfitId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="relative aspect-square group">
            {previewImageUrl ? (
                <img src={previewImageUrl} alt="Saved outfit" className="w-full h-full object-cover rounded-lg border border-gray-200" />
            ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-2 gap-1.5">
                <button
                    onClick={() => onLoadOutfit(outfit)}
                    disabled={isLoading}
                    className="w-full text-sm bg-white/90 text-black font-semibold py-1.5 px-2 rounded-md hover:bg-white disabled:opacity-50"
                >
                    Load
                </button>
                <button
                    onClick={() => handleDownloadOutfit(outfit.previewUrl, outfit.id)}
                    className="w-full text-sm bg-white/90 text-black font-semibold py-1.5 px-2 rounded-md hover:bg-white flex items-center justify-center"
                >
                    <DownloadIcon className="w-4 h-4 mr-1.5" />
                    Download
                </button>
                <button
                    onClick={() => onDeleteOutfit(outfit.id)}
                    className="absolute top-1 right-1 text-white hover:text-red-400 p-1 bg-black/30 rounded-full"
                    aria-label="Delete outfit"
                >
                    <Trash2Icon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


const SavedOutfitsPanel: React.FC<SavedOutfitsPanelProps> = ({ savedOutfits, onLoadOutfit, onDeleteOutfit, isLoading }) => {
  if (savedOutfits.length === 0) {
    return null; // Don't render anything if there are no saved outfits
  }

  return (
    <div className="pt-6 border-t border-gray-400/50">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Saved Outfits</h2>
      <div className="grid grid-cols-3 gap-3">
        {savedOutfits.map((outfit) => (
          <SavedOutfitCard 
            key={outfit.id} 
            outfit={outfit} 
            onLoadOutfit={onLoadOutfit}
            onDeleteOutfit={onDeleteOutfit}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default SavedOutfitsPanel;