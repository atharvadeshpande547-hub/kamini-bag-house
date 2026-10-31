import { useCallback, useEffect, useState } from 'react';
import { Check, MapPin, Plus } from 'lucide-react';
import { fetchAddresses } from '@/lib/addresses';
import { formatAddressLine } from '@/lib/validation';
import type { Address } from '@/types';
import Button from '@/components/ui/Button';
import AddressEditorModal from '@/components/address/AddressEditorModal';

interface AddressSelectorProps {
  userId: string;
  selectedId: string | null;
  onSelect: (address: Address | null) => void;
}

export default function AddressSelector({ userId, selectedId, onSelect }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAddresses(userId);
      setAddresses(list);
      setError('');
      const current = list.find((a) => a.id === selectedId);
      if (!current) onSelect(list.find((a) => a.is_default) ?? list[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your addresses.');
    } finally {
      setLoading(false);
    }
    // Load once per user; selection changes are driven by user clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = async (saved: Address) => {
    await load();
    onSelect(saved);
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-stone-500">Loading your addresses...</div>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {addresses.map((address) => {
        const selected = address.id === selectedId;
        return (
          <button
            type="button"
            key={address.id}
            onClick={() => onSelect(address)}
            aria-pressed={selected}
            className={`w-full text-left flex items-start gap-3 p-4 border-2 rounded-xl transition-all ${
              selected ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <MapPin size={18} className="text-stone-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-900 leading-relaxed">{formatAddressLine(address)}</p>
              {address.landmark && <p className="text-xs text-stone-500 mt-0.5">Landmark: {address.landmark}</p>}
              {address.is_default && <p className="text-xs text-green-700 font-medium mt-1">Default address</p>}
            </div>
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                selected ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300'
              }`}
            >
              {selected && <Check size={12} />}
            </span>
          </button>
        );
      })}

      {addresses.length === 0 && !error && (
        <p className="text-sm text-stone-500">You have no saved addresses. Add one to continue.</p>
      )}

      <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
        <Plus size={16} /> Add New Address
      </Button>

      {adding && (
        <AddressEditorModal
          userId={userId}
          defaultChecked={addresses.length === 0}
          onClose={() => setAdding(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
