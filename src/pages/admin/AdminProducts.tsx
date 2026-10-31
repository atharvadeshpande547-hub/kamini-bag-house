import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import { formatCurrency, finalPrice, slugify } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

interface EditForm {
  id?: string;
  name: string;
  sku: string;
  category_id: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  images: string;
  material: string;
  colors: string;
  sizes: string;
  dimensions: string;
  weight: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
}

const emptyForm: EditForm = {
  name: '', sku: '', category_id: '', description: '', price: 0, discount: 0,
  stock: 0, images: '', material: '', colors: '', sizes: '', dimensions: '',
  weight: '', is_featured: false, is_bestseller: false, is_new: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    setProducts((data as Product[]) ?? []);
    const { data: cats } = await supabase.from('categories').select('*').order('name');
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && p.category_id !== categoryFilter) return false;
    return true;
  });

  const openAdd = () => {
    setEditForm({ ...emptyForm, category_id: categories[0]?.id ?? '' });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditForm({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category_id: p.category_id ?? '',
      description: p.description,
      price: p.price,
      discount: p.discount,
      stock: p.stock,
      images: p.images.join('\n'),
      material: p.material,
      colors: p.colors.join(', '),
      sizes: p.sizes.join(', '),
      dimensions: p.dimensions,
      weight: p.weight,
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller,
      is_new: p.is_new,
    });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      name: editForm.name,
      slug: slugify(editForm.name) + '-' + Math.random().toString(36).slice(2, 6),
      sku: editForm.sku,
      category_id: editForm.category_id || null,
      description: editForm.description,
      price: editForm.price,
      discount: editForm.discount,
      stock: editForm.stock,
      images: editForm.images.split('\n').map((s) => s.trim()).filter(Boolean),
      material: editForm.material,
      colors: editForm.colors.split(',').map((s) => s.trim()).filter(Boolean),
      sizes: editForm.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      dimensions: editForm.dimensions,
      weight: editForm.weight,
      is_featured: editForm.is_featured,
      is_bestseller: editForm.is_bestseller,
      is_new: editForm.is_new,
    };
    if (editForm.id) {
      await supabase.from('products').update(payload).eq('id', editForm.id);
    } else {
      await supabase.from('products').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Button onClick={openAdd}><Plus size={18} /> Add Product</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No products found</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 line-clamp-1">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.category?.name ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className="font-medium">{formatCurrency(finalPrice(p.price, p.discount))}</span>
                  {p.discount > 0 && <span className="text-xs text-slate-400 line-through ml-1">{formatCurrency(p.price)}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={p.stock === 0 ? 'text-red-600 font-medium' : p.stock <= 10 ? 'text-[#ff9900] font-medium' : 'text-green-600'}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.is_featured && <Badge color="purple">F</Badge>}
                    {p.is_bestseller && <Badge color="amber">B</Badge>}
                    {p.is_new && <Badge color="blue">N</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => del(p.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editForm.id ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
              <input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
              <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
              <input type="number" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
              <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URLs (one per line)</label>
            <textarea value={editForm.images} onChange={(e) => setEditForm({ ...editForm, images: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Colors (comma-separated)</label>
              <input value={editForm.colors} onChange={(e) => setEditForm({ ...editForm, colors: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sizes (comma-separated)</label>
              <input value={editForm.sizes} onChange={(e) => setEditForm({ ...editForm, sizes: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
              <input value={editForm.material} onChange={(e) => setEditForm({ ...editForm, material: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dimensions</label>
              <input value={editForm.dimensions} onChange={(e) => setEditForm({ ...editForm, dimensions: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
              <input value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={editForm.is_featured} onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })} className="accent-slate-900" /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={editForm.is_bestseller} onChange={(e) => setEditForm({ ...editForm, is_bestseller: e.target.checked })} className="accent-slate-900" /> Bestseller
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={editForm.is_new} onChange={(e) => setEditForm({ ...editForm, is_new: e.target.checked })} className="accent-slate-900" /> New Arrival
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !editForm.name}>{saving ? 'Saving...' : 'Save Product'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
