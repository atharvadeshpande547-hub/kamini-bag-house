export function finalPrice(price: number, discount: number): number {
  return Math.round(price * (1 - discount / 100) * 100) / 100;
}

export function formatCurrency(
  amount: number,
  symbol: string = '₹'
): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}-${random}`;
}

export function stockStatus(stock: number): {
  label: string;
  color: string;
} {
  if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600' };
  if (stock <= 10) return { label: 'Low Stock', color: 'text-amber-600' };
  return { label: 'In Stock', color: 'text-green-600' };
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
