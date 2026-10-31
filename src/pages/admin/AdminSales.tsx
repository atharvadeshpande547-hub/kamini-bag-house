import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, Product, Category } from '@/types';
import { formatCurrency } from '@/lib/format';
import Badge from '@/components/ui/Badge';

type Range = 'today' | '7days' | '30days' | 'year' | 'all';

export default function AdminSales() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [range, setRange] = useState<Range>('30days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('products').select('*, category:categories(*)'),
      supabase.from('categories').select('*'),
    ]).then(([oRes, pRes, cRes]) => {
      setOrders((oRes.data as Order[]) ?? []);
      setProducts((pRes.data as Product[]) ?? []);
      setCategories((cRes.data as Category[]) ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-slate-200 border-t-stone-900 rounded-full animate-spin" /></div>;
  }

  const now = new Date();
  const filterDate = (date: string) => {
    const d = new Date(date);
    switch (range) {
      case 'today': return d.toDateString() === now.toDateString();
      case '7days': return d >= new Date(now.getTime() - 7 * 86400000);
      case '30days': return d >= new Date(now.getTime() - 30 * 86400000);
      case 'year': return d.getFullYear() === now.getFullYear();
      default: return true;
    }
  };

  const validOrders = orders.filter((o) => o.status !== 'Cancelled' && filterDate(o.created_at));
  const totalRevenue = validOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = validOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const productsSold = validOrders.reduce((s, o) => s + (o.order_items?.reduce((si, i) => si + i.quantity, 0) ?? 0), 0);

  // Best selling products
  const productSales = new Map<string, { name: string; count: number; revenue: number; image: string }>();
  validOrders.forEach((o) => {
    o.order_items?.forEach((item) => {
      const existing = productSales.get(item.product_id ?? item.name) ?? { name: item.name, count: 0, revenue: 0, image: item.image_url };
      existing.count += item.quantity;
      existing.revenue += item.price * item.quantity;
      productSales.set(item.product_id ?? item.name, existing);
    });
  });
  const topProducts = [...productSales.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  // Category-wise sales
  const catSales = new Map<string, number>();
  validOrders.forEach((o) => {
    o.order_items?.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const catName = product?.category?.name ?? 'Uncategorized';
      catSales.set(catName, (catSales.get(catName) ?? 0) + item.price * item.quantity);
    });
  });
  const topCategories = [...catSales.entries()].sort((a, b) => b[1] - a[1]);

  // Monthly revenue chart
  const monthlyData: { month: string; amount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toISOString().slice(0, 7);
    const amount = orders
      .filter((o) => o.created_at.startsWith(monthStr) && o.status !== 'Cancelled')
      .reduce((s, o) => s + o.total, 0);
    monthlyData.push({ month: d.toLocaleDateString('en-US', { month: 'short' }), amount });
  }
  const maxMonthly = Math.max(...monthlyData.map((m) => m.amount), 1);

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'bg-blue-100 text-blue-700' },
    { label: 'Avg Order Value', value: formatCurrency(avgOrderValue), icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
    { label: 'Products Sold', value: productsSold, icon: Package, color: 'bg-amber-100 text-[#ff9900]' },
  ];

  const ranges: { key: Range; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7days', label: 'Last 7 Days' },
    { key: '30days', label: 'Last 30 Days' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Sales Analytics</h1>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${range === r.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Monthly Revenue (12 Months)</h2>
          <div className="flex items-end justify-between gap-1 h-40">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-slate-100 rounded-t relative group" style={{ height: '100%' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-700 to-stone-500 rounded-t transition-all duration-500" style={{ height: `${(m.amount / maxMonthly) * 100}%` }}>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-medium text-white bg-slate-900 px-2 py-1 rounded whitespace-nowrap transition-opacity">
                      {formatCurrency(m.amount)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category-wise sales */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Category Performance</h2>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <p className="text-slate-400 text-sm">No sales data for this period</p>
            ) : topCategories.map(([cat, amount]) => {
              const pct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{cat}</span>
                    <span className="text-slate-500">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Best-Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Units Sold</th>
                <th className="px-4 py-2 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No sales data</td></tr>
              ) : topProducts.map((p, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                        {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-medium text-slate-900 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge color="blue">{p.count}</Badge></td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
