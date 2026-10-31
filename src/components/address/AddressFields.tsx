import type { AddressErrors, AddressValues } from '@/lib/validation';

interface AddressFieldsProps {
  values: AddressValues;
  errors: AddressErrors;
  onChange: (field: keyof AddressValues, value: string) => void;
  disabled?: boolean;
}

const inputBase = 'w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-stone-400 disabled:bg-stone-50';

export default function AddressFields({ values, errors, onChange, disabled }: AddressFieldsProps) {
  const inputClass = (field: keyof AddressValues) =>
    `${inputBase} ${errors[field] ? 'border-red-400' : 'border-stone-200'}`;

  const field = (key: keyof AddressValues, label: string, props: { placeholder?: string; optional?: boolean; full?: boolean; inputMode?: 'numeric' } = {}) => (
    <div className={props.full ? 'sm:col-span-2' : ''}>
      <label htmlFor={`address-${key}`} className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}
        {props.optional && <span className="text-stone-400 font-normal"> (optional)</span>}
      </label>
      <input
        id={`address-${key}`}
        type="text"
        value={values[key]}
        onChange={(e) => onChange(key, props.inputMode === 'numeric' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
        disabled={disabled}
        aria-invalid={!!errors[key]}
        className={inputClass(key)}
      />
      {errors[key] && <p className="text-xs text-red-600 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {field('house', 'House / Flat No.', { placeholder: 'Flat 4B, Sunrise Apartments', full: true })}
      {field('street', 'Street / Area', { placeholder: 'MG Road', full: true })}
      {field('city', 'City', { placeholder: 'Mumbai' })}
      {field('state', 'State', { placeholder: 'Maharashtra' })}
      {field('pincode', 'PIN Code', { placeholder: '400001', inputMode: 'numeric' })}
      {field('landmark', 'Landmark', { placeholder: 'Near City Mall', optional: true })}
    </div>
  );
}
