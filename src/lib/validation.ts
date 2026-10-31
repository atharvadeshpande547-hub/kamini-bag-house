export interface AddressValues {
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
}

export type AddressErrors = Partial<Record<keyof AddressValues, string>>;

export const EMPTY_ADDRESS: AddressValues = {
  house: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
};

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''));
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
}

export function validateAddress(values: AddressValues): AddressErrors {
  const errors: AddressErrors = {};
  if (!values.house.trim()) errors.house = 'Enter your house or flat number';
  else if (values.house.trim().length > 100) errors.house = 'Keep this under 100 characters';
  if (!values.street.trim()) errors.street = 'Enter your street or area';
  else if (values.street.trim().length > 150) errors.street = 'Keep this under 150 characters';
  if (!values.city.trim()) errors.city = 'Enter your city';
  else if (values.city.trim().length > 80) errors.city = 'Keep this under 80 characters';
  if (!values.state.trim()) errors.state = 'Enter your state';
  else if (values.state.trim().length > 80) errors.state = 'Keep this under 80 characters';
  if (!/^\d{6}$/.test(values.pincode.trim())) errors.pincode = 'Enter a valid 6-digit PIN code';
  if (values.landmark.trim().length > 150) errors.landmark = 'Keep this under 150 characters';
  return errors;
}

export function formatAddressLine(values: AddressValues): string {
  return [values.house, values.street, values.city, `${values.state} - ${values.pincode}`]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}
