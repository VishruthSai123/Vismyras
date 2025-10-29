/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface FooterProps {
  show?: boolean;
}

const Footer: React.FC<FooterProps> = ({ show = false }) => {
  if (!show) return null;

  return (
    <footer className="relative sm:fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200/80 py-4 z-30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left - Brand */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Sparkles size={16} className="text-purple-500" />
            <span className="font-serif font-semibold text-gray-800">Vismyras</span>
            <span className="hidden sm:inline text-gray-400">•</span>
            <span className="hidden sm:inline">Visualize Your Style</span>
          </div>
          
          {/* Center - Creator */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Made with</span>
            <Heart size={14} className="text-red-500 fill-red-500" />
            <span>by</span>
            <a 
              href="https://www.instagram.com/vishruth_sai_7" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              @ T.Vishruth Sai
            </a>
          </div>
          
          {/* Right - Year */}
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;