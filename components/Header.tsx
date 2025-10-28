/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full h-16 flex items-center px-4 md:px-6 bg-white border-b border-gray-200/80 shrink-0 z-40">
        <h1 className="text-3xl font-serif tracking-widest text-gray-800">
          Vismyras
        </h1>
    </header>
  );
};

export default Header;