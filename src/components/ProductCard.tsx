import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';
import { finalPrice, formatCurrency } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import Rating from '@/components/ui/Rating';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  currencySymbol?: string;
}

export default function ProductCard({ product, currencySymbol = '₹' }: ProductCardProps) {
  const { session } = useAuth();
  const { addToCart } = useCart();
  const [wished, setWished] = useState(false);
  const fp = finalPrice(product.price, product.discount);

  const toggleWishlist = async () => {
    if (!session) return;
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

  return (
    <div className="group relative bg-white rounded-xl border border-stone-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-stone-300">
      <Link to={`/product/${product.slug}`} className="block relative overflow-hidden aspect-square bg-stone-50">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && <Badge color="blue">New</Badge>}
          {product.is_bestseller && <Badge color="amber">Bestseller</Badge>}
          {product.is_featured && <Badge color="purple">Featured</Badge>}
          {product.discount > 0 && (
            <Badge color="red">-{product.discount}%</Badge>
          )}
        </div>
      </Link>

      <button
        onClick={toggleWishlist}
        disabled={!session}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm transition-all hover:bg-white disabled:opacity-40"
        aria-label="Toggle wishlist"
      >
        <Heart
          size={18}
          className={wished ? 'fill-red-500 text-red-500' : 'text-stone-600'}
        />
      </button>

      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-stone-900 text-sm leading-snug line-clamp-2 hover:text-stone-700 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5">
          <Rating value={product.rating} count={product.num_reviews} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-stone-900">
            {formatCurrency(fp, currencySymbol)}
          </span>
          {product.discount > 0 && (
            <span className="text-sm text-stone-400 line-through">
              {formatCurrency(product.price, currencySymbol)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span
            className={`text-xs font-medium ${
              product.stock === 0
                ? 'text-red-600'
                : product.stock <= 10
                  ? 'text-amber-600'
                  : 'text-green-600'
            }`}
          >
            {product.stock === 0
              ? 'Out of Stock'
              : product.stock <= 10
                ? `Only ${product.stock} left`
                : 'In Stock'}
          </span>
          <button
            onClick={() => addToCart(product.id, 1, product.colors[0] ?? '', product.sizes[0] ?? '')}
            disabled={product.stock === 0 || !session}
            className="w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center transition-all hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add to cart"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
