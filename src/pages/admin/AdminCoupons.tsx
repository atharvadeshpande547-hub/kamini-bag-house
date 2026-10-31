import { useEffect, useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Coupon } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: 0, min_order_value: 0, expiry_date: '' });

  async function load() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data as Coupon[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.code) return;
    await supabase.from('coupons').insert({
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.value,
      min_order_value: form.min_order_value,
      expiry_date: form.expiry_date || null,
      is_active: true,
    });
    setShowModal(false);
    setForm({ code: '', type: 'percentage', value: 0, min_order_value: 0, expiry_date: '' });
    load();
  };

  const toggle = async (id: string, isActive: boolean) => {
    await supabase.from('coupons').update({ is_active: !isActive }).eq('id', id);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Coupons & Discounts</h1>
        <Button onClick={() => setShowModal(true)}><Plus size={18} /> Add Coupon</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Min Order</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono font-semibold text-slate-900">{c.code}</td>
                <td className="px-4 py-3 text-slate-600">{c.type}</td>
                <td className="px-4 py-3 font-medium">{c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}</td>
                <td className="px-4 py-3 text-slate-500">{formatCurrency(c.min_order_value)}</td>
                <td className="px-4 py-3 text-slate-500">{c.expiry_date ? formatDate(c.expiry_date) : 'No expiry'}</td>
                <td className="px-4 py-3"><Badge color={c.is_active ? 'green' : 'stone'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggle(c.id, c.is_active)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600" title="Toggle">
                      <Power size={16} />
                    </button>
                    <button onClick={() => del(c.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Coupon">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono" placeholder="SAVE20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Order Value</label>
              <input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.code}>Create Coupon</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
