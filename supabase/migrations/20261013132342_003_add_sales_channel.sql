/*
# Add sales_channel column to orders

1. Changes
- Added `sales_channel` column to the `orders` table (text, default 'online')
  - Tracks whether an order was placed online by a customer or in-store by an admin (offline sales / QR scan)
  - Values: 'online' (default for customer checkout) or 'offline' (admin in-store sales)
- Added `admin_id` column to the `orders` table (uuid, nullable, references auth.users)
  - For offline orders, records which admin user processed the sale
 - Backfilled existing orders to 'online'

2. Security
- No changes to RLS policies. The orders table already has owner-scoped policies for customers.
  Admin access is handled via the service role key in edge functions (not used here).
  The admin frontend uses the authenticated session, and offline orders are created with
  the admin's user_id as the order owner (so the admin can see them in their own order history too).
*/

-- Add sales_channel column
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_channel text NOT NULL DEFAULT 'online';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add admin_id column for tracking which admin processed offline sales
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Backfill existing orders to 'online'
UPDATE orders SET sales_channel = 'online' WHERE sales_channel IS NULL OR sales_channel = '';

-- Add index for filtering by sales channel
CREATE INDEX IF NOT EXISTS idx_orders_sales_channel ON orders(sales_channel);