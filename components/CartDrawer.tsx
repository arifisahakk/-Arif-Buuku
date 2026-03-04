'use client';

import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../store/CartContext';

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, removeFromCart, updateQuantity, cartTotal } = useCart();

  // If the cart is closed, don't render the overlay block at all
  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Dark semi-transparent backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart} // Clicking outside the drawer closes it
      ></div>

      {/* The White Sliding Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Your Cart
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <ShoppingBag className="w-16 h-16 text-slate-200" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {/* Thumbnail placeholder or image */}
                <div className="w-16 h-20 bg-slate-200 rounded object-cover overflow-hidden flex-shrink-0">
                   {item.coverUrl ? (
                     <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-[10px] text-slate-400 flex h-full items-center justify-center">No Img</span>
                   )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
                    <p className="text-sm font-bold text-indigo-600 mt-1">RM {item.price.toFixed(2)}</p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        className="text-slate-700 hover:text-indigo-600 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      
                      {/* Added text-slate-900 so the number is completely black/visible */}
                      <span className="text-xs font-bold w-4 text-center text-slate-900">
                        {item.quantity}
                      </span>
                      
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="text-slate-700 hover:text-indigo-600 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer (Checkout) */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-slate-900">RM {cartTotal.toFixed(2)}</span>
            </div>
            <button className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-indigo-600 transition-colors shadow-md">
              Proceed to Checkout
            </button>
          </div>
        )}

      </div>
    </div>
  );
}