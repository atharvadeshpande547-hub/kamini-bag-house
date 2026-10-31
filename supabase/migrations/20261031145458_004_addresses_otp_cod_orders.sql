/*
# Addresses, mobile OTP, COD payment status and order statuses

## 1. New Tables
- addresses: saved delivery addresses per customer (house, street, city, state, PIN code, optional landmark, default flag).
- otp_requests: hashed one-time codes for mobile verification. Server-only; no client access.

## 2. Modified Tables
- profiles: new phone_verified flag (true once the mobile number was verified with OTP).
- orders: new shipping_state and shipping_landmark columns.
- orders: existing rows migrated to the new status names (Pending -> Order Placed, Packed -> Processing) and COD unpaid orders set to Pending (cash not yet collected).

## 3. Security
- addresses: owner-only CRUD through row level security. One default address per customer enforced by a partial unique index.
- otp_requests: row level security enabled with no client policies; only the service role (edge functions) can read or write.
- profiles: customers can only update name and phone. Role and verification flags can no longer be changed from the browser.
- orders and order_items: admins (profiles.role = 'admin') can read all orders and update order status and payment status.

## 4. Notes
- No rows are deleted. Existing products, customers and orders are preserved.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

REVOKE UPDATE ON profiles FROM anon, authenticated;
GRANT UPDATE (name, phone) ON profiles TO authenticated;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_landmark text NOT NULL DEFAULT '';

UPDATE orders SET status = 'Order Placed' WHERE status = 'Pending';
UPDATE orders SET status = 'Processing' WHERE status = 'Packed';
UPDATE orders SET payment_status = 'Pending' WHERE payment_method = 'COD' AND payment_status = 'Unpaid';

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  house text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL CHECK (pincode ~ '^[0-9]{6}$'),
  landmark text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_one_default ON addresses(user_id) WHERE is_default;

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON addresses TO service_role;

DROP POLICY IF EXISTS "addresses_select_own" ON addresses;
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_update_own" ON addresses;
CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_delete_own" ON addresses;
CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_salt text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_phone ON otp_requests(phone, created_at DESC);

ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON otp_requests TO service_role;

DROP POLICY IF EXISTS "orders_select_admin" ON orders;
CREATE POLICY "orders_select_admin" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "order_items_select_admin" ON order_items;
CREATE POLICY "order_items_select_admin" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
