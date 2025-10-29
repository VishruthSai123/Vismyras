/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import SavedOutfitsPanel from './components/PosePanel';
import { generateVirtualTryOnImage, generatePoseVariation, generateChatEdit } from './services/geminiService';
import { OutfitLayer, WardrobeItem, SavedOutfit } from './types';
import { getFriendlyErrorMessage, db } from './lib/utils';
import { RateLimitError } from './lib/rateLimiter';
import { UsageLimitError, SubscriptionTier } from './types/billing';
import { billingService } from './services/billingService';
import { razorpayService } from './services/razorpayService';
import { supabaseService } from './services/supabaseService';
import { VismyrasUser, SignUpCredentials, LoginCredentials, AuthError } from './types/auth';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import Footer from './components/Footer';
import Spinner from './components/Spinner';
import ChatPanel from './components/ChatPanel';
import ToastContainer, { Toast } from './components/Toast';
import UsageDisplay from './components/UsageDisplay';
import PaywallModal from './components/PaywallModal';
import SubscriptionManagementModal from './components/SubscriptionManagementModal';
import { defaultWardrobe } from './wardrobe';

// Legal Pages
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import ContactUs from './pages/ContactUs';
import UsageScreen from './pages/UsageScreen';
import YourStyles from './pages/YourStyles';

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

const AppContent: React.FC = () => {
  const [modelImageId, setModelImageId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null); // Unique ID for current styling session
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [usageStats, setUsageStats] = useState(billingService.getUsageStats());
  
  // Auth state
  const [user, setUser] = useState<VismyrasUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Toast helper functions
  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Update usage stats
  const refreshUsageStats = useCallback(() => {
    setUsageStats(billingService.getUsageStats());
  }, []);

  // Initialize auth - simple and clean
  useEffect(() => {
    supabaseService.initialize();
    
    let mounted = true;
    
    // Safety timeout
    const timeout = setTimeout(() => {
      if (mounted) {
        setIsAuthLoading(false);
      }
    }, 10000);
    
    // Subscribe to auth changes
    const unsubscribe = supabaseService.onAuthStateChange((newUser) => {
      if (!mounted) return;
      
      setUser(newUser);
      setIsAuthLoading(false);
      clearTimeout(timeout);
      
      if (newUser) {
        billingService.setCurrentUser(newUser.auth.id);
        refreshUsageStats();
      } else {
        billingService.setCurrentUser(null);
        billingService.resetBilling();
        refreshUsageStats();
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  // Effect to load state from localStorage and IndexedDB on initial mount
  useEffect(() => {
    if (isAuthLoading) return; // Wait for auth to finish loading

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
            
            if (user) {
              addToast('Session restored! 👋', 'info', 3000);
            }
        }
      } catch (e) {
        // If loading fails, start fresh but don't clear user auth
      } finally {
        setIsStateLoaded(true);
      }
    };
    
    loadState();
  }, [isAuthLoading]); // Depend only on isAuthLoading

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
    
    // Generate unique workspace ID for this styling session
    const newWorkspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setWorkspaceId(newWorkspaceId);
    
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: id }
    }]);
    setCurrentOutfitIndex(0);
    
    // Track first try-on usage immediately
    try {
      billingService.consumeTryOn('try-on');
      refreshUsageStats();
      
      addToast('✨ New styling workspace created! All changes will be saved as one unique style.', 'success', 4000);
    } catch (err) {
      if (err instanceof UsageLimitError) {
        addToast(err.message, 'warning', 7000);
        setIsPaywallOpen(true);
      }
    }
  };

  const handleStartOver = () => {
    // Clear state
    setModelImageId(null);
    setWorkspaceId(null); // Clear workspace - next upload will create new one
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
    
    addToast('✨ Starting fresh! Your previous style has been saved.', 'info', 3000);
    
    // Clear storage is handled by the useEffect hook when modelImageId becomes null
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File | string, garmentInfo: WardrobeItem) => {
    if (!displayImageId || isLoading) return;

    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0);
        return;
    }

    setError(null);
    setIsLoading(true);
    
    // Check if this is a custom item with AI prompt
    const hasAiPrompt = garmentInfo.aiPrompt && garmentInfo.aiPrompt.trim().length > 0;
    setLoadingMessage(
      hasAiPrompt 
        ? `✨ Applying with AI: "${garmentInfo.aiPrompt}"...` 
        : garmentInfo.category === 'Accessories' 
          ? `Adding ${garmentInfo.name}...` 
          : `Putting on ${garmentInfo.name}...`
    );

    try {
      let newImageId: string;
      
      // If custom item has AI prompt, use chat edit to apply with AI instructions
      if (hasAiPrompt && garmentFile instanceof File) {
        newImageId = await generateChatEdit(displayImageId, garmentInfo.aiPrompt!, garmentFile);
      } else {
        // Standard virtual try-on
        newImageId = await generateVirtualTryOnImage(displayImageId, garmentFile, garmentInfo.category);
      }
      
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
      
      const successMessage = hasAiPrompt 
        ? `✨ AI applied successfully to ${garmentInfo.name}!` 
        : `Successfully added ${garmentInfo.name}!`;
      addToast(successMessage, 'success', 3000);
      refreshUsageStats();
      
      // Auto-save will be triggered by useEffect watching outfitHistory changes
    } catch (err) {
      if (err instanceof UsageLimitError) {
        addToast(err.message, 'warning', 7000);
        setIsPaywallOpen(true); // Show paywall modal
      } else if (err instanceof RateLimitError) {
        addToast(err.message, 'warning', 7000);
      } else {
        const errorMsg = getFriendlyErrorMessage(err, 'Failed to apply garment');
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
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
      const newImageId = await generatePoseVariation(baseImageForPoseChange as string, poseInstruction);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = { ...newHistory[currentOutfitIndex] };
        updatedLayer.poseImages = { ...updatedLayer.poseImages, [poseInstruction]: newImageId };
        newHistory[currentOutfitIndex] = updatedLayer;
        return newHistory;
      });
      addToast('Pose changed successfully!', 'success', 2000);
    } catch (err) {
      if (err instanceof RateLimitError) {
        addToast(err.message, 'warning', 7000);
      } else {
        const errorMsg = getFriendlyErrorMessage(err, 'Failed to change pose');
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
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
        name: `Outfit ${new Date().toLocaleDateString()}`,
        modelImageUrl: modelImageId, // Store the current model image ID
        modelImageId: modelImageId,
        layers: activeOutfitLayers,
        previewUrl: displayImageId,
        createdAt: new Date().toISOString(),
    };
    setSavedOutfits(prev => [newSavedOutfit, ...prev]);
    addToast('Outfit saved successfully! 💾', 'success', 3000);
  };

  const handleLoadOutfit = async (outfitToLoad: SavedOutfit) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setLoadingMessage('Loading your style...');
      
      // Restore model image to IndexedDB
      if (outfitToLoad.modelImageUrl) {
        // Convert data URL back to blob
        const response = await fetch(outfitToLoad.modelImageUrl);
        const blob = await response.blob();
        const modelId = outfitToLoad.modelImageId || `restored_model_${Date.now()}`;
        await db.putImage(blob, modelId);
        setModelImageId(modelId);
      }
      
      // Restore all garment layers with their images
      for (const layer of outfitToLoad.layers) {
        // Restore pose images for each layer
        for (const [pose, imageUrl] of Object.entries(layer.poseImages || {})) {
          if (imageUrl && imageUrl.startsWith('data:')) {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            // Generate a unique ID for this image
            const imageId = `restored_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await db.putImage(blob, imageId);
            // Update the layer to use the new ID
            layer.poseImages[pose] = imageId;
          }
        }
      }
      
      // Set the complete outfit stack
      setOutfitHistory(outfitToLoad.layers);
      setCurrentOutfitIndex(outfitToLoad.layers.length - 1);
      setCurrentPoseIndex(0);
      
      setIsLoading(false);
      setLoadingMessage('');
      addToast('✨ Style restored with all layers!', 'success', 3000);
    } catch (error) {
      console.error('Failed to load outfit:', error);
      setIsLoading(false);
      setLoadingMessage('');
      addToast('Failed to load style. Please try again.', 'error', 3000);
    }
  };

  const handleDeleteOutfit = (outfitId: string) => {
    setSavedOutfits(prev => prev.filter(o => o.id !== outfitId));
    addToast('Outfit deleted', 'info', 2000);
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
        addToast('Style updated successfully! ✨', 'success', 3000);
        
        // Consume 1 try-on credit for AI chat edit
        refreshUsageStats();
        
    } catch (err) {
        if (err instanceof UsageLimitError) {
            addToast(err.message, 'warning', 7000);
            setIsPaywallOpen(true);
        } else if (err instanceof RateLimitError) {
            addToast(err.message, 'warning', 7000);
        } else {
            const errorMsg = getFriendlyErrorMessage(err, 'Failed to apply your edit');
            setError(errorMsg);
            addToast(errorMsg, 'error');
        }
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [displayImageId, isLoading, currentOutfitIndex, addToast, refreshUsageStats]);

  // Payment handlers
  const handleSubscribe = useCallback(async (tier: SubscriptionTier) => {
    if (!user) {
      setIsAuthModalOpen(true);
      addToast('Please sign in to upgrade your subscription', 'warning', 5000);
      return;
    }

    if (tier === SubscriptionTier.PREMIUM) {
      setIsLoading(true);
      setLoadingMessage('Opening payment gateway...');
      
      await razorpayService.subscribeTomonth(
        199,
        async (response) => {
          setIsLoading(false);
          setLoadingMessage('');
          setIsPaywallOpen(false);
          refreshUsageStats();
          await 
          addToast('🎉 Welcome to Premium! You now have 50 try-ons per month.', 'success', 5000);
        },
        (error) => {
          setIsLoading(false);
          setLoadingMessage('');
          addToast(error.message || 'Payment failed. Please try again.', 'error', 5000);
        }
      );
    }
  }, [addToast, refreshUsageStats, user]);

  const handleBuyCredits = useCallback(async (tryOns: number, price: number) => {
    if (!user) {
      setIsAuthModalOpen(true);
      addToast('Please sign in to purchase credits', 'warning', 5000);
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Opening payment gateway...');
    
    await razorpayService.buyCredits(
      tryOns,
      price,
      async (response) => {
        setIsLoading(false);
        setLoadingMessage('');
        setIsPaywallOpen(false);
        refreshUsageStats();
        await 
        addToast(`✅ Success! Added ${tryOns} try-on${tryOns > 1 ? 's' : ''} to your account.`, 'success', 5000);
      },
      (error) => {
        setIsLoading(false);
        setLoadingMessage('');
        addToast(error.message || 'Payment failed. Please try again.', 'error', 5000);
      }
    );
  }, [addToast, refreshUsageStats, user]);

  const handleUpgradeClick = useCallback(() => {
    setIsPaywallOpen(true);
  }, []);

  // Subscription management handlers
  const handleCancelSubscription = useCallback(async () => {
    if (!user) {
      addToast('Please sign in to manage your subscription', 'warning', 5000);
      return;
    }

    const billing = billingService.getUserBilling();
    if (!billing.subscription.razorpaySubscriptionId) {
      addToast('No active subscription found', 'error', 5000);
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Cancelling subscription...');

    await razorpayService.cancelSubscription(
      billing.subscription.razorpaySubscriptionId,
      user.id,
      () => {
        setIsLoading(false);
        setLoadingMessage('');
        refreshUsageStats();
        setIsSubscriptionModalOpen(false);
        addToast('✅ Subscription cancelled. You\'ll keep Premium access until the end of your billing period.', 'success', 8000);
      },
      (error) => {
        setIsLoading(false);
        setLoadingMessage('');
        addToast(error.message || 'Failed to cancel subscription. Please try again.', 'error', 5000);
      }
    );
  }, [addToast, refreshUsageStats, user]);

  const handleReactivateSubscription = useCallback(() => {
    billingService.reactivateSubscription();
    refreshUsageStats();
    addToast('✅ Subscription reactivated! Your Premium benefits will continue.', 'success', 5000);
  }, [addToast, refreshUsageStats]);

  const handleManageSubscriptionClick = useCallback(() => {
    setIsSubscriptionModalOpen(true);
  }, []);

  // Auth handlers
  const handleSignUp = useCallback(async (credentials: SignUpCredentials) => {
    try {
      const result = await supabaseService.signUp(credentials);
      
      if (result === null) {
        // Email confirmation required
        setIsAuthModalOpen(false);
        addToast('📧 Please check your email to confirm your account!', 'info', 8000);
      } else {
        // User authenticated immediately
        setIsAuthModalOpen(false);
        addToast('🎉 Account created successfully! Welcome to Vismyras!', 'success', 5000);
      }
    } catch (err) {
      if (err instanceof AuthError) {
        throw err;
      }
      throw new AuthError('Failed to create account. Please try again.');
    }
  }, [addToast]);

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    try {
      await supabaseService.login(credentials);
      // Auth state change listener will handle the rest
      setIsAuthModalOpen(false);
    } catch (err) {
      if (err instanceof AuthError) {
        throw err;
      }
      throw new AuthError('Failed to login. Please try again.');
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await supabaseService.signInWithGoogle();
      // OAuth redirect will happen - session will be picked up by onAuthStateChange
    } catch (err) {
      if (err instanceof AuthError) {
        throw err;
      }
      throw new AuthError('Failed to sign in with Google. Please try again.');
    }
  }, []);

  // Auto-save outfit to database
  const autoSaveOutfit = useCallback(async () => {
    if (!user?.auth?.id || !workspaceId || outfitHistory.length === 0) return;
    
    try {
      // Get the current layer (final result with all garments)
      const currentLayer = outfitHistory[currentOutfitIndex];
      if (!currentLayer) return;

      // Get the final generated image (the complete outfit)
      const finalImageId = currentLayer?.poseImages?.[POSE_INSTRUCTIONS[currentPoseIndex]];
      if (!finalImageId) return;

      // Convert final image blob to base64 data URL (permanent)
      const finalBlob = await db.getImage(finalImageId);
      if (!finalBlob) return;

      const finalImageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(finalBlob);
      });

      // Get model image as base64 too
      const modelBlob = await db.getImage(modelImageId);
      let modelImageDataUrl = '';
      if (modelBlob) {
        modelImageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(modelBlob);
        });
      }

      // Save ALL layers up to current index (the complete stack)
      const completeStack = outfitHistory.slice(0, currentOutfitIndex + 1);

      // Convert all pose images in all layers from IndexedDB IDs to base64 data URLs
      const completeStackWithDataUrls = await Promise.all(
        completeStack.map(async (layer) => {
          const poseImagesWithDataUrls: Record<string, string> = {};
          
          for (const [pose, imageId] of Object.entries(layer.poseImages)) {
            // Ensure imageId is a string
            const imgId = String(imageId);
            
            // Check if it's already a data URL or external URL
            if (imgId.startsWith('data:') || imgId.startsWith('http')) {
              poseImagesWithDataUrls[pose] = imgId;
            } else {
              // Convert IndexedDB ID to base64 data URL
              const blob = await db.getImage(imgId);
              if (blob) {
                const dataUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
                poseImagesWithDataUrls[pose] = dataUrl;
              } else {
                console.warn('⚠️ Image not found in IndexedDB:', imgId);
              }
            }
          }
          
          return {
            ...layer,
            poseImages: poseImagesWithDataUrls,
          };
        })
      );

      // Upsert with workspace_id - updates existing or creates new
      // This ensures all edits in one workspace are saved as ONE style
      await supabaseService.saveOutfit({
        user_id: user.auth.id,
        workspace_id: workspaceId, // Unique workspace identifier
        outfit_name: `Style ${new Date().toLocaleDateString()}`,
        model_image_url: modelImageDataUrl, // Base64 data URL
        model_image_id: modelImageId,
        garment_layers: completeStackWithDataUrls, // Save complete stack with data URLs
        final_image_url: finalImageDataUrl, // Base64 data URL - the complete final image
        final_image_id: finalImageId,
        pose_variation: POSE_INSTRUCTIONS[currentPoseIndex],
      });
      
    } catch (err) {
      console.error('❌ Failed to save outfit:', err);
      // Silent fail - don't interrupt user workflow
    }
  }, [user, workspaceId, outfitHistory, currentOutfitIndex, modelImageId, currentPoseIndex]);

  // Auto-save outfit to database whenever the outfit changes
  useEffect(() => {
    if (!user?.auth?.id || outfitHistory.length === 0) return;
    
    // Only save if there are actual garments (not just base model)
    if (currentOutfitIndex === 0 && outfitHistory.length === 1) return;
    
    // Debounce: save 2 seconds after the last change
    const timeoutId = setTimeout(() => {
      autoSaveOutfit();
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [user, outfitHistory, currentOutfitIndex, currentPoseIndex, autoSaveOutfit]);

  const handleLogout = useCallback(async () => {
    try {
      handleStartOver();
      await supabaseService.logout();
      
      // Clear localStorage
      localStorage.removeItem('vismyras_modelImageId');
      localStorage.removeItem('vismyras_outfitHistory');
      localStorage.removeItem('vismyras_currentOutfitIndex');
      localStorage.removeItem('vismyras_wardrobe');
      localStorage.removeItem('vismyras_savedOutfits');
      
      setShowUsageScreen(false);
      setShowStylesScreen(false);
      
      addToast('Logged out successfully. See you soon! 👋', 'info', 3000);
    } catch (err) {
      addToast('Failed to logout. Please try again.', 'error', 3000);
    }
  }, [addToast]);

  const handleViewBilling = useCallback(() => {
    setIsPaywallOpen(true);
  }, []);

  const [showUsageScreen, setShowUsageScreen] = useState(false);
  const [showStylesScreen, setShowStylesScreen] = useState(false);

  const handleViewUsage = useCallback(() => {
    setShowUsageScreen(true);
  }, []);

  const handleViewStyles = useCallback(() => {
    setShowStylesScreen(true);
  }, []);

  const handleRestoreOutfit = useCallback(async (outfit: any) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Restoring your complete workspace...');
      
      // Restore workspace_id so edits continue in the same workspace
      if (outfit.workspace_id) {
        setWorkspaceId(outfit.workspace_id);
      }
      
      // Restore model image to IndexedDB
      if (outfit.model_image_url) {
        const response = await fetch(outfit.model_image_url);
        const blob = await response.blob();
        const modelId = outfit.model_image_id || `restored_model_${Date.now()}`;
        await db.putImage(blob, modelId);
        setModelImageId(modelId);
      }
      
      // Restore all garment layers with their images
      if (outfit.garment_layers && outfit.garment_layers.length > 0) {
        for (const layer of outfit.garment_layers) {
          // Restore pose images for each layer
          for (const [pose, imageUrl] of Object.entries(layer.poseImages || {})) {
            if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              // Generate a unique ID for this image
              const imageId = `restored_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await db.putImage(blob, imageId);
              // Update the layer to use the new ID
              layer.poseImages[pose] = imageId;
            }
          }
        }
        
        setOutfitHistory(outfit.garment_layers);
        setCurrentOutfitIndex(outfit.garment_layers.length - 1);
      }
      
      setIsLoading(false);
      setLoadingMessage('');
      setShowStylesScreen(false);
      addToast('✨ Workspace restored! Continue editing and all changes will update this style.', 'success', 4000);
    } catch (error) {
      console.error('Failed to restore outfit:', error);
      setIsLoading(false);
      setLoadingMessage('');
      addToast('Failed to restore workspace. Please try again.', 'error', 3000);
    }
  }, [addToast]);


  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  if (!isStateLoaded || isAuthLoading) {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-50">
            <Spinner />
            <p className="text-lg font-serif text-gray-700 mt-4">
              {isAuthLoading ? 'Checking authentication...' : 'Loading your session...'}
            </p>
        </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Legal Pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        
        {/* Main App */}
        <Route path="/" element={
          showStylesScreen ? (
            user ? (
              <YourStyles 
                user={user}
                onBack={() => setShowStylesScreen(false)} 
                onRestoreOutfit={handleRestoreOutfit}
                onLogout={handleLogout}
                onViewBilling={handleViewBilling}
                onViewUsage={handleViewUsage}
                onViewStyles={handleViewStyles}
              />
            ) : (
              <div className="w-screen h-screen flex flex-col">
                <Header 
                  onAuthClick={() => setIsAuthModalOpen(true)}
                />
                <div className="flex-grow flex items-center justify-center">
                  <p className="text-gray-600">Please sign in to view your styles</p>
                </div>
              </div>
            )
          ) : showUsageScreen ? (
            <UsageScreen onBack={() => setShowUsageScreen(false)} />
          ) : (
          <div className="font-sans">
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            
            {/* Auth Modal */}
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              onSignUp={handleSignUp}
              onLogin={handleLogin}
              onGoogleSignIn={handleGoogleSignIn}
              isLoading={isLoading}
            />
            
            <AnimatePresence mode="wait">
              {!modelImageId ? (
                <motion.div
                  key="start-screen"
                  className="w-screen min-h-screen flex flex-col bg-gray-50"
                  variants={viewVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  {/* Header */}
                  <Header 
                    user={user}
                    onAuthClick={() => setIsAuthModalOpen(true)}
                    onLogout={handleLogout}
                    onViewBilling={handleViewBilling}
                    onViewUsage={handleViewUsage}
                    onViewStyles={handleViewStyles}
                  />
                  
                  {/* Main Content */}
                  <div className="flex-grow flex items-center justify-center p-4 pb-20">
                    {user ? (
                      <StartScreen onModelFinalized={handleModelFinalized} onToast={addToast} />
                    ) : (
                      <div className="max-w-4xl mx-auto text-center px-4">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight mb-6">
                          Vismyras: Visualize Your Style.
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                          Sign in to start your virtual try-on experience with AI-powered fashion visualization.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                          <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
                          >
                            Get Started - Sign In
                          </button>
                        </div>
                        <p className="text-gray-500 text-sm mt-6">
                          Free tier includes 3 virtual try-ons per month
                        </p>
                        
                        {/* Feature highlights */}
                        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
                          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-3">🎨</div>
                            <h3 className="font-semibold text-gray-900 mb-2 text-lg">AI-Powered</h3>
                            <p className="text-gray-600 text-sm">Advanced AI creates realistic virtual try-ons</p>
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-3">👗</div>
                            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Extensive Wardrobe</h3>
                            <p className="text-gray-600 text-sm">Try on various clothes and accessories</p>
                          </div>
                          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-3">💾</div>
                            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Save & Share</h3>
                            <p className="text-gray-600 text-sm">Save your favorite looks and share them</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer - Only on start screen */}
                  <Footer show={true} />
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
                  <Header 
                    user={user}
                    onAuthClick={() => setIsAuthModalOpen(true)}
                    onLogout={handleLogout}
                    onViewBilling={handleViewBilling}
                    onViewUsage={handleViewUsage}
                    onViewStyles={handleViewStyles}
                  />
                  
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
                        onChatOpen={() => setIsChatOpen(true)}
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
                          <UsageDisplay
                            used={usageStats.used}
                            limit={usageStats.limit}
                            remaining={usageStats.remaining}
                            oneTimeCredits={usageStats.oneTimeCredits}
                            percentUsed={usageStats.percentUsed}
                            tier={usageStats.tier}
                            daysUntilReset={usageStats.daysUntilReset}
                            onUpgradeClick={handleUpgradeClick}
                            onManageSubscription={handleManageSubscriptionClick}
                          />
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
                  
                  <PaywallModal
                    isOpen={isPaywallOpen}
                    onClose={() => setIsPaywallOpen(false)}
                    onSubscribe={handleSubscribe}
                    onBuyCredits={handleBuyCredits}
                    currentTier={usageStats.tier}
                  />

                  <SubscriptionManagementModal
                    isOpen={isSubscriptionModalOpen}
                    onClose={() => setIsSubscriptionModalOpen(false)}
                    currentTier={usageStats.tier}
                    subscriptionStatus={billingService.getUserBilling().subscription.status}
                    endDate={billingService.getUserBilling().subscription.endDate}
                    razorpaySubscriptionId={billingService.getUserBilling().subscription.razorpaySubscriptionId}
                    onCancelSubscription={handleCancelSubscription}
                    onReactivateSubscription={handleReactivateSubscription}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )
        } />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
