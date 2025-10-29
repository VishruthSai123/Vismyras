/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon, PaperclipIcon, SendIcon } from './icons';
import Spinner from './Spinner';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, image?: File) => void;
  isLoading: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Auto-resize logic
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'; // Max 200px height
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (!text.trim() && !imageFile)) return;
    onSubmit(text, imageFile ?? undefined);
    setText('');
    handleRemoveImage();
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-2xl bg-white rounded-t-2xl shadow-xl flex flex-col h-[70vh] md:h-auto md:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b shrink-0">
              <h2 className="text-xl font-serif tracking-wider text-gray-800">Stylist Chat</h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                <XIcon className="w-6 h-6" />
              </button>
            </header>

            <main className="flex-grow p-6 overflow-y-auto">
                <div className="text-center text-gray-500 space-y-2">
                    <p className='text-base'>Describe the changes you'd like to see.</p>
                    <p className="text-sm">For example: "Add a red scarf", "Change the background to a beach", or "Make this a denim jacket".</p>
                    <p className="text-sm mt-2">You can also upload a reference image.</p>
                </div>
            </main>

            <footer className="p-4 border-t bg-white shrink-0">
              <form onSubmit={handleSubmit} className="flex items-end gap-3">
                {/* Attachment Button */}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isLoading} 
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors mb-0.5 disabled:opacity-50"
                  aria-label="Attach image"
                >
                  <PaperclipIcon className="w-6 h-6" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="chat-image-upload" 
                  accept="image/*" 
                />

                {/* Input Container */}
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-3xl px-4 py-2.5 flex flex-col max-h-[220px]">
                  {imagePreview && (
                    <div className="relative w-16 h-16 mb-2 self-start">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <button 
                        type="button" 
                        onClick={handleRemoveImage} 
                        className="absolute -top-1.5 -right-1.5 bg-gray-700 text-white rounded-full p-0.5 hover:bg-gray-900 transition-colors"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Type a message"
                    rows={1}
                    className="w-full resize-none border-none focus:ring-0 focus:outline-none p-0 text-[15px] text-gray-800 placeholder-gray-400 bg-transparent leading-relaxed min-h-[24px] max-h-[180px] overflow-y-auto"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>

                {/* Send Button - Fixed at bottom */}
                <button 
                  type="submit" 
                  disabled={isLoading || (!text.trim() && !imageFile)} 
                  className="flex-shrink-0 p-2.5 bg-transparent text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Spinner className="w-6 h-6" />
                  ) : (
                    <SendIcon className="w-6 h-6" />
                  )}
                </button>
              </form>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;