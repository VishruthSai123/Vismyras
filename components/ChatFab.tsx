/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { MessageSquareIcon } from './icons';

interface ChatFabProps {
  onClick: () => void;
  hideOnMobile?: boolean;
  variant?: 'floating' | 'inline'; // New prop for positioning
}

const ChatFab: React.FC<ChatFabProps> = ({ onClick, hideOnMobile = false, variant = 'floating' }) => {
  if (variant === 'inline') {
    // Inline variant - smaller, positioned beside Start Over
    return (
      <button
        onClick={onClick}
        className={`flex items-center justify-center bg-white/60 border border-gray-300/80 text-gray-700 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 active:scale-95 text-sm backdrop-blur-sm ${hideOnMobile ? 'hidden sm:flex' : ''}`}
        aria-label="AI Style Editor"
      >
        <MessageSquareIcon className="w-4 h-4 mr-2" />
        AI Edit
      </button>
    );
  }

  // Original floating variant
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-40 w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 active:scale-95 transition-all duration-300 ease-in-out ${hideOnMobile ? 'hidden sm:flex' : ''}`}
      aria-label="Open chat"
    >
      <MessageSquareIcon className="w-8 h-8" />
    </button>
  );
};

export default ChatFab;