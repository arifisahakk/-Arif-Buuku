'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext'; // We need to know who is logged in!

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  coverUrl?: string;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth(); // Pull the current user

  // 1. Listen to Firebase for the logged-in user's cart
  useEffect(() => {
    if (user) {
      const cartRef = ref(db, `users/${user.uid}/cart`);
      const unsubscribe = onValue(cartRef, (snapshot) => {
        const data = snapshot.val();
        setCart(data ? data : []); // If they have a cart, load it. If not, empty array.
      });
      return () => unsubscribe();
    } else {
      setCart([]); // Instantly clear the cart if no one is logged in
    }
  }, [user]);

  // Helper to update Firebase (which then automatically updates our local state)
  const updateFirebaseCart = async (newCart: CartItem[]) => {
    if (user) {
      await set(ref(db, `users/${user.uid}/cart`), newCart);
    } else {
      setCart(newCart); // Fallback for guest users before they log in
    }
  };

  const addToCart = (product: any) => {
    let newCart = [...cart];
    const existingItem = newCart.find((item) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newCart.push({ 
        id: product.id, title: product.title, price: product.price, 
        quantity: 1, coverUrl: product.coverUrl 
      });
    }
    
    updateFirebaseCart(newCart);
    // NOTICE: We removed setIsCartOpen(true) here! The drawer will stay hidden.
  };

  const removeFromCart = (id: string) => {
    const newCart = cart.filter(item => item.id !== id);
    updateFirebaseCart(newCart);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newCart = cart.map(item => item.id === id ? { ...item, quantity: newQuantity } : item);
    updateFirebaseCart(newCart);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, 
      cartCount, cartTotal, isCartOpen, openCart, closeCart 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};