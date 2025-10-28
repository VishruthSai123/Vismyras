/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  isOnDressingScreen?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isOnDressingScreen = false }) => {
  return (
    <footer className={`fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/60 p-3 z-50 ${isOnDressingScreen ? 'hidden sm:block' : ''}`}>
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-gray-600 max-w-7xl px-4">
        <p>
          Created by{' '}
          <a 
            href="https://x.com/vishruth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-gray-800 hover:underline"
          >
            @vishruth
          </a>
        </p>
        <span className="hidden sm:inline text-gray-400">•</span>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/privacy" className="text-gray-600 hover:text-purple-600 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-gray-400">•</span>
          <Link to="/terms" className="text-gray-600 hover:text-purple-600 hover:underline">
            Terms
          </Link>
          <span className="text-gray-400">•</span>
          <Link to="/refund" className="text-gray-600 hover:text-purple-600 hover:underline">
            Refund Policy
          </Link>
          <span className="text-gray-400">•</span>
          <Link to="/contact" className="text-gray-600 hover:text-purple-600 hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;