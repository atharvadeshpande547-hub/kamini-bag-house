import type { AddressValues } from '@/lib/validation';

const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function postFunction<T>(slug: string, body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${functionsUrl}/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error. Please check your connection and try again.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? 'Something went wrong. Please try again.');
  }
  return data as T;
}

export interface RegistrationInput extends AddressValues {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export async function registerCustomer(input: RegistrationInput): Promise<void> {
  await postFunction<{ userId: string }>('register-customer', { ...input });
}
