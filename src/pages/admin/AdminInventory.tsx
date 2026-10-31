import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editId, setEditId] = useState('');
  const [editStock, setEditStock] = useState(0);

  async function load() {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts((data as Product[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'in-stock' && p.stock <= 10) return false;
    if (filter === 'low-stock' && (p.stock === 0 || p.stock > 10)) return false;
    if (filter === 'out-of-stock' && p.stock > 0) return false;
    return true;
  });

  const saveStock = async (id: string) => {
    await supabase.from('products').update({ stock: editStock }).eq('id', id);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: editStock } : p)));
    setEditId('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Inventory Management</h1>

      {/* Low stock alert */}
      {products.filter((p) => p.stock > 0 && p.stock <= 10).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{products.filter((p) => p.stock > 0 && p.stock <= 10).length}</span> products are running low on stock.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
          <option value="">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Current Stock</th>
              <th className="px-4 py-3 font-medium">Sold</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Update Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-medium text-slate-900 line-clamp-1">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{p.sku || '-'}</td>
                <td className="px-4 py-3 font-medium">{p.stock}</td>
                <td className="px-4 py-3 text-slate-500">{p.sold_count}</td>
                <td className="px-4 py-3">
                  {p.stock === 0 ? <Badge color="red">Out of Stock</Badge> : p.stock <= 10 ? <Badge color="amber">Low Stock</Badge> : <Badge color="green">In Stock</Badge>}
                </td>
                <td className="px-4 py-3">
                  {editId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={editStock} onChange={(e) => setEditStock(parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 text-sm border border-slate-200 rounded-lg" />
                      <Button size="sm" onClick={() => saveStock(p.id)}>Save</Button>
                      <button onClick={() => setEditId('')} className="text-slate-400 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setEditId(p.id); setEditStock(p.stock); }}>Edit</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
