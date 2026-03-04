'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  coverUrl?: string; // Adding this to show images in the cart
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

  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { 
        id: product.id, 
        title: product.title, 
        price: product.price, 
        quantity: 1,
        coverUrl: product.coverUrl 
      }];
    });
    setIsCartOpen(true); // Automatically open the drawer when an item is added!
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Prevent quantity from going below 1
    setCart((prevCart) => 
      prevCart.map(item => item.id === id ? { ...item, quantity: newQuantity } : item)
    );
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