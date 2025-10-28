/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import SavedOutfitsPanel from './components/PosePanel';
import { generateVirtualTryOnImage, generatePoseVariation, generateChatEdit } from './services/geminiService';
import { OutfitLayer, WardrobeItem, SavedOutfit } from './types';
import { getFriendlyErrorMessage, db } from './lib/utils';
import Header from './components/Header';
import Footer from './components/Footer';
import Spinner from './components/Spinner';
import ChatFab from './components/ChatFab';
import ChatPanel from './components/ChatPanel';
import { defaultWardrobe } from './wardrobe';

const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};

const App: React.FC = () => {
  const [modelImageId, setModelImageId] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState<number>(0);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Effect to load state from localStorage and IndexedDB on initial mount
  useEffect(() => {
    const loadState = async () => {
      try {
        await db.init();
        const savedModelId = JSON.parse(localStorage.getItem('vismyras_modelImageId') || 'null');
        if (savedModelId) {
            setModelImageId(savedModelId);
            const savedHistory = JSON.parse(localStorage.getItem('vismyras_outfitHistory') || '[]');
            setOutfitHistory(savedHistory);
            setCurrentOutfitIndex(JSON.parse(localStorage.getItem('vismyras_currentOutfitIndex') || '0'));
            setWardrobe(JSON.parse(localStorage.getItem('vismyras_wardrobe') || JSON.stringify(defaultWardrobe)));
            setSavedOutfits(JSON.parse(localStorage.getItem('vismyras_savedOutfits') || '[]'));
        }
      } catch (e) {
        console.error("Failed to load saved state:", e);
        // If loading fails, start fresh
        handleStartOver();
      } finally {
        setIsStateLoaded(true);
      }
    };
    loadState();
  }, []);

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    if (!isStateLoaded) return; // Don't save until initial state is loaded
    if (!modelImageId) { // If model is cleared, clear everything
        localStorage.removeItem('vismyras_modelImageId');
        localStorage.removeItem('vismyras_outfitHistory');
        localStorage.removeItem('vismyras_currentOutfitIndex');
        localStorage.removeItem('vismyras_wardrobe');
        localStorage.removeItem('vismyras_savedOutfits');
        return;
    }
    try {
        localStorage.setItem('vismyras_modelImageId', JSON.stringify(modelImageId));
        localStorage.setItem('vismyras_outfitHistory', JSON.stringify(outfitHistory));
        localStorage.setItem('vismyras_currentOutfitIndex', JSON.stringify(currentOutfitIndex));
        localStorage.setItem('vismyras_wardrobe', JSON.stringify(wardrobe));
        localStorage.setItem('vismyras_savedOutfits', JSON.stringify(savedOutfits));
    } catch (e) {
        console.error("Failed to save state to localStorage:", e);
        setError("Could not save your session. Your browser's storage might be full.");
    }
  }, [isStateLoaded, modelImageId, outfitHistory, currentOutfitIndex, wardrobe, savedOutfits]);


  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageId = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageId;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageId;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageId]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  const handleModelFinalized = (id: string) => {
    setModelImageId(id);
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: id }
    }]);
    setCurrentOutfitIndex(0);
  };

  const handleStartOver = () => {
    // Clear state
    setModelImageId(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setWardrobe(defaultWardrobe);
    setSavedOutfits([]);
    
    // Reset non-persistent state
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(true);
    
    // Clear storage is handled by the useEffect hook when modelImageId becomes null
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageId || isLoading) return;

    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0);
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(garmentInfo.category === 'Accessories' ? `Adding ${garmentInfo.name}...` : `Putting on ${garmentInfo.name}...`);

    try {
      const newImageId = await generateVirtualTryOnImage(displayImageId, garmentFile, garmentInfo.category);
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageId } 
      };

      setOutfitHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
      
      // Add to wardrobe if it's a new custom item
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to apply garment'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageId, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0);
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Changing pose...`);
    
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);

    try {
      const newImageId = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = { ...newHistory[currentOutfitIndex] };
        updatedLayer.poseImages = { ...updatedLayer.poseImages, [poseInstruction]: newImageId };
        newHistory[currentOutfitIndex] = updatedLayer;
        return newHistory;
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex]);

  const handleSaveOutfit = () => {
    if (activeOutfitLayers.length <= 1 || !displayImageId) return;
    const newSavedOutfit: SavedOutfit = {
        id: `outfit-${Date.now()}`,
        layers: activeOutfitLayers,
        previewUrl: displayImageId,
    };
    setSavedOutfits(prev => [newSavedOutfit, ...prev]);
  };

  const handleLoadOutfit = (outfitToLoad: SavedOutfit) => {
    if (isLoading) return;
    setOutfitHistory(outfitToLoad.layers);
    setCurrentOutfitIndex(outfitToLoad.layers.length - 1);
    setCurrentPoseIndex(0);
  };

  const handleDeleteOutfit = (outfitId: string) => {
    setSavedOutfits(prev => prev.filter(o => o.id !== outfitId));
  };

  const handleChatSubmit = useCallback(async (prompt: string, image?: File) => {
    if (!displayImageId || isLoading) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Applying your style edit...`);
    setIsChatOpen(false);

    try {
        const newImageId = await generateChatEdit(displayImageId, prompt, image);
        
        setOutfitHistory(prevHistory => {
            const newHistory = [...prevHistory];
            const updatedLayer = { ...newHistory[currentOutfitIndex] };
            const basePoseInstruction = POSE_INSTRUCTIONS[0];
            updatedLayer.poseImages = { [basePoseInstruction]: newImageId };
            newHistory[currentOutfitIndex] = updatedLayer;
            return newHistory;
        });
        setCurrentPoseIndex(0);
        
    } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Failed to apply your edit'));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [displayImageId, isLoading, currentOutfitIndex]);


  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  if (!isStateLoaded) {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-50">
            <Spinner />
            <p className="text-lg font-serif text-gray-700 mt-4">Loading your session...</p>
        </div>
    );
  }

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {!modelImageId ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="flex flex-col h-screen bg-white overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Header />
            <main className="h-[calc(100vh-4rem)] relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 relative">
                <Canvas 
                  displayImageId={displayImageId}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-[70vh] md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-16 flex items-center justify-center flex-col gap-2 pt-2 bg-gray-50 border-t border-b border-gray-200/60"
                    aria-label={isSheetCollapsed ? 'Show controls' : 'Hide controls'}
                  >
                    <div className="w-8 h-1 bg-gray-300 rounded-full" />
                    <span className="text-sm font-semibold text-gray-600">
                        {isSheetCollapsed ? 'Show Controls' : 'Hide Controls'}
                    </span>
                  </button>
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={activeOutfitLayers}
                      onRemoveLastGarment={handleRemoveLastGarment}
                      onSaveOutfit={handleSaveOutfit}
                    />
                    <SavedOutfitsPanel
                      savedOutfits={savedOutfits}
                      onLoadOutfit={handleLoadOutfit}
                      onDeleteOutfit={handleDeleteOutfit}
                      isLoading={isLoading}
                    />
                    <WardrobePanel
                      onGarmentSelect={handleGarmentSelect}
                      activeGarmentIds={activeGarmentIds}
                      isLoading={isLoading}
                      wardrobe={wardrobe}
                    />
                  </div>
              </aside>
            </main>
            
            <ChatFab onClick={() => setIsChatOpen(true)} />
            
            <ChatPanel 
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              onSubmit={handleChatSubmit}
              isLoading={isLoading}
            />

            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageId} />
    </div>
  );
};

export default App;