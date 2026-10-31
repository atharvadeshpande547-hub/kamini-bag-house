import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Banknote, MapPin, ShoppingBag, Tag, CheckCircle2, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { finalPrice, formatCurrency, generateOrderNumber } from '@/lib/format';
import { formatAddressLine } from '@/lib/validation';
import type { Address } from '@/types';
import Button from '@/components/ui/Button';
import AddressSelector from '@/components/checkout/AddressSelector';

const steps = ['Address', 'Review', 'Payment'];

interface Confirmation {
  orderNumber: string;
  total: number;
  address: string;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { session, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Please Sign In</h1>
        <p className="text-stone-500 mb-6">You need to be logged in to checkout.</p>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Order Placed!</h1>
        <p className="text-stone-500 mb-2">Thank you for your purchase.</p>
        <p className="text-lg font-semibold text-stone-900 mb-6">Order ID: {confirmation.orderNumber}</p>
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-left space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <Banknote size={20} className="text-stone-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-stone-900">Payment: Cash on Delivery</p>
              <p className="text-xs text-stone-500">
                Pay {formatCurrency(confirmation.total)} in cash when your order arrives. Payment status: Pending.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-stone-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-stone-900">Delivering to</p>
              <p className="text-xs text-stone-500">{confirmation.address}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link to="/profile/orders"><Button>View My Orders</Button></Link>
          <Link to="/shop"><Button variant="outline">Continue Shopping</Button></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-stone-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Your Cart is Empty</h1>
        <Link to="/shop"><Button>Start Shopping</Button></Link>
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, i) => sum + finalPrice(i.product?.price ?? 0, i.product?.discount ?? 0) * i.quantity,
    0
  );
  const discount = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? Math.round(subtotal * (appliedCoupon.value / 100) * 100) / 100
      : appliedCoupon.value
    : 0;
  const deliveryCharge = subtotal > 100 ? 0 : 9.99;
  const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100;
  const total = subtotal - discount + deliveryCharge + tax;

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();
    if (error) {
      setCouponError('Could not check this coupon. Please try again.');
      return;
    }
    if (!data) {
      setCouponError('Invalid or expired coupon code');
      setAppliedCoupon(null);
      return;
    }
    if (data.min_order_value && subtotal < data.min_order_value) {
      setCouponError(`Minimum order of ${formatCurrency(data.min_order_value)} required`);
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon({ code: data.code, type: data.type, value: data.value });
    setCouponCode('');
  };

  const handleSelectAddress = (address: Address | null) => {
    setSelectedAddress(address);
    setSelectedAddressId(address?.id ?? null);
  };

  const placeOrder = async () => {
    if (!selectedAddress || !profile) return;
    setSubmitting(true);
    setOrderError('');
    const orderNumber = generateOrderNumber();
    const addressLine = formatAddressLine(selectedAddress);

    const { data: orderData, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        order_number: orderNumber,
        status: 'Order Placed',
        payment_status: 'Pending',
        payment_method: 'COD',
        subtotal,
        discount,
        delivery_charge: deliveryCharge,
        tax,
        total,
        shipping_name: profile.name,
        shipping_phone: profile.phone,
        shipping_address: `${selectedAddress.house}, ${selectedAddress.street}`,
        shipping_landmark: selectedAddress.landmark,
        shipping_city: selectedAddress.city,
        shipping_state: selectedAddress.state,
        shipping_zip: selectedAddress.pincode,
        coupon_code: appliedCoupon?.code ?? '',
      })
      .select('id')
      .maybeSingle();

    if (orderInsertError || !orderData) {
      setOrderError('We could not place your order. Please try again.');
      setSubmitting(false);
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: orderData.id,
      product_id: i.product_id,
      name: i.product?.name ?? '',
      price: finalPrice(i.product?.price ?? 0, i.product?.discount ?? 0),
      quantity: i.quantity,
      image_url: i.product?.images[0] ?? '',
      color: i.color,
      size: i.size,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      setOrderError(`Your order ${orderNumber} was received, but its items could not be saved. Please contact support.`);
      setSubmitting(false);
      return;
    }

    for (const item of items) {
      if (!item.product) continue;
      const { error: stockError } = await supabase
        .from('products')
        .update({
          stock: Math.max(0, item.product.stock - item.quantity),
          sold_count: item.product.sold_count + item.quantity,
        })
        .eq('id', item.product_id);
      if (stockError) console.error('Stock update failed for', item.product_id, stockError.message);
    }

    await clearCart();
    setConfirmation({ orderNumber, total, address: addressLine });
    setSubmitting(false);
  };

  const canProceed = () => {
    if (step === 0) return selectedAddress !== null;
    return true;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-6">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 max-w-2xl">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
                }`}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${i <= step ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${i < step ? 'bg-green-500' : 'bg-stone-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 0: Delivery address */}
          {step === 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <MapPin size={18} /> Delivery Address
              </h2>
              <AddressSelector userId={session.user.id} selectedId={selectedAddressId} onSelect={handleSelectAddress} />
            </div>
          )}

          {/* Step 1: Review */}
          {step === 1 && (
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <h2 className="font-semibold text-stone-900 mb-4">Order Review</h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const product = item.product;
                  if (!product) return null;
                  const fp = finalPrice(product.price, product.discount);
                  return (
                    <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-stone-100 last:border-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-50 shrink-0">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-stone-500">
                          Qty: {item.quantity}
                          {item.color && ` | ${item.color}`}
                          {item.size && ` | ${item.size}`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-stone-900">{formatCurrency(fp * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              <div className="mt-6 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={applyCoupon}>Apply</Button>
                </div>
                {couponError && <p className="text-xs text-red-600 mt-2">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-xs text-green-600 mt-2">
                    Coupon "{appliedCoupon.code}" applied - You saved {formatCurrency(discount)}!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && selectedAddress && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-stone-900 mb-4">Payment Method</h2>
                <div className="flex items-start gap-3 p-4 border-2 border-stone-900 bg-stone-50 rounded-xl">
                  <Banknote size={22} className="text-stone-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Cash on Delivery</p>
                    <p className="text-xs text-stone-500">Pay in cash when your order is delivered to you.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-stone-900">Delivering to</h3>
                  <button type="button" onClick={() => setStep(0)} className="text-xs font-medium text-amber-600 hover:text-amber-700">
                    Change
                  </button>
                </div>
                <p className="text-sm text-stone-700">{profile?.name} | {profile?.phone}</p>
                <p className="text-sm text-stone-600 leading-relaxed">{formatAddressLine(selectedAddress)}</p>
              </div>

              {orderError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{orderError}</div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            ) : (
              <Link to="/cart"><Button variant="outline">Back to Cart</Button></Link>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Continue
              </Button>
            ) : (
              <Button variant="secondary" onClick={placeOrder} disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  `Place Order - ${formatCurrency(total)}`
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-stone-200 rounded-xl p-6 sticky top-24">
            <h2 className="font-semibold text-stone-900 mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery</span>
                <span className="font-medium">{deliveryCharge === 0 ? 'Free' : formatCurrency(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tax</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="border-t border-stone-100 pt-2 flex justify-between">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="text-lg font-bold text-stone-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between pt-2 text-xs text-stone-500">
                <span>Payment</span>
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
