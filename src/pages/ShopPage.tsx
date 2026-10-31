import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';

type SortKey = 'newest' | 'price-low' | 'price-high' | 'best-rated' | 'popular';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const categoryFilter = searchParams.get('category') ?? '';
  const searchQuery = searchParams.get('search') ?? '';
  const sort = (searchParams.get('sort') as SortKey) ?? 'newest';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const ratingFilter = searchParams.get('rating') ?? '';
  const availability = searchParams.get('availability') ?? '';
  const discountOnly = searchParams.get('discount') === 'true';

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data as Category[] ?? []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from('products').select('*, category:categories(*)');

    if (categoryFilter) {
      const cat = categories.find((c) => c.slug === categoryFilter);
      if (cat) query = query.eq('category_id', cat.id);
    }
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    query.then(({ data }) => {
      let result = (data as Product[]) ?? [];

      // Client-side filters
      if (minPrice) result = result.filter((p) => p.price >= parseFloat(minPrice));
      if (maxPrice) result = result.filter((p) => p.price <= parseFloat(maxPrice));
      if (ratingFilter) result = result.filter((p) => p.rating >= parseFloat(ratingFilter));
      if (availability === 'in-stock') result = result.filter((p) => p.stock > 0);
      if (availability === 'out-of-stock') result = result.filter((p) => p.stock === 0);
      if (discountOnly) result = result.filter((p) => p.discount > 0);

      // Sort
      switch (sort) {
        case 'price-low':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'best-rated':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'popular':
          result.sort((a, b) => b.sold_count - a.sold_count);
          break;
        default:
          result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setProducts(result);
      setLoading(false);
      setPage(1);
    });
  }, [categoryFilter, searchQuery, sort, minPrice, maxPrice, ratingFilter, availability, discountOnly, categories]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, page]);

  const totalPages = Math.ceil(products.length / pageSize);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = [categoryFilter, minPrice, maxPrice, ratingFilter, availability, discountOnly ? 'true' : ''].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              checked={!categoryFilter}
              onChange={() => updateParam('category', '')}
              className="accent-stone-900"
            />
            <span className="text-sm text-stone-600">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={categoryFilter === cat.slug}
                onChange={() => updateParam('category', cat.slug)}
                className="accent-stone-900"
              />
              <span className="text-sm text-stone-600">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
          />
          <span className="text-stone-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Minimum Rating</h3>
        <div className="space-y-2">
          {['4', '3', '2', '1'].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={ratingFilter === r}
                onChange={() => updateParam('rating', r)}
                className="accent-stone-900"
              />
              <span className="text-sm text-stone-600">{r}★ & up</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="rating"
              checked={!ratingFilter}
              onChange={() => updateParam('rating', '')}
              className="accent-stone-900"
            />
            <span className="text-sm text-stone-600">All ratings</span>
          </label>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-sm font-semibold text-stone-900 mb-3">Availability</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={!availability}
              onChange={() => updateParam('availability', '')}
              className="accent-stone-900"
            />
            <span className="text-sm text-stone-600">All</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={availability === 'in-stock'}
              onChange={() => updateParam('availability', 'in-stock')}
              className="accent-stone-900"
            />
            <span className="text-sm text-stone-600">In Stock</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={availability === 'out-of-stock'}
              onChange={() => updateParam('availability', 'out-of-stock')}
              className="accent-stone-900"
            />
            <span className="text-sm text-stone-600">Out of Stock</span>
          </label>
        </div>
      </div>

      {/* Discount */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={(e) => updateParam('discount', e.target.checked ? 'true' : '')}
            className="accent-stone-900"
          />
          <span className="text-sm font-semibold text-stone-900">On Sale Only</span>
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop' }]} />

      <div className="mt-6 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900">
          {categoryFilter
            ? categories.find((c) => c.slug === categoryFilter)?.name ?? 'Shop'
            : searchQuery
              ? `Results for "${searchQuery}"`
              : 'All Products'}
        </h1>
        <p className="text-stone-500 mt-1">
          {loading ? 'Loading...' : `${products.length} products found`}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar - desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-900 flex items-center gap-2">
                <SlidersHorizontal size={16} /> Filters
              </h2>
              {activeFilterCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <FilterPanel />
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Sort + mobile filter toggle */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-700"
            >
              <SlidersHorizontal size={16} /> Filters
              {activeFilterCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-stone-500 hidden sm:inline">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="best-rated">Best Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-stone-100 rounded-xl aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : pagedProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-500 text-lg">No products found matching your filters.</p>
              <button onClick={clearFilters} className="mt-4 text-amber-600 hover:text-amber-700 font-medium">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {pagedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                        page === i + 1
                          ? 'bg-stone-900 text-white'
                          : 'border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-900">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="text-stone-400">
                <X size={20} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
}
