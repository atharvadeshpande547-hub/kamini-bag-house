import { supabase } from '@/lib/supabase';
import type { Review } from '@/types';

export type ReviewWithProfile = Review & {
  profiles?: { name: string } | null;
};

export async function attachReviewProfiles<T extends Review>(reviews: T[]): Promise<Array<T & { profiles: { name: string } | null }>> {
  if (reviews.length === 0) return [];

  const userIds = [...new Set(reviews.map((review) => review.user_id))];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  if (error) throw error;

  const namesById = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));
  return reviews.map((review) => ({
    ...review,
    profiles: namesById.has(review.user_id) ? { name: namesById.get(review.user_id) ?? '' } : null,
  }));
}
