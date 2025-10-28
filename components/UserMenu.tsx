/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Settings, CreditCard, BarChart3, Sparkles } from 'lucide-react';
import { VismyrasUser } from '../types/auth';

interface UserMenuProps {
  user: VismyrasUser;
  onLogout: () => void;
  onViewBilling: () => void;
  onViewUsage: () => void;
  onViewStyles: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onViewBilling, onViewUsage, onViewStyles }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const initials = user.profile.full_name
    ? user.profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.profile.email[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {user.profile.avatar_url ? (
          <img
            src={user.profile.avatar_url}
            alt={user.profile.full_name || 'User'}
            className="w-9 h-9 rounded-full object-cover border-2 border-purple-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {user.profile.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt={user.profile.full_name || 'User'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {user.profile.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{user.profile.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onViewStyles();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Sparkles size={18} />
                <span className="font-medium">Your Styles</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onViewUsage();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <BarChart3 size={18} />
                <span className="font-medium">Usage</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onViewBilling();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <CreditCard size={18} />
                <span className="font-medium">Billing & Subscription</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
