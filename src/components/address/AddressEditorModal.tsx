import { useState } from 'react';
import { EMPTY_ADDRESS, validateAddress, type AddressErrors, type AddressValues } from '@/lib/validation';
import { saveAddress } from '@/lib/addresses';
import type { Address } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import AddressFields from '@/components/address/AddressFields';

interface AddressEditorModalProps {
  userId: string;
  address?: Address | null;
  defaultChecked?: boolean;
  title?: string;
  onClose: () => void;
  onSaved: (address: Address) => void;
}

function toValues(address?: Address | null): AddressValues {
  if (!address) return EMPTY_ADDRESS;
  return {
    house: address.house,
    street: address.street,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    landmark: address.landmark,
  };
}

export default function AddressEditorModal({ userId, address, defaultChecked, title, onClose, onSaved }: AddressEditorModalProps) {
  const [values, setValues] = useState<AddressValues>(() => toValues(address));
  const [makeDefault, setMakeDefault] = useState(address?.is_default ?? defaultChecked ?? false);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleChange = (field: keyof AddressValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    const validation = validateAddress(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setSaving(true);
    try {
      const saved = await saveAddress(userId, values, { id: address?.id, makeDefault: makeDefault || undefined });
      onSaved(saved);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'The address could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={title ?? (address ? 'Edit Address' : 'Add New Address')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{saveError}</div>
        )}
        <AddressFields values={values} errors={errors} onChange={handleChange} disabled={saving} />
        <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={makeDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
            disabled={address?.is_default}
            className="accent-stone-900"
          />
          Use as my default delivery address
        </label>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Address'}</Button>
        </div>
      </form>
    </Modal>
  );
}
