import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  useEffect(() => {
    if (profile) {
      supabase
        .from('wishlist_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .then(({ count }) => setWishlistCount(count ?? 0));
    } else {
      setWishlistCount(0);
    }
  }, [profile, location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-stone-900 text-stone-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <p>Free shipping on orders over $100</p>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/admin/login" className="hover:text-white transition-colors">
              Admin Portal
            </Link>
            <span className="text-stone-600">|</span>
            <a href="tel:+15550100" className="hover:text-white transition-colors">
              +1 555 0100
            </a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-stone-900 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-amber-400" />
              </div>
              <span className="text-xl font-bold text-stone-900 tracking-tight">
                Kamini<span className="text-amber-500"> Bag House</span>
              </span>
            </Link>

            {/* Search - desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for bags..."
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900">
                  <Search size={18} />
                </button>
              </div>
            </form>

            {/* Right icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* User */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <User size={20} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-20">
                      {profile ? (
                        <>
                          <div className="px-4 py-2 border-b border-stone-100">
                            <p className="text-sm font-medium text-stone-900 truncate">{profile.name}</p>
                            <p className="text-xs text-stone-500 truncate">{profile.role === 'admin' ? 'Administrator' : 'Customer'}</p>
                          </div>
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                            My Profile
                          </Link>
                          <Link to="/profile/orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                            My Orders
                          </Link>
                          <Link to="/profile/wishlist" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                            Wishlist
                          </Link>
                          {profile.role === 'admin' && (
                            <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                              Admin Dashboard
                            </Link>
                          )}
                          <button
                            onClick={() => { signOut(); setUserMenuOpen(false); navigate('/'); }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to="/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                            Sign In
                          </Link>
                          <Link to="/register" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                            Create Account
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Wishlist */}
              <Link to="/profile/wishlist" className="relative w-10 h-10 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative w-10 h-10 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Category nav - desktop */}
          <nav className="hidden md:flex items-center gap-6 h-12 border-t border-stone-100">
            <Link to="/shop" className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors">
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for bags..."
                    className="w-full pl-4 pr-10 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Search size={18} />
                  </button>
                </div>
              </form>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/shop" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-stone-900 py-2 px-3 rounded-lg bg-stone-50">
                  All Products
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-stone-700 py-2 px-3 rounded-lg bg-stone-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
