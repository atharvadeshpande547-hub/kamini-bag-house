import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { StoreSettings } from '@/types';
import Button from '@/components/ui/Button';

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('store_settings').select('*').maybeSingle().then(({ data }) => {
      setSettings(data as StoreSettings | null);
    });
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    await supabase.from('store_settings').update({
      store_name: settings.store_name,
      contact_email: settings.contact_email,
      store_phone: settings.store_phone,
      shipping_charge: settings.shipping_charge,
      min_order_value: settings.min_order_value,
      tax_percentage: settings.tax_percentage,
      currency: settings.currency,
      currency_symbol: settings.currency_symbol,
      logo_url: settings.logo_url,
    }).eq('id', settings.id);
    setSaving(false);
    setMsg('Settings saved successfully');
    setTimeout(() => setMsg(''), 3000);
  };

  if (!settings) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  const fields = [
    { key: 'store_name', label: 'Store Name', type: 'text' },
    { key: 'contact_email', label: 'Contact Email', type: 'email' },
    { key: 'store_phone', label: 'Store Phone', type: 'text' },
    { key: 'shipping_charge', label: 'Shipping Charge ($)', type: 'number' },
    { key: 'min_order_value', label: 'Minimum Order Value ($)', type: 'number' },
    { key: 'tax_percentage', label: 'Tax Percentage (%)', type: 'number' },
    { key: 'currency', label: 'Currency Code', type: 'text' },
    { key: 'currency_symbol', label: 'Currency Symbol', type: 'text' },
    { key: 'logo_url', label: 'Logo URL', type: 'text' },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Store Settings</h1>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{msg}</div>}

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl">
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={String(settings[f.key as keyof StoreSettings] ?? '')}
                onChange={(e) => {
                  const val = f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                  setSettings({ ...settings, [f.key]: val });
                }}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              />
            </div>
          ))}
          <Button onClick={save} disabled={saving} className="mt-2">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
