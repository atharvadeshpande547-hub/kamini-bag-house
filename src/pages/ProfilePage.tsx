import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Heart, MapPin, LogOut, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Order, WishlistItem, Product } from '@/types';
import { formatCurrency, formatDate, finalPrice } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProductCard from '@/components/ProductCard';
import AddressManager from '@/components/address/AddressManager';

type Tab = 'profile' | 'orders' | 'wishlist' | 'addresses';
type Notice = { text: string; isError: boolean } | null;

const CANCELLABLE_STATUSES = ['Order Placed', 'Confirmed'];

export default function ProfilePage() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [name, setName] = useState(profile?.name ?? '');
  const [newPass, setNewPass] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as Order[]) ?? []));

    supabase
      .from('wishlist_items')
      .select('*, product:products(*)')
      .eq('user_id', session.user.id)
      .then(({ data }) => setWishlist((data as WishlistItem[]) ?? []));
  }, [session, navigate]);

  if (!session || !profile) return null;

  const showNotice = (text: string, isError = false) => {
    setNotice({ text, isError });
    setTimeout(() => setNotice(null), 3000);
  };

  const updateProfile = async () => {
    if (name.trim().length < 2) {
      showNotice('Please enter your full name', true);
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', session.user.id);
    if (error) {
      showNotice('Could not update your profile. Please try again.', true);
      return;
    }
    await refreshProfile();
    showNotice('Profile updated successfully');
  };

  const changePassword = async () => {
    if (newPass.length < 6) {
      showNotice('Password must be at least 6 characters', true);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    showNotice(error ? error.message : 'Password changed successfully', !!error);
    setNewPass('');
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.rpc('cancel_own_order', { p_order_id: orderId });
    if (error) {
      showNotice('This order could not be cancelled. Please try again.', true);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' } : o)));
  };

  const moveToCart = async (productId: string, product: Product | null) => {
    if (!product) return;
    await supabase.from('cart_items').insert({
      user_id: session.user.id,
      product_id: productId,
      quantity: 1,
      color: product.colors[0] ?? '',
      size: product.sizes[0] ?? '',
    });
    await supabase.from('wishlist_items').delete().eq('user_id', session.user.id).eq('product_id', productId);
    setWishlist((prev) => prev.filter((w) => w.product_id !== productId));
    showNotice('Moved to cart!');
  };

  const removeWishlist = async (productId: string) => {
    await supabase.from('wishlist_items').delete().eq('user_id', session.user.id).eq('product_id', productId);
    setWishlist((prev) => prev.filter((w) => w.product_id !== productId));
  };

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'profile', label: 'My Profile', icon: User },
    { key: 'orders', label: 'My Orders', icon: Package },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-white font-semibold text-lg">
                {profile.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 truncate">{profile.name}</p>
                <p className="text-xs text-stone-500 truncate">{session.user.email}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <t.icon size={18} /> {t.label}
                </button>
              ))}
              <button
                onClick={() => { signOut(); navigate('/'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="md:col-span-3">
          {notice && (
            <div
              className={`text-sm rounded-lg px-4 py-3 mb-4 border ${
                notice.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
              }`}
            >
              {notice.text}
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-xl p-6">
                <h2 className="font-semibold text-stone-900 mb-4">Edit Profile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
                    <input value={session.user.email ?? ''} disabled className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Mobile Number</label>
                    <input value={profile.phone} disabled className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-500" />
                    <p className="text-xs text-stone-500 mt-1.5">Your mobile number cannot be changed here.</p>
                  </div>
                  <Button onClick={updateProfile}>Save Changes</Button>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-6">
                <h2 className="font-semibold text-stone-900 mb-4">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">New Password</label>
                    <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400" placeholder="••••••••" />
                  </div>
                  <Button variant="outline" onClick={changePassword}>Update Password</Button>
                </div>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-stone-900 text-lg mb-2">My Orders</h2>
              {orders.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
                  <Package size={40} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500">You haven't placed any orders yet.</p>
                  <Link to="/shop" className="text-amber-600 hover:text-amber-700 text-sm font-medium mt-2 inline-block">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-white border border-stone-200 rounded-xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <p className="font-semibold text-stone-900">{order.order_number}</p>
                        <p className="text-xs text-stone-500">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge color={order.status === 'Delivered' ? 'green' : order.status === 'Cancelled' ? 'red' : 'amber'}>
                          {order.status}
                        </Badge>
                        <Badge color={order.payment_status === 'Paid' ? 'green' : order.payment_status === 'Pending' ? 'amber' : 'stone'}>
                          {order.payment_method === 'COD' ? 'Cash on Delivery' : order.payment_method}: {order.payment_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 pb-2 border-b border-stone-50 last:border-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-50 shrink-0">
                            {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-stone-500">Qty: {item.quantity} {item.color && `| ${item.color}`} {item.size && `| ${item.size}`}</p>
                          </div>
                          <span className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    {order.shipping_address && (
                      <p className="text-xs text-stone-500 mt-3">
                        Delivering to: {[order.shipping_address, order.shipping_city, order.shipping_state, order.shipping_zip].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                      <span className="text-sm text-stone-500">Total: <span className="font-bold text-stone-900 text-base">{formatCurrency(order.total)}</span></span>
                      {CANCELLABLE_STATUSES.includes(order.status) && (
                        <Button variant="outline" size="sm" onClick={() => cancelOrder(order.id)}>Cancel Order</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'wishlist' && (
            <div>
              <h2 className="font-semibold text-stone-900 text-lg mb-4">My Wishlist</h2>
              {wishlist.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
                  <Heart size={40} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500">Your wishlist is empty.</p>
                  <Link to="/shop" className="text-amber-600 hover:text-amber-700 text-sm font-medium mt-2 inline-block">
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((w) => (
                    <div key={w.id} className="relative">
                      <ProductCard product={w.product!} />
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" fullWidth onClick={() => moveToCart(w.product_id, w.product ?? null)}>
                          <ShoppingBag size={14} /> Move to Cart
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => removeWishlist(w.product_id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'addresses' && <AddressManager userId={session.user.id} />}
        </div>
      </div>
    </div>
  );
}
