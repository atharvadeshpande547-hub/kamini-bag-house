import { useEffect, useState } from 'react';
import { Search, Eye, UserX, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile, Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface CustomerWithStats extends Profile {
  email?: string;
  order_count?: number;
  total_spent?: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [viewCustomer, setViewCustomer] = useState<CustomerWithStats | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  async function load() {
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'customer');
    const { data: orders } = await supabase.from('orders').select('*');

    const allOrders = orders ?? [];
    const enriched: CustomerWithStats[] = (profiles ?? []).map((p: Profile) => {
      const userOrders = allOrders.filter((o: Order) => o.user_id === p.id && o.status !== 'Cancelled');
      return {
        ...p,
        order_count: userOrders.length,
        total_spent: userOrders.reduce((sum: number, o: Order) => sum + o.total, 0),
      };
    });
    setCustomers(enriched);
  }
  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleDisable = async (id: string, isDisabled: boolean) => {
    await supabase.from('profiles').update({ is_disabled: !isDisabled }).eq('id', id);
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, is_disabled: !isDisabled } : c)));
    if (viewCustomer?.id === id) setViewCustomer({ ...viewCustomer, is_disabled: !isDisabled });
  };

  const viewOrders = async (c: CustomerWithStats) => {
    setViewCustomer(c);
    const { data } = await supabase.from('orders').select('*, order_items(*)').eq('user_id', c.id).order('created_at', { ascending: false });
    setCustomerOrders((data as Order[]) ?? []);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Customers</h1>

      <div className="relative flex-1 max-w-sm mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Total Spent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name || 'Unnamed'}</td>
                <td className="px-4 py-3 text-slate-500">{c.phone || '-'}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3">{c.order_count ?? 0}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(c.total_spent ?? 0)}</td>
                <td className="px-4 py-3">
                  {c.is_disabled ? <Badge color="red">Disabled</Badge> : <Badge color="green">Active</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => viewOrders(c)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600" title="View Details">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => toggleDisable(c.id, c.is_disabled)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.is_disabled ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`} title={c.is_disabled ? 'Enable' : 'Disable'}>
                      {c.is_disabled ? <UserCheck size={16} /> : <UserX size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer detail modal */}
      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Details" size="lg">
        {viewCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold text-xl">
                {viewCustomer.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg">{viewCustomer.name}</p>
                <p className="text-sm text-slate-500">{viewCustomer.phone || 'No phone'}</p>
                <Badge color={viewCustomer.is_disabled ? 'red' : 'green'} className="mt-1">{viewCustomer.is_disabled ? 'Disabled' : 'Active'}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-100 pt-4">
              <div><span className="text-slate-500">Total Orders:</span> <span className="font-medium">{viewCustomer.order_count ?? 0}</span></div>
              <div><span className="text-slate-500">Total Spent:</span> <span className="font-medium">{formatCurrency(viewCustomer.total_spent ?? 0)}</span></div>
              <div><span className="text-slate-500">Joined:</span> <span className="font-medium">{formatDate(viewCustomer.created_at)}</span></div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-semibold text-slate-900 mb-2">Order History</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customerOrders.length === 0 ? (
                  <p className="text-slate-400 text-sm">No orders</p>
                ) : customerOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium text-slate-900">{o.order_number}</p>
                      <p className="text-xs text-slate-500">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={o.status === 'Delivered' ? 'green' : o.status === 'Cancelled' ? 'red' : 'amber'}>{o.status}</Badge>
                      <span className="font-semibold">{formatCurrency(o.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button variant={viewCustomer.is_disabled ? 'primary' : 'danger'} fullWidth onClick={() => toggleDisable(viewCustomer.id, viewCustomer.is_disabled)}>
              {viewCustomer.is_disabled ? 'Enable Account' : 'Disable Account'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
