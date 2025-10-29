/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage, useObjectURL } from '../lib/utils';
import { RateLimitError } from '../lib/rateLimiter';
import { billingService } from '../services/billingService';
import { UsageLimitError } from '../types/billing';

interface StartScreenProps {
  onModelFinalized: (modelId: string) => void;
  onToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const CompareWithObjectURL: React.FC<any> = ({ firstImage, secondImageId, ...props }) => {
    const secondImageUrl = useObjectURL(secondImageId);
    return <Compare firstImage={firstImage} secondImage={secondImageUrl ?? firstImage} {...props} />;
};


const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized, onToast }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelId, setGeneratedModelId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        onToast?.('Please select an image file.', 'error');
        return;
    }

    // Check usage limit before processing
    const { allowed, reason } = billingService.canMakeRequest();
    if (!allowed) {
        setError(reason || 'No credits available');
        onToast?.(reason || 'No credits available', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelId(null);
        setError(null);
        try {
            const resultId = await generateModelImage(file);
            setGeneratedModelId(resultId);
            onToast?.('Model created successfully! 🎉', 'success');
        } catch (err) {
            if (err instanceof RateLimitError) {
                setError(err.message);
                onToast?.(err.message, 'warning');
            } else if (err instanceof UsageLimitError) {
                setError(err.message);
                onToast?.(err.message, 'warning');
            } else {
                const errorMsg = getFriendlyErrorMessage(err, 'Failed to create model');
                setError(errorMsg);
                onToast?.(errorMsg, 'error');
            }
            setUserImageUrl(null);
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, [onToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelId(null);
    setIsGenerating(false);
    setError(null);
  };

  const screenVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <AnimatePresence mode="wait">
      {!userImageUrl ? (
        <motion.div
          key="uploader"
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Left Section - Content */}
          <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="max-w-lg w-full">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-tight mb-4">
                Vismyras: Visualize Your Style.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
                Ever wondered how an outfit would look on you? Stop guessing. Upload a photo and see for yourself. Our AI creates your personal model, ready to try on our extensive collection of clothing and accessories.
              </p>
              
              <hr className="my-6 sm:my-8 border-gray-200" />
              
              <div className="flex flex-col items-center lg:items-start w-full gap-3">
                <label 
                  htmlFor="image-upload-start" 
                  className="w-full sm:w-auto relative flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 text-base font-semibold text-white bg-gray-900 rounded-lg cursor-pointer group hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  <UploadCloudIcon className="w-5 h-5 mr-3" />
                  Upload Your Photo
                </label>
                <input 
                  id="image-upload-start" 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                  onChange={handleFileChange} 
                />
                
                <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                  Select a clear, full-body photo. Face-only photos also work, but full-body is preferred for best results.
                </p>
                
                <p className="text-gray-400 text-xs mt-2 leading-relaxed max-w-md">
                  By uploading, you agree not to create harmful, explicit, or unlawful content. This service is for creative and responsible use only.
                </p>
                
                {error && (
                  <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Section - Demo */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center mt-8 lg:mt-0">
            <Compare
              firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg"
              secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png"
              slideMode="drag"
              className="w-full max-w-sm aspect-[2/3] rounded-2xl shadow-2xl bg-gray-200"
            />
            <p className="text-gray-500 text-sm mt-4 text-center">
              Drag to see the AI transformation
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="compare"
          className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Left Section - Controls */}
          <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="text-center md:text-left max-w-md">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight mb-3">
                The New You
              </h1>
              <p className="mt-2 text-base sm:text-lg text-gray-600">
                Drag the slider to see your transformation.
              </p>
            </div>
            
            {isGenerating && (
              <div className="flex items-center gap-3 text-base sm:text-lg text-gray-700 font-serif mt-6 bg-gray-50 px-4 py-3 rounded-lg">
                <Spinner />
                <span>Generating your model...</span>
              </div>
            )}

            {error && 
              <div className="text-center md:text-left max-w-md mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-700 mb-2">Generation Failed</p>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button 
                  onClick={reset} 
                  className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
                >
                  Try Again
                </button>
              </div>
            }
            
            <AnimatePresence>
              {generatedModelId && !isGenerating && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-8 w-full sm:w-auto"
                >
                  <button 
                    onClick={reset}
                    className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all duration-200 transform hover:scale-105"
                  >
                    Use Different Photo
                  </button>
                  <button 
                    onClick={() => onModelFinalized(generatedModelId)}
                    className="w-full sm:w-auto relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    Proceed to Styling →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Right Section - Comparison */}
          <div className="md:w-1/2 w-full flex items-center justify-center">
            <div 
              className={`relative rounded-2xl transition-all duration-700 ease-in-out ${
                isGenerating ? 'ring-2 ring-purple-300 animate-pulse' : 'shadow-2xl'
              }`}
            >
              <CompareWithObjectURL
                firstImage={userImageUrl}
                secondImageId={generatedModelId}
                slideMode="drag"
                className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-gray-200"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartScreen;