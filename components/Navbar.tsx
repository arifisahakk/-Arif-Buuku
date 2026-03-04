'use client';

import { ShoppingCart, Library, User as UserIcon, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth(); // Pull in the user state
  const { cartCount, openCart } = useCart(); 

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Library className="w-6 h-6 text-indigo-600" />
            'Arif's Buuku
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-6">
            
            {/* Conditional Auth UI */}
            {user ? (
              <div className="flex items-center gap-4">
                
                {/* ADMIN ONLY LINK */}
                {user.email === "arif@gmail.com" && (
                  <Link href="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded">
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
                
                {/* Profile Link instead of static text */}
                <Link 
                  href="/profile" 
                  className="text-sm font-medium text-slate-700 hover:text-indigo-600 hidden sm:flex items-center gap-2 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-50"
                >
                  <UserIcon className="w-4 h-4" />
                  {user.email}
                </Link>
                <button 
                  onClick={logout}
                  className="text-slate-500 hover:text-red-600 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // Add 'items-center' to the div below:
              <div className="flex items-center gap-4"> 
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="text-sm font-medium bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-indigo-600 transition-colors">
                  Sign up
                </Link>
              </div>
            )}

            {/* Cart Icon */}
            <button 
              onClick={openCart}
              className="relative p-1 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
               <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-white">
                 {cartCount}
               </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}