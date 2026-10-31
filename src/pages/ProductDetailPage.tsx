import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import { attachReviewProfiles, type ReviewWithProfile } from '@/lib/reviews';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { finalPrice, formatCurrency, formatDate } from '@/lib/format';
import Rating from '@/components/ui/Rating';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [wished, setWished] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setQuantity(1);
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError) {
          console.error('Product load failed:', queryError.message);
          setLoading(false);
          return;
        }
        const p = data as Product | null;
        setProduct(p);
        if (p) {
          setSelectedColor(p.colors[0] ?? '');
          setSelectedSize(p.sizes[0] ?? '');
          // Related products
          if (p.category_id) {
            supabase
              .from('products')
              .select('*, category:categories(*)')
              .eq('category_id', p.category_id)
              .neq('id', p.id)
              .limit(4)
              .then(({ data: rel }) => setRelated((rel as Product[]) ?? []));
          }
          // Reviews
          supabase
            .from('reviews')
            .select('*')
            .eq('product_id', p.id)
            .order('created_at', { ascending: false })
            .then(async ({ data: rev, error: reviewsError }) => {
              if (reviewsError) throw reviewsError;
              setReviews(await attachReviewProfiles(rev ?? []));
            });
        }
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (product && session) {
      supabase
        .from('wishlist_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('product_id', product.id)
        .then(({ count }) => setWished((count ?? 0) > 0));
    }
  }, [product, session]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-10 h-10 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Product not found</h1>
        <Link to="/shop" className="text-amber-600 hover:text-amber-700 mt-4 inline-block">
          Back to Shop
        </Link>
      </div>
    );
  }

  const fp = finalPrice(product.price, product.discount);

  const handleAddToCart = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    addToCart(product.id, quantity, selectedColor, selectedSize);
  };

  const handleBuyNow = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    addToCart(product.id, quantity, selectedColor, selectedSize);
    navigate('/cart');
  };

  const toggleWishlist = async () => {
    if (!session) {
      navigate('/login');
      return;
    }
    if (wished) {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('product_id', product.id);
      setWished(false);
    } else {
      await supabase
        .from('wishlist_items')
        .insert({ user_id: session.user.id, product_id: product.id });
      setWished(true);
    }
  };

  const submitReview = async () => {
    if (!session || !reviewText.trim()) return;
    const { data } = await supabase
      .from('reviews')
      .insert({
        product_id: product.id,
        user_id: session.user.id,
        rating: reviewRating,
        comment: reviewText,
      })
      .select('*')
      .maybeSingle();
    if (data) {
      const [review] = await attachReviewProfiles([data]);
      setReviews((prev) => [review, ...prev]);
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(5);
      // Update product rating
      const avg = [...reviews.map((r) => r.rating), reviewRating].reduce((a, b) => a + b, 0) / (reviews.length + 1);
      await supabase
        .from('products')
        .update({ rating: Math.round(avg * 10) / 10, num_reviews: reviews.length + 1 })
        .eq('id', product.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          ...(product.category
            ? [{ label: product.category.name, to: `/shop?category=${product.category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mt-6">
        {/* Image gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-stone-50 border border-stone-100">
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === i ? 'border-stone-900' : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {product.is_new && <Badge color="blue">New Arrival</Badge>}
            {product.is_bestseller && <Badge color="amber">Bestseller</Badge>}
            {product.is_featured && <Badge color="purple">Featured</Badge>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-4 mt-3">
            <Rating value={product.rating} count={product.num_reviews} size={16} />
            <span className="text-stone-300">|</span>
            <span className="text-sm text-stone-500">SKU: {product.sku || 'N/A'}</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-stone-900">{formatCurrency(fp)}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-stone-400 line-through">{formatCurrency(product.price)}</span>
                <Badge color="red">Save {product.discount}%</Badge>
              </>
            )}
          </div>

          <p className="mt-5 text-stone-600 leading-relaxed">{product.description}</p>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-stone-900 mb-2">
                Color: <span className="font-normal text-stone-600">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                      selectedColor === c
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-stone-900 mb-2">
                Size: <span className="font-normal text-stone-600">{selectedSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                      selectedSize === s
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + actions */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-stone-200 rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-stone-900"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-stone-900"
              >
                <Plus size={16} />
              </button>
            </div>
            <span
              className={`text-sm font-medium ${
                product.stock === 0 ? 'text-red-600' : product.stock <= 10 ? 'text-amber-600' : 'text-green-600'
              }`}
            >
              {product.stock === 0
                ? 'Out of Stock'
                : product.stock <= 10
                  ? `Only ${product.stock} left in stock`
                  : 'In Stock'}
            </span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={handleAddToCart} disabled={product.stock === 0} size="lg" className="flex-1">
              <ShoppingCart size={18} /> Add to Cart
            </Button>
            <Button onClick={handleBuyNow} disabled={product.stock === 0} variant="secondary" size="lg" className="flex-1">
              Buy Now
            </Button>
            <button
              onClick={toggleWishlist}
              className="w-12 h-12 rounded-lg border border-stone-200 flex items-center justify-center hover:border-stone-400 transition-colors shrink-0"
            >
              <Heart size={20} className={wished ? 'fill-red-500 text-red-500' : 'text-stone-600'} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-stone-100">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'Over $100' },
              { icon: ShieldCheck, label: 'Secure', sub: 'Payment' },
              { icon: RotateCcw, label: '30-Day', sub: 'Returns' },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1">
                <t.icon size={22} className="text-stone-700" />
                <p className="text-xs font-semibold text-stone-900">{t.label}</p>
                <p className="text-xs text-stone-500">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="mt-12 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-stone-900 mb-4">Specifications</h2>
          <dl className="divide-y divide-stone-100 border border-stone-200 rounded-xl">
            {[
              ['Material', product.material],
              ['Dimensions', product.dimensions],
              ['Weight', product.weight],
              ['SKU', product.sku || 'N/A'],
              ['Category', product.category?.name ?? 'N/A'],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <dt className="text-sm text-stone-500">{label}</dt>
                <dd className="text-sm font-medium text-stone-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Reviews section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900">
              Customer Reviews ({reviews.length})
            </h2>
            {session && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Write a Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-stone-700">Rating:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setReviewRating(s)}
                    className={`text-2xl ${s <= reviewRating ? 'text-amber-400' : 'text-stone-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={submitReview} disabled={!reviewText.trim()}>
                  Submit Review
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {reviews.length === 0 ? (
              <p className="text-stone-500 text-sm">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="border border-stone-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-900">
                      {r.profiles?.name ?? 'Anonymous'}
                    </p>
                    <span className="text-xs text-stone-400">{formatDate(r.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-0.5 my-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={s <= r.rating ? 'text-amber-400' : 'text-stone-200'}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-stone-600">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">Related Products</h2>
            <Link to="/shop" className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
