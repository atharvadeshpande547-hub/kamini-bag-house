import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  ScanLine,
  Ticket,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Store,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', path: '/admin/products', icon: Package },
      { label: 'Categories', path: '/admin/categories', icon: FolderTree },
      { label: 'Inventory', path: '/admin/inventory', icon: Boxes },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
      { label: 'Customers', path: '/admin/customers', icon: Users },
      { label: 'Sales Analytics', path: '/admin/sales', icon: BarChart3 },
      { label: 'Offline Sales', path: '/admin/offline-sales', icon: ScanLine },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
      { label: 'Reviews', path: '/admin/reviews', icon: Star },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSignOut = () => {
    signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - desktop */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#1a2433] text-slate-300 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo area */}
        <div className="px-5 py-4 border-b border-slate-700/50">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#ff9900] rounded-lg flex items-center justify-center shrink-0">
              <Store size={20} className="text-[#1a2433]" />
            </div>
            <div>
              <span className="text-base font-bold text-white block leading-tight">Kamini Bag House</span>
              <span className="text-[11px] text-slate-400">Admin Portal</span>
            </div>
          </Link>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-[#ff9900] text-[#1a2433] shadow-sm'
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <item.icon size={17} className={active ? 'shrink-0' : 'shrink-0'} /> {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-[#ff9900] flex items-center justify-center text-[#1a2433] font-bold text-sm shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
              <p className="text-[11px] text-slate-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/50 transition-colors"
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - Amazon style */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-slate-700 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl hidden md:flex">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders, products, customers..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff9900] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative w-10 h-10 flex items-center justify-center text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell size={19} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff9900] rounded-full ring-2 ring-white" />
            </button>
            <Link
              to="/"
              className="text-sm text-slate-600 hover:text-[#ff9900] font-medium hidden sm:block transition-colors"
            >
              View Store
            </Link>
            <div className="w-9 h-9 rounded-full bg-[#1a2433] flex items-center justify-center text-white font-semibold text-sm">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
