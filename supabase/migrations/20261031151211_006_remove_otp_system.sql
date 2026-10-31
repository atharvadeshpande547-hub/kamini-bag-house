/*
# Remove the mobile OTP verification system

1. Removed
- `otp_requests` table: it held only short-lived one-time codes used during registration. It contains no customer, order, or address data.

2. Unchanged
- `profiles.phone_verified` column is kept so existing rows stay intact. The app no longer sets or displays it.
- Customer accounts, profiles, addresses, orders, and products are not touched.

3. Security
- No policies or grants are added or removed for remaining tables.

4. Notes
- Registration still collects and stores the mobile number, without verification.
*/

DROP TABLE IF EXISTS otp_requests;
