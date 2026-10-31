import { useEffect, useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import Modal from '@/components/ui/Modal';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  async function load() {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), profiles!orders_user_id_fkey(name, email)')
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    if (search && !o.order_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    return true;
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (viewOrder?.id === id) setViewOrder({ ...viewOrder, status });
  };

  const updatePaymentStatus = async (id: string, payment_status: PaymentStatus) => {
    await supabase.from('orders').update({ payment_status }).eq('id', id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, payment_status } : o)));
    if (viewOrder?.id === id) setViewOrder({ ...viewOrder, payment_status });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Orders</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No orders found</td></tr>
            ) : filtered.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{o.order_number}</td>
                <td className="px-4 py-3 text-slate-600">{o.profiles?.name ?? (o.shipping_name || '-')}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.payment_status}
                    onChange={(e) => updatePaymentStatus(o.id, e.target.value as PaymentStatus)}
                    className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                    className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setViewOrder(o)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order detail modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title="Order Details" size="lg">
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Order ID:</span> <span className="font-medium">{viewOrder.order_number}</span></div>
              <div><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(viewOrder.created_at)}</span></div>
              <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{viewOrder.shipping_name}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{viewOrder.shipping_phone}</span></div>
              <div className="col-span-2"><span className="text-slate-500">Address:</span> <span className="font-medium">{viewOrder.shipping_address}, {viewOrder.shipping_city}, {viewOrder.shipping_zip}</span></div>
              <div><span className="text-slate-500">Payment:</span> <span className="font-medium">{viewOrder.payment_method} ({viewOrder.payment_status})</span></div>
              <div><span className="text-slate-500">Coupon:</span> <span className="font-medium">{viewOrder.coupon_code || 'None'}</span></div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-semibold text-slate-900 mb-2">Items</h4>
              <div className="space-y-2">
                {viewOrder.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} {item.color && `| ${item.color}`} {item.size && `| ${item.size}`}</p>
                    </div>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(viewOrder.subtotal)}</span></div>
              {viewOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(viewOrder.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span>{formatCurrency(viewOrder.delivery_charge)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{formatCurrency(viewOrder.tax)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{formatCurrency(viewOrder.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
