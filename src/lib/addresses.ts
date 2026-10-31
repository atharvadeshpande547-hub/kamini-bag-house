import { supabase } from '@/lib/supabase';
import type { Address } from '@/types';
import type { AddressValues } from '@/lib/validation';

export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Address[]) ?? [];
}

async function clearDefault(userId: string, exceptId?: string) {
  let query = supabase.from('addresses').update({ is_default: false }).eq('user_id', userId).eq('is_default', true);
  if (exceptId) query = query.neq('id', exceptId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function saveAddress(
  userId: string,
  values: AddressValues,
  options: { id?: string; makeDefault?: boolean }
): Promise<Address> {
  const row = {
    house: values.house.trim(),
    street: values.street.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    pincode: values.pincode.trim(),
    landmark: values.landmark.trim(),
  };

  if (options.makeDefault) await clearDefault(userId, options.id);

  const query = options.id
    ? supabase
        .from('addresses')
        .update({ ...row, ...(options.makeDefault ? { is_default: true } : {}) })
        .eq('id', options.id)
    : supabase.from('addresses').insert({ ...row, user_id: userId, is_default: !!options.makeDefault });

  const { data, error } = await query.select('*').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('The address could not be saved.');
  return data as Address;
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  await clearDefault(userId, id);
  const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw new Error(error.message);

  const remaining = await fetchAddresses(userId);
  if (remaining.length > 0 && !remaining.some((a) => a.is_default)) {
    await setDefaultAddress(userId, remaining[0].id);
  }
}
