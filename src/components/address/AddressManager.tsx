import { useCallback, useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { deleteAddress, fetchAddresses, setDefaultAddress } from '@/lib/addresses';
import { formatAddressLine } from '@/lib/validation';
import type { Address } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import AddressEditorModal from '@/components/address/AddressEditorModal';

export default function AddressManager({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ address: Address | null } | null>(null);

  const refresh = useCallback(async () => {
    try {
      setAddresses(await fetchAddresses(userId));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your addresses.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runAction = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setError('');
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action could not be completed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (address: Address) => {
    if (!window.confirm('Delete this address? This cannot be undone.')) return;
    runAction(address.id, () => deleteAddress(userId, address.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-stone-900 text-lg">Saved Addresses</h2>
        <Button size="sm" onClick={() => setEditor({ address: null })}>
          <Plus size={16} /> Add Address
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {loading ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-sm text-stone-500">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <MapPin size={40} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">You have no saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <MapPin size={18} className="text-stone-500 mt-0.5 shrink-0" />
                {address.is_default && <Badge color="green">Default</Badge>}
              </div>
              <p className="text-sm text-stone-900 leading-relaxed flex-1">{formatAddressLine(address)}</p>
              {address.landmark && <p className="text-xs text-stone-500 mt-1">Landmark: {address.landmark}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-stone-100">
                <Button variant="outline" size="sm" onClick={() => setEditor({ address })} disabled={busyId === address.id}>
                  <Pencil size={14} /> Edit
                </Button>
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => runAction(address.id, () => setDefaultAddress(userId, address.id))}
                    disabled={busyId === address.id}
                  >
                    <Star size={14} /> Set as default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(address)}
                  disabled={busyId === address.id}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editor && (
        <AddressEditorModal
          userId={userId}
          address={editor.address}
          defaultChecked={addresses.length === 0}
          onClose={() => setEditor(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
