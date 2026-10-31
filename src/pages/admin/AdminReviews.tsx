import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Review } from '@/types';
import { attachReviewProfiles } from '@/lib/reviews';
import { formatDate } from '@/lib/format';
import Badge from '@/components/ui/Badge';

interface ReviewWithProduct extends Review {
  product_name?: string;
  product_slug?: string;
  user_name?: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, product:products(name, slug)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Reviews load failed:', error.message);
      setReviews([]);
      setLoading(false);
      return;
    }
    const withProfiles = await attachReviewProfiles(data ?? []);
    const enriched = withProfiles.map((r) => ({
      ...r,
      product_name: r.product?.name,
      product_slug: r.product?.slug,
      user_name: r.profiles?.name,
    })) as ReviewWithProduct[];
    setReviews(enriched);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Reviews</h1>

      <div className="space-y-4">
        {loading ? (
          <p className="text-slate-400 text-center py-8">Loading...</p>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Star size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No reviews yet.</p>
          </div>
        ) : reviews.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-slate-900">{r.user_name ?? 'Anonymous'}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
                </div>
                {r.product_name && (
                  <Badge color="stone" className="mb-2">{r.product_name}</Badge>
                )}
                <p className="text-sm text-slate-600">{r.comment}</p>
              </div>
              <button onClick={() => del(r.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
