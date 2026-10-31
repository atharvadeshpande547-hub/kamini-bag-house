import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Order, Product, Profile } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [dailySales, setDailySales] = useState<{ date: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('profiles').select('*').eq('role', 'customer'),
      ]);

      const orders = (ordersRes.data as Order[]) ?? [];
      const products = (productsRes.data as Product[]) ?? [];
      const customers = (customersRes.data as Profile[]) ?? [];

      const totalSales = orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.total, 0);
      const pendingOrders = orders.filter((o) => o.status === 'Order Placed').length;
      const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;

      setStats({
        totalSales,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: customers.length,
        pendingOrders,
        lowStock,
      });

      setRecentOrders(orders.slice(0, 6));
      setTopProducts([...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 5));

      const days: { date: string; amount: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const amount = orders
          .filter((o) => o.created_at.startsWith(dayStr) && o.status !== 'Cancelled')
          .reduce((sum, o) => sum + o.total, 0);
        days.push({ date: dayStr, amount });
      }
      setDailySales(days);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#ff9900] rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Sales', value: formatCurrency(stats.totalSales), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/admin/sales' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/orders' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-[#ff9900]', bg: 'bg-amber-50', link: '/admin/products' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', link: '/admin/customers' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', link: '/admin/orders' },
    { label: 'Low Stock Items', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', link: '/admin/inventory' },
  ];

  const maxSale = Math.max(...dailySales.map((d) => d.amount), 1);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back — here's what's happening with your store today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#ff9900] hover:shadow-md transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
              <card.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Sales chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">Daily Sales</h2>
              <p className="text-xs text-slate-500">Last 7 days revenue trend</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <TrendingUp size={16} />
              <span>{formatCurrency(dailySales.reduce((s, d) => s + d.amount, 0))}</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {dailySales.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-100 rounded-t-lg relative group" style={{ height: '100%' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#ff9900] to-[#ffb84d] rounded-t-lg transition-all duration-500"
                    style={{ height: `${(d.amount / maxSale) * 100}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 text-xs font-medium bg-slate-900 text-white px-2.5 py-1.5 rounded-md whitespace-nowrap transition-opacity">
                      {formatCurrency(d.amount)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Top Sellers</h2>
            <Link to="/admin/products" className="text-xs text-[#ff9900] hover:underline font-medium">View all</Link>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-[#ff9900] text-[#1a2433]' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 line-clamp-1">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.sold_count} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-[#ff9900] hover:underline font-medium flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Order ID</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Payment</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No orders yet</td></tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{o.order_number}</td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{formatCurrency(o.total)}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700'
                        : o.status === 'Cancelled' ? 'bg-red-100 text-red-700'
                        : o.status === 'Order Placed' ? 'bg-orange-100 text-orange-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        o.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700'
                        : o.payment_status === 'Pending' ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs font-medium text-[#ff9900] hover:underline">
                        Details <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
