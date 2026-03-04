'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../lib/firebase';
import { useCart } from '../../../store/CartContext';
import { ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  stock: number;
  category: string;
  coverUrl: string;
  description: string;
}

export default function BookDetails() {
  const params = useParams();
  const router = useRouter();
  const { id } = params; // Gets the dynamic part of the URL
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;

    // Fetch ONLY the specific book using its ID
    const bookRef = ref(db, `books/${id}`);
    const unsubscribe = onValue(bookRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBook({ id: id as string, ...data });
      } else {
        setBook(null); // Book not found
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Book Not Found</h1>
        <p className="text-slate-500 mb-6">The item you are looking for does not exist.</p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 lg:p-12">
            
            {/* Left Side: Large Cover Image */}
            <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden relative shadow-inner">
              <img 
                src={book.coverUrl} 
                alt={book.title} 
                className="w-full h-full object-cover"
              />
              {book.stock === 0 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="font-bold text-slate-900 text-2xl px-6 py-3 bg-white rounded-lg shadow-lg">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Right Side: Book Information */}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">
                {book.category}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-slate-500 mb-6">by {book.author}</p>
              
              <div className="flex items-end gap-4 mb-8 pb-8 border-b border-slate-100">
                <span className="text-4xl font-black text-slate-900">
                  RM {book.price.toFixed(2)}
                </span>
                {book.stock > 0 && book.stock < 10 && (
                  <span className="text-sm font-medium text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full mb-1">
                    Only {book.stock} left
                  </span>
                )}
              </div>

              <div className="mb-8 flex-grow">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Synopsis</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              </div>

              {/* Action Area */}
              <button 
                onClick={() => addToCart(book)}
                disabled={book.stock === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="w-5 h-5" /> 
                {book.stock === 0 ? 'Unavailable' : 'Add to Cart'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}