/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { MessageSquareIcon } from './icons';

interface ChatFabProps {
  onClick: () => void;
}

const ChatFab: React.FC<ChatFabProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-40 w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 active:scale-95 transition-all duration-300 ease-in-out"
      aria-label="Open chat"
    >
      <MessageSquareIcon className="w-8 h-8" />
    </button>
  );
};

export default ChatFab;