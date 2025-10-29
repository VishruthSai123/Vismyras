/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { VismyrasUser } from '../types/auth';
import UserMenu from './UserMenu';

interface HeaderProps {
  user?: VismyrasUser | null;
  onAuthClick?: () => void;
  onLogout?: () => void;
  onViewBilling?: () => void;
  onViewUsage?: () => void;
  onViewStyles?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onAuthClick, 
  onLogout, 
  onViewBilling, 
  onViewUsage,
  onViewStyles 
}) => {
  return (
    <header className="w-full h-16 flex items-center justify-between px-4 md:px-6 lg:px-8 bg-white border-b border-gray-200/80 shrink-0 z-40">
      {/* Logo */}
      <h1 className="text-2xl md:text-3xl font-serif tracking-widest text-gray-800 font-bold">
        Vismyras
      </h1>
      
      {/* Auth Button or Profile */}
      <div className="flex items-center">
        {user ? (
          onLogout && onViewBilling && onViewUsage && onViewStyles && (
            <UserMenu 
              user={user} 
              onLogout={onLogout} 
              onViewBilling={onViewBilling}
              onViewUsage={onViewUsage}
              onViewStyles={onViewStyles}
            />
          )
        ) : onAuthClick ? (
          <button
            onClick={onAuthClick}
            className="px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm md:text-base font-semibold rounded-full hover:from-purple-700 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            Sign In
          </button>
        ) : null}
      </div>
    </header>
  );
};

export default Header;