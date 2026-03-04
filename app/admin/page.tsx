'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useRouter } from 'next/navigation';
import { ref, push, set, onValue, update, remove } from 'firebase/database';
import { db } from '../../lib/firebase';
import { Shield, Plus, Package, Loader2, Users, BookOpen, Edit2, X } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State for Navigation and Data
  const [activeTab, setActiveTab] = useState<'books' | 'users'>('books');
  const [books, setBooks] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  
  // 🛑 SECURITY CHECK
  const ADMIN_EMAIL = "arif@gmail.com"; 

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const emptyForm = { title: '', author: '', price: '', stock: '', category: 'computing', coverUrl: '', description: '' };
  const [formData, setFormData] = useState(emptyForm);

  // Auth Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.email !== ADMIN_EMAIL) router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch Inventory and Users
  useEffect(() => {
    // Fetch Books
    const booksRef = ref(db, 'books');
    const unsubscribeBooks = onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setBooks(Object.keys(data).map(key => ({ id: key, ...data[key] })));
    });

    // Fetch Users
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setUsersList(Object.keys(data).map(key => ({ id: key, ...data[key] })));
    });

    return () => {
      unsubscribeBooks();
      unsubscribeUsers();
    };
  }, []);

  // Handle Add OR Update Book
  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category: formData.category,
        coverUrl: formData.coverUrl,
        description: formData.description
      };

      if (editingBookId) {
        // UPDATE Existing Book
        await update(ref(db, `books/${editingBookId}`), bookData);
        alert("Book updated successfully!");
      } else {
        // ADD New Book
        const newBookRef = push(ref(db, 'books'));
        await set(newBookRef, bookData);
        alert("Book added successfully!");
      }

      setFormData(emptyForm);
      setEditingBookId(null);
    } catch (error) {
      console.error("Error saving book: ", error);
      alert("Failed to save book.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Populate form for editing
  const startEditing = (book: any) => {
    setFormData({
      title: book.title, author: book.author, price: book.price.toString(), 
      stock: book.stock.toString(), category: book.category, 
      coverUrl: book.coverUrl, description: book.description
    });
    setEditingBookId(book.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to the form
  };

  const cancelEditing = () => {
    setFormData(emptyForm);
    setEditingBookId(null);
  };

  if (authLoading || !user || user.email !== ADMIN_EMAIL) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex min-h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <Shield className="w-8 h-8 text-indigo-500" />
          <span className="text-white font-bold text-lg">Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('books')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'books' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <BookOpen className="w-5 h-5" /> Manage Books
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-5 h-5" /> Manage Users
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        
        {/* Books Tab View */}
        {activeTab === 'books' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            
            {/* Form Column */}
            <div className="xl:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {editingBookId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                  {editingBookId ? 'Edit Book' : 'Add New Book'}
                </h2>
                {editingBookId && (
                  <button onClick={cancelEditing} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmitBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                  <input required type="text" placeholder="e.g., Clean Code" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-indigo-500 text-sm text-slate-900 placeholder:text-slate-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Author</label>
                  <input required type="text" placeholder="e.g., Robert C. Martin" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-indigo-500 text-sm text-slate-900 placeholder:text-slate-500 bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Price (RM)</label>
                    <input required type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-indigo-500 text-sm text-slate-900 placeholder:text-slate-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Stock</label>
                    <input required type="number" placeholder="10" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-indigo-500 text-sm text-slate-900 placeholder:text-slate-500 bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-indigo-500 text-sm text-slate-900 bg-white">
                    <option value="computing">Computing & Tech</option>
                    <option value="fiction">Fiction</option>
                    <option value="productivity">Productivity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cover Image URL</label>
                  <input required type="url" placeholder="https://..." value={formData.coverUrl} onChange={e => setFormData({...formData, coverUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-indigo-500 text-sm text-slate-900 placeholder:text-slate-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <textarea required rows={3} placeholder="Book description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-indigo-500 text-sm text-slate-900 placeholder:text-slate-500 bg-white"></textarea>
                </div>
                <button disabled={isSubmitting} type="submit" className={`w-full text-white font-medium py-2 rounded transition-colors disabled:opacity-50 ${editingBookId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-indigo-600'}`}>
                  {isSubmitting ? 'Saving...' : editingBookId ? 'Update Book' : 'Save Book to Catalog'}
                </button>
              </form>
            </div>

            {/* Table Column */}
            <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" /> Current Inventory
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Book</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {books.map((book) => (
                      <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900 line-clamp-1">{book.title}</div>
                          <div className="text-xs text-slate-500">{book.author}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">RM {book.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{book.stock}</td>
                        <td className="px-4 py-3 text-sm">
                          {book.stock > 10 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">In Stock</span>
                          ) : book.stock > 0 ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Low Stock</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Out of Stock</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => startEditing(book)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center justify-end gap-1 ml-auto"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab View */}
        {activeTab === 'users' && (
          <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Registered Customers
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {usersList.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-sm text-slate-500">No users found in database yet. (Users who signed up before this update won't appear here).</td></tr>
                  ) : (
                    usersList.map((userNode) => (
                      <tr key={userNode.id}>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{userNode.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{userNode.email}</td>
                        <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{userNode.role || 'customer'}</span></td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {userNode.createdAt ? new Date(userNode.createdAt).toLocaleDateString() : 'Unknown'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}