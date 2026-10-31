/*
# Lock order updates to admins and customer cancellation, and close OTP table grants

1. Changes
- Customers can no longer update orders directly. The `orders_update_own` policy is dropped.
- A new `cancel_own_order(order_id)` function lets a customer cancel their own order, only while it is 'Order Placed' or 'Confirmed'.
- The OTP table is no longer reachable by the public API roles (anon, authenticated). Only the server-side service role can use it.

2. Security
- Order status and payment status can only be changed by admins (existing `orders_update_admin` policy).
- `cancel_own_order` runs as its owner, checks ownership and status itself, and is executable only by authenticated users.
- The OTP table keeps RLS enabled with no client policies.

3. Notes
- No data is removed or altered.
- Order inserts from customers are forced to COD, 'Order Placed' and 'Pending' by a trigger, so a client cannot submit a paid or advanced order.
*/

DROP POLICY IF EXISTS "orders_update_own" ON orders;
REVOKE UPDATE ON orders FROM anon;
REVOKE UPDATE ON orders FROM authenticated;
GRANT UPDATE ON orders TO authenticated;

CREATE OR REPLACE FUNCTION cancel_own_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orders
     SET status = 'Cancelled'
   WHERE id = p_order_id
     AND user_id = auth.uid()
     AND status IN ('Order Placed', 'Confirmed');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This order can no longer be cancelled.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION cancel_own_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION cancel_own_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION enforce_customer_order_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    NEW.status := 'Order Placed';
    NEW.payment_status := 'Pending';
    NEW.payment_method := 'COD';
    NEW.sales_channel := 'online';
    NEW.admin_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_enforce_customer_defaults ON orders;
CREATE TRIGGER orders_enforce_customer_defaults
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_customer_order_defaults();

REVOKE ALL ON otp_requests FROM anon, authenticated;
GRANT ALL ON otp_requests TO service_role;
