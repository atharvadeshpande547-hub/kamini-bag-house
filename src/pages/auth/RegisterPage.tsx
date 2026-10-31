import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { RegistrationInput } from '@/lib/accountApi';
import {
  EMPTY_ADDRESS,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  validateAddress,
  type AddressValues,
} from '@/lib/validation';
import Button from '@/components/ui/Button';
import AddressFields from '@/components/address/AddressFields';

type AccountField = 'name' | 'email' | 'phone' | 'password' | 'confirm';
type FormErrors = Partial<Record<AccountField | keyof AddressValues, string>>;

const inputClass = (hasError?: boolean) =>
  `w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-stone-400 ${hasError ? 'border-red-400' : 'border-stone-200'}`;

const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5';
const errorClass = 'text-xs text-red-600 mt-1';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [address, setAddress] = useState<AddressValues>(EMPTY_ADDRESS);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name';
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!isValidPhone(phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (confirm !== password) next.confirm = 'Passwords do not match';
    return { ...next, ...validateAddress(address) };
  };

  const handleAddressChange = (field: keyof AddressValues, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFieldChange = (field: AccountField, value: string) => {
    const setters: Record<AccountField, (v: string) => void> = {
      name: setName,
      email: setEmail,
      phone: (v) => setPhone(v.replace(/\D/g, '').slice(0, 10)),
      password: setPassword,
      confirm: setConfirm,
    };
    setters[field](value);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const registration: RegistrationInput = {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: normalizePhone(phone),
      ...address,
    };

    setSubmitting(true);
    const { error } = await signUp(registration);
    if (error) {
      setFormError(error);
      setSubmitting(false);
      return;
    }
    navigate('/');
  };

  const handleBack = () => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) navigate(-1);
    else navigate('/');
  };

  const fieldError = (key: keyof FormErrors) =>
    errors[key] && <p className={errorClass}>{errors[key]}</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-xl">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
            <Package size={22} className="text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-stone-900">Kamini<span className="text-amber-500"> Bag House</span></span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          <h1 className="text-xl font-bold text-stone-900 mb-1">Create Account</h1>
          <p className="text-sm text-stone-500 mb-6">Join Kamini Bag House for a premium shopping experience</p>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Your details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="reg-name" className={labelClass}>Full Name</label>
                  <input id="reg-name" type="text" value={name} onChange={(e) => handleFieldChange('name', e.target.value)} disabled={submitting} className={inputClass(!!errors.name)} placeholder="John Doe" />
                  {fieldError('name')}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="reg-email" className={labelClass}>Email</label>
                  <input id="reg-email" type="email" value={email} onChange={(e) => handleFieldChange('email', e.target.value)} disabled={submitting} className={inputClass(!!errors.email)} placeholder="you@example.com" />
                  {fieldError('email')}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="reg-phone" className={labelClass}>Mobile Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-stone-600 bg-stone-50 border border-r-0 border-stone-200 rounded-l-lg">+91</span>
                    <input id="reg-phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => handleFieldChange('phone', e.target.value)} disabled={submitting} className={`${inputClass(!!errors.phone)} rounded-l-none`} placeholder="9876543210" />
                  </div>
                  {fieldError('phone')}
                </div>
                <div>
                  <label htmlFor="reg-password" className={labelClass}>Password</label>
                  <div className="relative">
                    <input id="reg-password" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => handleFieldChange('password', e.target.value)} disabled={submitting} className={`${inputClass(!!errors.password)} pr-10`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600" aria-label={showPass ? 'Hide password' : 'Show password'}>
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldError('password')}
                </div>
                <div>
                  <label htmlFor="reg-confirm" className={labelClass}>Confirm Password</label>
                  <input id="reg-confirm" type={showPass ? 'text' : 'password'} value={confirm} onChange={(e) => handleFieldChange('confirm', e.target.value)} disabled={submitting} className={inputClass(!!errors.confirm)} placeholder="••••••••" />
                  {fieldError('confirm')}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Delivery address</h2>
              <AddressFields values={address} errors={errors} onChange={handleAddressChange} disabled={submitting} />
            </section>

            <Button type="submit" fullWidth size="lg" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-stone-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
