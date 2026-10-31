import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones, Quote } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category, Review } from '@/types';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<(Review & { profiles?: { name: string } | null })[]>([]);

  useEffect(() => {
    Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_featured', true)
        .limit(4)
        .then(({ data }) => data as Product[] | null),
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_new', true)
        .order('created_at', { ascending: false })
        .limit(4)
        .then(({ data }) => data as Product[] | null),
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_bestseller', true)
        .limit(4)
        .then(({ data }) => data as Product[] | null),
      supabase
        .from('categories')
        .select('*')
        .order('name')
        .then(({ data }) => data as Category[] | null),
      supabase
        .from('reviews')
        .select('*, profiles!reviews_user_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(3)
        .then(({ data }) => data as (Review & { profiles?: { name: string } | null })[] | null),
    ]).then(([f, n, b, c, r]) => {
      setFeatured(f ?? []);
      setNewArrivals(n ?? []);
      setBestsellers(b ?? []);
      setCategories(c ?? []);
      setReviews(r ?? []);
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-stone-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                New Collection 2026
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight tracking-tight">
                Carry Your World in <span className="text-amber-500">Style</span>
              </h1>
              <p className="text-lg text-stone-600 leading-relaxed max-w-md">
                Discover premium bags crafted for every occasion. From rugged
                backpacks to elegant handbags, find your perfect companion.
              </p>
              <div className="flex items-center gap-4">
                <Link to="/shop">
                  <Button size="lg">
                    Shop Collection <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/shop?category=backpacks">
                  <Button variant="outline" size="lg">
                    Explore Backpacks
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-2xl font-bold text-stone-900">25+</p>
                  <p className="text-sm text-stone-500">Products</p>
                </div>
                <div className="w-px h-10 bg-stone-300" />
                <div>
                  <p className="text-2xl font-bold text-stone-900">8</p>
                  <p className="text-sm text-stone-500">Categories</p>
                </div>
                <div className="w-px h-10 bg-stone-300" />
                <div>
                  <p className="text-2xl font-bold text-stone-900">10K+</p>
                  <p className="text-sm text-stone-500">Happy Customers</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/35666033/pexels-photo-35666033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Premium bags collection"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white hidden md:block">
                <img
                  src="https://images.pexels.com/photos/26965826/pexels-photo-26965826.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Leather crossbody"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $100' },
              { icon: ShieldCheck, title: 'Secure Payment', desc: '100% protected checkout' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
              { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-stone-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{f.title}</p>
                  <p className="text-xs text-stone-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900">Shop by Category</h2>
            <p className="text-stone-500 mt-1">Find exactly what you need</p>
          </div>
          <Link to="/shop" className="text-sm font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 4).map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
        {categories.length > 4 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {categories.slice(4, 8).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </section>

      {/* Featured products */}
      <section className="bg-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-stone-900">Featured Products</h2>
              <p className="text-stone-500 mt-1">Handpicked favorites just for you</p>
            </div>
            <Link to="/shop" className="text-sm font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="relative rounded-2xl overflow-hidden bg-stone-900">
          <div className="absolute inset-0">
            <img
              src="https://images.pexels.com/photos/9267583/pexels-photo-9267583.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Sale"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          <div className="relative px-8 py-14 md:px-16 md:py-20 text-center">
            <span className="inline-block px-4 py-1.5 bg-amber-500 text-white rounded-full text-sm font-medium mb-4">
              Limited Time Offer
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Up to 25% Off Travel Collection
            </h2>
            <p className="text-stone-300 text-lg mb-6 max-w-xl mx-auto">
              Gear up for your next adventure with our premium travel bags at unbeatable prices.
            </p>
            <Link to="/shop?category=travel-bags">
              <Button variant="secondary" size="lg">
                Shop Travel Bags <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900">New Arrivals</h2>
            <p className="text-stone-500 mt-1">Fresh additions to our collection</p>
          </div>
          <Link to="/shop" className="text-sm font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="bg-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-stone-900">Best Sellers</h2>
              <p className="text-stone-500 mt-1">Customer favorites this season</p>
            </div>
            <Link to="/shop" className="text-sm font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Customer reviews */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900">What Our Customers Say</h2>
          <p className="text-stone-500 mt-1">Real reviews from real shoppers</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.length > 0 ? reviews.map((r) => (
            <div key={r.id} className="bg-white border border-stone-200 rounded-xl p-6">
              <Quote size={28} className="text-amber-400 mb-3" />
              <p className="text-stone-700 text-sm leading-relaxed mb-4">"{r.comment}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {r.profiles?.name ?? 'Anonymous'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={s <= r.rating ? 'text-amber-400' : 'text-stone-200'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <p className="text-stone-500 text-center col-span-3">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </section>
    </div>
  );
}
