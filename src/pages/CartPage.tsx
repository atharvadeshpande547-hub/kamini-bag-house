import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { finalPrice, formatCurrency } from '@/lib/format';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, loading } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-stone-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Please Sign In</h1>
        <p className="text-stone-500 mb-6">You need to be logged in to view your cart.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-10 h-10 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-stone-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Your Cart is Empty</h1>
        <p className="text-stone-500 mb-6">Browse our collection and find your perfect bag.</p>
        <Link to="/shop">
          <Button>Start Shopping <ArrowRight size={16} /></Button>
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, i) => sum + finalPrice(i.product?.price ?? 0, i.product?.discount ?? 0) * i.quantity,
    0
  );
  const deliveryCharge = subtotal > 100 ? 0 : 9.99;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + deliveryCharge + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const fp = finalPrice(product.price, product.discount);
            return (
              <div
                key={item.id}
                className="flex gap-4 bg-white border border-stone-200 rounded-xl p-4"
              >
                <Link to={`/product/${product.slug}`} className="shrink-0">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-50">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-medium text-stone-900 text-sm line-clamp-1 hover:text-stone-700">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.size && <span>Size: {item.size}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-stone-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900">{formatCurrency(fp * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-stone-200 rounded-xl p-6 sticky top-24">
            <h2 className="font-semibold text-stone-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-medium text-stone-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery</span>
                <span className="font-medium text-stone-900">
                  {deliveryCharge === 0 ? 'Free' : formatCurrency(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tax (5%)</span>
                <span className="font-medium text-stone-900">{formatCurrency(tax)}</span>
              </div>
              {deliveryCharge > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Add {formatCurrency(100 - subtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-stone-100 pt-3 flex justify-between">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="text-lg font-bold text-stone-900">{formatCurrency(total)}</span>
              </div>
            </div>
            <Button fullWidth size="lg" className="mt-6" onClick={() => navigate('/checkout')}>
              Proceed to Checkout <ArrowRight size={16} />
            </Button>
            <Link to="/shop" className="block text-center text-sm text-stone-600 hover:text-stone-900 mt-4">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
