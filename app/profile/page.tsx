'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useRouter } from 'next/navigation';
import { ref, get, onValue } from 'firebase/database';
import { db } from '../../lib/firebase';
import { User as UserIcon, Mail, Calendar, Package, LogOut, Loader2, Clock, CheckCircle, Truck } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.uid) {
      // 1. Fetch User Profile Data
      get(ref(db, `users/${user.uid}`)).then((snapshot) => {
        if (snapshot.exists()) setUserData(snapshot.val());
      });

      // 2. Fetch User's Orders (Real-time listener so status updates instantly)
      const ordersRef = ref(db, 'orders');
      const unsubscribe = onValue(ordersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Filter to only show orders belonging to this specific user
          const userOrders = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .filter(order => order.userId === user.uid)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
          
          setOrders(userOrders);
        }
        setDbLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Helper to color-code statuses
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'waiting for approval': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-bold"><Clock className="w-3 h-3"/> Pending Approval</span>;
      case 'preparing': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-bold"><Package className="w-3 h-3"/> Preparing</span>;
      case 'arriving soon': return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full text-xs font-bold"><Truck className="w-3 h-3"/> Arriving Soon</span>;
      case 'delivered': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3"/> Delivered</span>;
      default: return <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (authLoading || dbLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">My Account</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Account Details */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Account Details</h2>
              <div className="space-y-4">
                <div><p className="text-xs font-medium text-slate-500 uppercase">Email Address</p><p className="text-sm font-semibold text-slate-900">{user.email}</p></div>
                <div><p className="text-xs font-medium text-slate-500 uppercase">Account Role</p><p className="text-sm font-semibold text-slate-900 capitalize">{userData?.role || 'Customer'}</p></div>
                <div><p className="text-xs font-medium text-slate-500 uppercase">Member Since</p><p className="text-sm font-semibold text-slate-900">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}</p></div>
              </div>
            </div>
          </div>

          {/* Right Column: Order History */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600" /> Order History
            </h2>
            
            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">No orders yet</h3>
                <p className="text-slate-500 text-sm mt-1 mb-6">When you make a purchase, tracking information will appear here.</p>
                <button onClick={() => router.push('/')} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors">Start Shopping</button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 font-mono mb-1">Order ID: {order.id}</p>
                        <p className="text-sm font-medium text-slate-900">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-slate-900">RM {order.totalAmount.toFixed(2)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="font-medium text-slate-900">{item.quantity}x</span> {item.title}
                          </div>
                          <span className="text-slate-500">RM {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}