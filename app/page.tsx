'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { ShoppingCart, BookOpen, Search} from 'lucide-react'; // <-- Imported Search icon
import Navbar from '../components/Navbar';
import { useCart } from '../store/CartContext';
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

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Add new state for the search query
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addToCart } = useCart();

  useEffect(() => {
    const booksRef = ref(db, 'books');
    const unsubscribe = onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const booksArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setBooks(booksArray);
      } else {
        setBooks([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Create a filtered list based on the search query
  // This checks if the search text is inside the title OR the author's name
  const filteredBooks = books.filter((book) => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-semibold text-slate-600 animate-pulse flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> Loading catalog...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 px-8 text-center">
        <h1 className="text-5xl font-bold mb-4">'Arif's Buuku</h1>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
          Your premier destination for computing texts, modern fiction, and tools for growth.
        </p>

        {/* 3. The Search Bar UI */}
        <div className="max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 rounded-full border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg text-slate-900 placeholder:text-slate-500 bg-white shadow-sm transition-all"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Product Catalog */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {searchQuery ? 'Search Results' : 'Featured Books'}
          </h2>
          <span className="text-sm text-slate-500">{filteredBooks.length} items found</span>
        </div>

        {/* 4. Display the Filtered Books instead of all books */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No books found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredBooks.map((book) => (
              <div 
                key={book.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                {/* 1. Wrap the top part in a Link */}
                <Link href={`/book/${book.id}`} className="flex flex-col flex-grow">
                  
                  {/* Book Cover */}
                  <div className="h-64 w-full bg-slate-200 overflow-hidden relative">
                    <img 
                      src={book.coverUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {book.stock < 10 && book.stock > 0 && (
                      <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                        Only {book.stock} left
                      </span>
                    )}
                    {book.stock === 0 && (
                      <span className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center font-bold text-slate-800 text-lg">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Book Details */}
                  <div className="p-5 flex flex-col flex-grow">
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                      {book.category}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1 line-clamp-2 hover:text-indigo-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">
                      {book.author}
                    </p>
                  </div>
                </Link>

                {/* 2. Keep the Price & Button outside the Link so clicking 'Add' doesn't change the page */}
                <div className="px-5 pb-5 mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xl font-bold text-slate-900">
                    RM {book.price.toFixed(2)}
                  </span>
                  <button 
                    onClick={() => addToCart(book)}
                    disabled={book.stock === 0}
                    className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}