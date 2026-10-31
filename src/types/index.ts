export interface Profile {
  id: string;
  name: string;
  phone: string;
  role: 'customer' | 'admin';
  is_disabled: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  created_at: string;
  product_count?: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  images: string[];
  material: string;
  colors: string[];
  sizes: string[];
  dimensions: string;
  weight: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  rating: number;
  num_reviews: number;
  sold_count: number;
  created_at: string;
  category?: Category | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: Profile | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  color: string;
  size: string;
  created_at: string;
  product?: Product | null;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  color: string;
  size: string;
}

export type PaymentStatus = 'Pending' | 'Paid' | 'Unpaid';

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  tax: number;
  total: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_landmark: string;
  coupon_code: string;
  created_at: string;
  order_items?: OrderItem[];
  profiles?: Profile | null;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface Address {
  id: string;
  user_id: string;
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  is_default: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_value: number;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  contact_email: string;
  store_phone: string;
  shipping_charge: number;
  min_order_value: number;
  tax_percentage: number;
  currency: string;
  currency_symbol: string;
  logo_url: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const PAYMENT_STATUSES: PaymentStatus[] = ['Pending', 'Paid', 'Unpaid'];
