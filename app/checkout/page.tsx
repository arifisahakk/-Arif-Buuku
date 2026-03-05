'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { useRouter } from 'next/navigation';
import { ref, push, set } from 'firebase/database';
import { db } from '../../lib/firebase';
import { CheckCircle, CreditCard, Package, ArrowLeft, Loader2, Square, CheckSquare, Plus, Minus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  // We need updateQuantity and removeFromCart here now!
  const { cart, updateQuantity, removeFromCart } = useCart(); 
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (cart.length > 0 && !hasInitialized) {
      setSelectedItemIds(cart.map(item => item.id));
      setHasInitialized(true);
    }
  }, [cart, hasInitialized]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const selectedItems = cart.filter(item => selectedItemIds.includes(item.id));
  const selectedTotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const handleConfirmOrder = async () => {
    if (!user || selectedItems.length === 0) return;
    setIsProcessing(true);

    try {
      const newOrderRef = push(ref(db, 'orders'));
      await set(newOrderRef, {
        userId: user.uid,
        userEmail: user.email,
        items: selectedItems,
        totalAmount: selectedTotal,
        status: 'waiting for approval',
        stockDecremented: false,
        createdAt: new Date().toISOString()
      });

      const remainingCartItems = cart.filter(item => !selectedItemIds.includes(item.id));
      await set(ref(db, `users/${user.uid}/cart`), remainingCartItems);

      setOrderSuccess(true);
    } catch (error) {
      alert("There was an issue processing your order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-slate-500 mb-8">Your transaction was successful. We are waiting for admin approval.</p>
          <div className="space-y-3">
            <Link href="/profile" className="block w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-indigo-600 transition-colors">View Order Status</Link>
            <Link href="/" className="block w-full text-slate-600 font-medium py-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>

        <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-indigo-600" /> Secure Checkout
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-900">Your cart is empty</h2>
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium mt-4 inline-block">Browse Books</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Order Summary</h2>
              <p className="text-sm text-slate-500 mb-6">Select items and adjust quantities before confirming.</p>
              
              <div className="space-y-4">
                {cart.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => toggleItemSelection(item.id)}
                      className={`p-4 rounded-xl border transition-colors cursor-pointer ${isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex gap-4">
                        {/* Checkbox */}
                        <div className={`mt-1 text-${isSelected ? 'indigo-600' : 'slate-300'}`}>
                          {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                        </div>

                        {/* Image */}
                        <div className="w-16 h-20 bg-slate-200 rounded object-cover overflow-hidden flex-shrink-0">
                          {item.coverUrl ? (
                            <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-400 flex h-full items-center justify-center">No Img</span>
                          )}
                        </div>

                        {/* Details & Interactive Controls */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className={`font-semibold text-sm line-clamp-1 ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{item.title}</h3>
                            <p className={`font-bold mt-1 ${isSelected ? 'text-indigo-700' : 'text-indigo-600'}`}>RM {item.price.toFixed(2)}</p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Adjuster - Using e.stopPropagation() so clicking + doesn't uncheck the box! */}
                            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                              <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }} className="text-slate-700 hover:text-indigo-600 transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center text-slate-900">{item.quantity}</span>
                              <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }} className="text-slate-700 hover:text-indigo-600 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            
                            {/* Delete Button */}
                            <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-red-500 hover:text-red-700 p-1 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-medium text-slate-500">Total for {selectedItems.length} items</span>
                <span className="text-3xl font-black text-slate-900">RM {selectedTotal.toFixed(2)}</span>
              </div>

              <button 
                onClick={handleConfirmOrder}
                disabled={isProcessing || selectedItems.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><CheckCircle className="w-5 h-5" /> Confirm & Pay</>}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}