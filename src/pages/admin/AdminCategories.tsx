import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/format';
import type { Category } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function AdminCategories() {
  const [categories, setCategories] = useState<(Category & { product_count?: number })[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', image_url: '' });

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('name');
    const cats = (data as Category[]) ?? [];
    const withCounts = await Promise.all(
      cats.map(async (c) => {
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', c.id);
        return { ...c, product_count: count ?? 0 };
      })
    );
    setCategories(withCounts);
  }

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editForm.name) return;
    if (editForm.id) {
      await supabase.from('categories').update({ name: editForm.name, image_url: editForm.image_url }).eq('id', editForm.id);
    } else {
      await supabase.from('categories').insert({ name: editForm.name, slug: slugify(editForm.name) + '-' + Math.random().toString(36).slice(2, 5), image_url: editForm.image_url });
    }
    setShowModal(false);
    setEditForm({ id: '', name: '', image_url: '' });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this category? Products in it will remain but become uncategorized.')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <Button onClick={() => { setEditForm({ id: '', name: '', image_url: '' }); setShowModal(true); }}>
          <Plus size={18} /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="aspect-[4/3] bg-slate-50">
              {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{c.product_count} products</p>
              <div className="flex items-center gap-1 mt-3">
                <button onClick={() => { setEditForm({ id: c.id, name: c.name, image_url: c.image_url }); setShowModal(true); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                  <Pencil size={16} />
                </button>
                <button onClick={() => del(c.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editForm.id ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={!editForm.name}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
