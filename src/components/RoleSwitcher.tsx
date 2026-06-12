/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, ShoppingBag, Store, Sparkles, ArrowRightLeft } from 'lucide-react';
import { User } from '../types';

interface RoleSwitcherProps {
  currentRole: 'buyer' | 'seller' | 'admin';
  onRoleChange: (role: 'buyer' | 'seller' | 'admin') => void;
  currentUser: User;
  onUserSelect: (userId: string) => void;
  allUsers: User[];
  pendingReceiptsCount: number;
  pendingProductsCount: number;
}

export default function RoleSwitcher({
  currentRole,
  onRoleChange,
  currentUser,
  onUserSelect,
  allUsers,
  pendingReceiptsCount,
  pendingProductsCount
}: RoleSwitcherProps) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md text-slate-100 border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Banner Title */}
        <div className="flex items-center gap-2">
          <div className="bg-[#007DFE] p-1.5 rounded-xl shadow-lg shadow-blue-500/30">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-wide">MARKET PH</span>
            <span className="text-slate-400 ml-1">Sandbox Testing Suite</span>
          </div>
        </div>

        {/* User Simulator Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" />
            Testing Profile:
          </span>
          <select
            value={currentUser.id}
            onChange={(e) => onUserSelect(e.target.value)}
            className="bg-slate-800/65 border border-slate-700/50 text-slate-100 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100">
                {u.fullName} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-950/40 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onRoleChange('buyer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              currentRole === 'buyer'
                ? 'bg-[#007DFE] text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Buyer App
          </button>
          
          <button
            onClick={() => onRoleChange('seller')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              currentRole === 'seller'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Seller Hub
          </button>

          <button
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all relative ${
              currentRole === 'admin'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Panel
            {(pendingReceiptsCount > 0 || pendingProductsCount > 0) && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-bounce">
                {pendingReceiptsCount + pendingProductsCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Informative Sub-header */}
      <div className="bg-slate-950/65 backdrop-blur-md border-t border-slate-900/40 py-1 px-4 text-center text-[10px] text-slate-300 flex items-center justify-center gap-2 flex-wrap">
        <span className="font-bold text-[9px] text-yellow-500 uppercase tracking-widest px-1.5 py-0.5 bg-yellow-500/10 rounded mr-2">PH LOCALIZED</span>
        <span>🔥 GCash listing fee is <b>₱20</b>.</span>
        <span className="hidden md:inline text-white/20">|</span>
        <span>💬 Dynamic Gemini Smart-Replying AI simulates chat actions in <b>Taglish</b>.</span>
        <span className="hidden md:inline text-white/20">|</span>
        <span>📦 Supports local <b>Cash On Delivery (COD)</b> checkouts with status tracking.</span>
      </div>
    </div>
  );
}
