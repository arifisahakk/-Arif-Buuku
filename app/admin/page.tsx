'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useRouter } from 'next/navigation';
import { ref, push, set, onValue, update, remove, get } from 'firebase/database'; // Added get
import { db } from '../../lib/firebase';
import { Shield, Plus, Package, Loader2, Users, BookOpen, Edit2, X, Trash2, ShoppingCart, Truck, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  // 1. Add 'logout' to this line:
  const { user, loading: authLoading, logout } = useAuth(); 
  const router = useRouter();
  
  // 2. Add this new function right below router:
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // ... (keep the rest of your state variables the same)
  
  const [activeTab, setActiveTab] = useState<'books' | 'users' | 'orders'>('books');
  const [books, setBooks] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  // 🛑 SECURITY CHECK
  const ADMIN_EMAIL = "arif@gmail.com"; 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const emptyForm = { title: '', author: '', price: '', stock: '', category: 'computing', coverUrl: '', description: '' };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    const unsubBooks = onValue(ref(db, 'books'), (snap) => {
      if (snap.val()) setBooks(Object.keys(snap.val()).map(key => ({ id: key, ...snap.val()[key] })));
    });
    const unsubUsers = onValue(ref(db, 'users'), (snap) => {
      if (snap.val()) setUsersList(Object.keys(snap.val()).map(key => ({ id: key, ...snap.val()[key] })));
    });
    const unsubOrders = onValue(ref(db, 'orders'), (snap) => {
      if (snap.val()) {
        const sortedOrders = Object.keys(snap.val())
          .map(key => ({ id: key, ...snap.val()[key] }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(sortedOrders);
      }
    });
    return () => { unsubBooks(); unsubUsers(); unsubOrders(); };
  }, []);

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const bookData = {
        title: formData.title, author: formData.author, price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10), category: formData.category, coverUrl: formData.coverUrl, description: formData.description
      };
      if (editingBookId) {
        await update(ref(db, `books/${editingBookId}`), bookData);
      } else {
        await set(push(ref(db, 'books')), bookData);
      }
      setFormData(emptyForm); setEditingBookId(null);
    } catch (error) { alert("Failed to save book."); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteBook = async (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) await remove(ref(db, `books/${id}`));
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (window.confirm(`Delete user database record for ${email}?`)) await remove(ref(db, `users/${userId}`));
  };

  // --- NEW: Real-time Stock Decrement Logic ---
  const handleUpdateOrderStatus = async (order: any, newStatus: string) => {
    try {
      // If moving to 'preparing' and stock hasn't been deducted yet
      if (newStatus === 'preparing' && !order.stockDecremented) {
        for (const item of order.items) {
          const bookRef = ref(db, `books/${item.id}`);
          const snapshot = await get(bookRef);
          
          if (snapshot.exists()) {
            const currentStock = snapshot.val().stock || 0;
            // Prevent negative stock
            const newStock = Math.max(0, currentStock - item.quantity); 
            await update(bookRef, { stock: newStock });
          }
        }
        
        // Update order status AND mark stock as decremented so it doesn't double-deduct
        await update(ref(db, `orders/${order.id}`), { 
          status: newStatus,
          stockDecremented: true 
        });
        
      } else {
        // Otherwise, just update the status normally
        await update(ref(db, `orders/${order.id}`), { status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status.");
    }
  };

  if (authLoading || !user || user.email !== ADMIN_EMAIL) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Responsive Slide-Out Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 -translate-x-[248px] hover:translate-x-0 md:relative md:translate-x-0 md:min-h-screen md:sticky md:top-0 shadow-2xl md:shadow-none border-r-8 border-indigo-600 md:border-none">
        
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <Shield className="w-8 h-8 text-indigo-500 flex-shrink-0" />
          <span className="text-white font-bold text-lg whitespace-nowrap">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-hidden">
          <button onClick={() => setActiveTab('books')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'books' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}><BookOpen className="w-5 h-5 flex-shrink-0" /> Manage Books</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}><Truck className="w-5 h-5 flex-shrink-0" /> Manage Orders</button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}><Users className="w-5 h-5 flex-shrink-0" /> Manage Users</button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors font-medium whitespace-nowrap"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        
        {/* --- TAB: MANAGE BOOKS --- */}
        {activeTab === 'books' && (
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
             
             {/* FIX: Changed 'sticky' to 'xl:sticky' so it stops overlapping on split screens */}
             <div className="xl:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit xl:sticky xl:top-8 self-start">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                   {editingBookId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-indigo-600" />} {editingBookId ? 'Edit Book' : 'Add New Book'}
                 </h2>
                 {editingBookId && <button onClick={() => {setFormData(emptyForm); setEditingBookId(null);}} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>}
               </div>
               <form onSubmit={handleSubmitBook} className="space-y-4">
                  <input required type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white" />
                  <input required type="text" placeholder="Author" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="number" step="0.01" placeholder="Price (RM)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white" />
                    <input required type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white" />
                  </div>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white"><option value="computing">Computing</option><option value="fiction">Fiction</option><option value="productivity">Productivity</option></select>
                  <input required type="url" placeholder="Cover Image URL" value={formData.coverUrl} onChange={e => setFormData({...formData, coverUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white" />
                  <textarea required rows={3} placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white"></textarea>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-medium py-2 rounded hover:bg-indigo-600 transition-colors">{isSubmitting ? 'Saving...' : 'Save Book'}</button>
               </form>
             </div>
             
             {/* Inventory Table */}
             <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-600" /> Inventory</h2>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-200">
                   <thead><tr><th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Book</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock</th><th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th></tr></thead>
                   <tbody className="divide-y divide-slate-200">
                     {books.map(book => (
                       <tr key={book.id}>
                         <td className="px-4 py-3"><div className="text-sm font-medium text-slate-900">{book.title}</div><div className="text-xs text-slate-500">RM {book.price.toFixed(2)}</div></td>
                         <td className="px-4 py-3 text-sm text-slate-900 font-bold">{book.stock}</td>
                         <td className="px-4 py-3 text-right">
                           <button onClick={() => {setFormData({title: book.title, author: book.author, price: book.price.toString(), stock: book.stock.toString(), category: book.category, coverUrl: book.coverUrl, description: book.description}); setEditingBookId(book.id); window.scrollTo(0,0);}} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mr-3 transition-colors"><Edit2 className="w-4 h-4 inline" /> Edit</button>
                           <button onClick={() => handleDeleteBook(book.id, book.title)} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"><Trash2 className="w-4 h-4 inline" /> Delete</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           </div>
        )}

        {/* TAB: MANAGE ORDERS */}
        {activeTab === 'orders' && (
          <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-600" /> Customer Orders</h2>
            <div className="space-y-4">
              {orders.length === 0 ? <p className="text-slate-500">No orders placed yet.</p> : orders.map(order => (
                <div key={order.id} className="border border-slate-200 p-4 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{order.userEmail}</p>
                      <p className="text-xs text-slate-500 font-mono">ID: {order.id} • {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">RM {order.totalAmount.toFixed(2)}</span>
                      {/* FIX: Pass entire order object so we can read its items and stock status */}
                      <select 
                        value={order.status} 
                        onChange={(e) => handleUpdateOrderStatus(order, e.target.value)}
                        className="p-1.5 text-sm border border-slate-300 rounded font-medium bg-white text-indigo-700 cursor-pointer"
                      >
                        <option value="waiting for approval">Waiting for Approval</option>
                        <option value="preparing">Preparing</option>
                        <option value="arriving soon">Arriving Soon</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    {order.items.map((item: any) => (
                      <span key={item.id} className="mr-4 bg-white px-2 py-1 rounded border border-slate-200 text-xs inline-block mb-1">
                        {item.quantity}x {item.title}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: MANAGE USERS */}
        {activeTab === 'users' && (
          <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Registered Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead><tr><th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Current Cart</th><th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {usersList.map(userNode => (
                    <tr key={userNode.id}>
                      <td className="px-4 py-3"><div className="text-sm font-medium text-slate-900">{userNode.email}</div><div className="text-xs text-slate-500">Joined: {userNode.createdAt ? new Date(userNode.createdAt).toLocaleDateString() : 'N/A'}</div></td>
                      <td className="px-4 py-3">
                        {userNode.cart ? (
                           <div className="flex flex-col gap-1 text-xs">
                             {userNode.cart.map((item: any) => (
                               <span key={item.id} className="text-slate-600"><ShoppingCart className="w-3 h-3 inline mr-1 text-indigo-400"/> {item.quantity}x {item.title}</span>
                             ))}
                           </div>
                        ) : <span className="text-xs text-slate-400">Cart is empty</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {userNode.email !== ADMIN_EMAIL && (
                          <button onClick={() => handleDeleteUser(userNode.id, userNode.email)} className="text-red-500 hover:text-red-700 text-sm font-medium"><Trash2 className="w-4 h-4 inline" /> Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}