import { useEffect, useState, useRef, useCallback } from 'react';
import {
  QrCode,
  ScanLine,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  X,
  Camera,
  CameraOff,
  Receipt,
  Package,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import { finalPrice, formatCurrency, generateOrderNumber } from '@/lib/format';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface CartLine {
  product: Product;
  quantity: number;
}

export default function AdminOfflineSales() {
  const { session, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [manualSku, setManualSku] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);
  const [recentSales, setRecentSales] = useState<{ order_number: string; total: number; created_at: string }[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader-offline';

  useEffect(() => {
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('name')
      .then(({ data }) => setProducts((data as Product[]) ?? []));
    loadRecentSales();
  }, []);

  const loadRecentSales = async () => {
    const { data } = await supabase
      .from('orders')
      .select('order_number, total, created_at')
      .eq('sales_channel', 'offline')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentSales(data ?? []);
  };

  // ── QR Scanner ──────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    setScannerError('');
    setScanning(true);
    // Wait for the div to be rendered
    setTimeout(async () => {
      try {
        const el = document.getElementById(scannerDivId);
        if (!el) {
          setScannerError('Scanner element not found');
          setScanning(false);
          return;
        }
        const scanner = new Html5Qrcode(scannerDivId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            handleScan(decodedText);
          },
          () => {}
        );
      } catch {
        setScannerError('Could not access camera. Check permissions or use manual SKU entry.');
        setScanning(false);
      }
    }, 100);
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
    };
  }, []);

  const handleScan = (decoded: string) => {
    // QR codes encode product SKU. Format: "SKU:XXXX" or just "XXXX"
    const sku = decoded.startsWith('SKU:') ? decoded.slice(4).trim() : decoded.trim();
    const product = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
    if (product) {
      addToCart(product);
      // Brief flash of success
      setScannerError('');
    } else {
      setScannerError(`No product found for SKU: ${sku}`);
    }
  };

  // ── Cart operations ─────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === productId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const setQty = (productId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, quantity: Math.max(0, qty) } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // ── Manual SKU / search ─────────────────────────────────────
  const handleManualSku = () => {
    if (!manualSku.trim()) return;
    const product = products.find((p) => p.sku.toLowerCase() === manualSku.trim().toLowerCase());
    if (product) {
      addToCart(product);
      setManualSku('');
      setScannerError('');
    } else {
      setScannerError(`No product found for SKU: ${manualSku}`);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Totals ──────────────────────────────────────────────────
  const subtotal = cart.reduce(
    (sum, l) => sum + finalPrice(l.product.price, l.product.discount) * l.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + tax;

  // ── Checkout ────────────────────────────────────────────────
  const completeSale = async () => {
    if (cart.length === 0 || !session || !profile) return;
    setSubmitting(true);
    const orderNumber = generateOrderNumber();

    const { data: orderData } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        admin_id: session.user.id,
        order_number: orderNumber,
        status: 'Delivered',
        payment_status: 'Paid',
        payment_method: paymentMethod,
        sales_channel: 'offline',
        subtotal,
        discount: 0,
        delivery_charge: 0,
        tax,
        total,
        shipping_name: customerName || 'Walk-in Customer',
        shipping_phone: customerPhone,
        shipping_address: 'In-store purchase',
        shipping_city: '',
        shipping_zip: '',
        coupon_code: '',
      })
      .select('id')
      .maybeSingle();

    if (orderData) {
      const orderItems = cart.map((l) => ({
        order_id: orderData.id,
        product_id: l.product.id,
        name: l.product.name,
        price: finalPrice(l.product.price, l.product.discount),
        quantity: l.quantity,
        image_url: l.product.images[0] ?? '',
        color: '',
        size: '',
      }));
      await supabase.from('order_items').insert(orderItems);

      // Reduce stock
      for (const line of cart) {
        await supabase
          .from('products')
          .update({
            stock: Math.max(0, line.product.stock - line.quantity),
            sold_count: line.product.sold_count + line.quantity,
          })
          .eq('id', line.product.id);
      }

      setCompletedOrder(orderNumber);
      clearCart();
      setCustomerName('');
      setCustomerPhone('');
      loadRecentSales();
    }
    setSubmitting(false);
  };

  // ── Success screen ──────────────────────────────────────────
  if (completedOrder) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Sale Completed!</h1>
        <p className="text-slate-500 mb-2">Order number</p>
        <p className="text-lg font-semibold text-slate-900 mb-8">{completedOrder}</p>
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => setCompletedOrder(null)}>New Sale</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offline Sales</h1>
          <p className="text-sm text-slate-500 mt-1">Scan product QR codes to build an in-store order</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="blue">{cart.length} items in cart</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Scanner + product picker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scanner card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <ScanLine size={18} className="text-[#ff9900]" /> QR Scanner
              </h2>
              {scanning ? (
                <Button variant="outline" size="sm" onClick={stopScanner}>
                  <CameraOff size={16} /> Stop
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={startScanner}>
                  <Camera size={16} /> Start Scanning
                </Button>
              )}
            </div>

            {scanning && (
              <div className="mb-4">
                <div
                  id={scannerDivId}
                  className="w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-[#ff9900]/30"
                />
                <p className="text-center text-xs text-slate-500 mt-2">
                  Point camera at product QR code
                </p>
              </div>
            )}

            {scannerError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                <X size={16} className="shrink-0 mt-0.5" />
                <span>{scannerError}</span>
              </div>
            )}

            {/* Manual SKU entry */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Enter SKU manually
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={manualSku}
                    onChange={(e) => setManualSku(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSku()}
                    placeholder="e.g. BAG-001"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff9900]"
                  />
                </div>
                <Button variant="outline" onClick={handleManualSku}>
                  Add
                </Button>
              </div>
            </div>

            {/* Product picker toggle */}
            <div className="mt-3">
              <button
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="text-sm text-[#ff9900] font-medium hover:underline"
              >
                {showProductPicker ? 'Hide' : 'Show'} product list
              </button>
            </div>

            {showProductPicker && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products by name or SKU..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff9900]"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-4">No products found</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                          {p.images[0] && (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            SKU: {p.sku} | Stock: {p.stock}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(finalPrice(p.price, p.discount))}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(p)}
                          disabled={p.stock === 0}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent offline sales */}
          {recentSales.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <Receipt size={18} className="text-slate-400" /> Recent Offline Sales
              </h2>
              <div className="space-y-2">
                {recentSales.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium text-slate-900">{s.order_number}</span>
                    <span className="text-slate-500">
                      {new Date(s.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(s.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Cart + checkout */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#ff9900]" /> Cart
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <QrCode size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  Scan a QR code or add products manually to start
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((line) => (
                    <div
                      key={line.product.id}
                      className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                        {line.product.images[0] && (
                          <img
                            src={line.product.images[0]}
                            alt={line.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-slate-500 mb-1">
                          {formatCurrency(finalPrice(line.product.price, line.product.discount))} each
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(line.product.id, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-600"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) =>
                              setQty(line.product.id, parseInt(e.target.value) || 0)
                            }
                            className="w-10 text-center text-sm border border-slate-200 rounded py-0.5"
                          />
                          <button
                            onClick={() => updateQty(line.product.id, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-600"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeFromCart(line.product.id)}
                            className="ml-auto text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 shrink-0">
                        {formatCurrency(
                          finalPrice(line.product.price, line.product.discount) * line.quantity
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Customer info */}
                <div className="space-y-3 mb-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Customer name (optional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Walk-in Customer"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff9900]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff9900]"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div className="mb-4 border-t border-slate-100 pt-4">
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Payment method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash', 'Card', 'UPI'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`px-2 py-2 text-xs font-medium rounded-lg border transition-all ${
                          paymentMethod === m
                            ? 'border-[#ff9900] bg-[#ff9900]/10 text-[#1a2433]'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-1.5 text-sm border-t border-slate-100 pt-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax (5%)</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total</span>
                    <span className="text-[#ff9900]">{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={completeSale}
                  disabled={submitting || cart.length === 0}
                >
                  {submitting ? 'Processing...' : `Complete Sale - ${formatCurrency(total)}`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
