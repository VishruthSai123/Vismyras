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

            <footer className="p-4 border-t bg-gray-50 shrink-0">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="flex-grow bg-white border border-gray-300 rounded-lg p-2 flex flex-col">
                  {imagePreview && (
                    <div className="relative w-20 h-20 mb-2 self-start">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                      <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="e.g., add a pair of sunglasses..."
                      rows={1}
                      className="w-full resize-none border-none focus:ring-0 p-0 text-gray-800 placeholder-gray-400 bg-transparent"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="chat-image-upload" accept="image/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-3 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors self-end">
                  <PaperclipIcon className="w-6 h-6" />
                </button>
                <button type="submit" disabled={isLoading || (!text.trim() && !imageFile)} className="p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12 self-end">
                  {isLoading ? <Spinner className="w-6 h-6 text-white" /> : <SendIcon className="w-6 h-6" />}
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