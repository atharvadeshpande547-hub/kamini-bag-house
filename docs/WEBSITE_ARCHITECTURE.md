# Kamini Bag House: Website Architecture and Data Flow

This document explains how the storefront, admin dashboard, Supabase database, authentication, shopping cart, checkout, and deployment fit together.

## 1. System overview

Kamini Bag House is a React single-page e-commerce application built with Vite and TypeScript.

```text
Browser
  |
  | React pages, contexts, and Supabase browser client
  |
Supabase
  |-- Auth: email/password users and sessions
  |-- PostgreSQL: products, categories, profiles, carts, orders, reviews, settings
  |-- Row Level Security: controls which rows each user can access
  |-- Edge Function: secure customer registration

Vercel
  |-- Builds the Vite application
  |-- Serves the generated static files
  |-- Rewrites application routes to index.html
```

The browser uses the Supabase publishable/anon key. It does not use the service-role key. Database security is enforced by Supabase Row Level Security, not by hiding database operations in the UI.

## 2. Technology stack

- **React 18**: renders pages and reusable interface elements.
- **TypeScript**: provides types for products, orders, profiles, addresses, and other data.
- **Vite**: development server and production bundler.
- **Tailwind CSS**: styling and responsive layouts.
- **React Router**: client-side URLs such as `/shop` and `/product/:slug`.
- **Supabase JS**: browser connection to Supabase Auth and the PostgreSQL Data API.
- **Lucide React**: interface icons.
- **Pexels URLs**: product and promotional image references stored or used as remote URLs.

The main commands are defined in `package.json`:

- `npm run build`: creates the production bundle in `dist`.
- `npm run typecheck`: checks TypeScript without emitting files.
- `npm run lint`: checks code style and common mistakes.

## 3. Application startup

The browser starts at `src/main.tsx`.

1. React finds the `<div id="root">` element in `index.html`.
2. `main.tsx` renders `<App />` inside React Strict Mode.
3. `index.css` loads the global styles.
4. `App.tsx` creates the application providers and router.

Provider order:

```text
BrowserRouter
  AuthProvider
    CartProvider
      AppRoutes
```

This order matters:

- The router makes navigation available to every page.
- `AuthProvider` loads the Supabase session and profile.
- `CartProvider` depends on the current session to load the signed-in user's cart.
- Routes render only after those shared services are available.

## 4. Routing and page access

Routes are defined in `src/App.tsx`.

### Public customer pages

- `/`: homepage
- `/shop`: product listing, filtering, sorting, and pagination
- `/product/:slug`: product details, images, reviews, related products
- `/login`: customer login
- `/register`: customer registration
- `/forgot-password`: password recovery
- `/cart`: shopping cart
- `/admin/login`: administrator login screen

### Signed-in customer pages

- `/checkout`: address selection, order review, coupon, and COD checkout
- `/profile`: profile, orders, wishlist, and address management
- `/profile/orders`: orders view
- `/profile/wishlist`: wishlist view

`ProtectedRoute` checks whether a Supabase session exists. If there is no session, it redirects to `/login`.

### Administrator pages

- `/admin/dashboard`
- `/admin/products`
- `/admin/categories`
- `/admin/inventory`
- `/admin/orders`
- `/admin/customers`
- `/admin/sales`
- `/admin/offline-sales`
- `/admin/coupons`
- `/admin/reviews`
- `/admin/settings`

`AdminRoute` checks the loaded profile's `role`. Only a profile with `role = 'admin'` can enter the admin layout and pages.

Because the application uses `BrowserRouter`, Vercel must rewrite unknown application paths to `index.html`. This is configured in `vercel.json`; static files under `/assets` must still be served normally.

## 5. Supabase client and environment variables

The browser client is created in `src/lib/supabase.ts`.

The exact browser variables are:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Vite replaces `VITE_*` values at build time. This means the variables must exist in Vercel before the deployment build starts. Changing them requires a new deployment.

`VITE_SUPABASE_ANON_KEY` is intended for browser use. Never put any of these server-only values in frontend code or Vercel browser-exposed variables:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
```

The current client enables:

- `persistSession: true`: keeps the signed-in session across page refreshes.
- `autoRefreshToken: true`: refreshes the Supabase access token when needed.

The client now fails early with a clear error if either required browser variable is missing, instead of generating malformed API requests.

## 6. Authentication flow

Authentication uses Supabase Auth email/password accounts. The application does not create a separate password table.

### Existing user login

1. The user submits email and password on `LoginPage`.
2. `AuthContext.signIn()` calls `supabase.auth.signInWithPassword()`.
3. Supabase returns a session.
4. `AuthProvider` stores the session and loads the matching `profiles` row.
5. Protected routes become available.

### New customer registration

Registration uses the deployed `register-customer` Supabase Edge Function.

1. `RegisterPage` validates the form.
2. `AuthContext.signUp()` calls `registerCustomer()` in `src/lib/accountApi.ts`.
3. `accountApi.ts` sends the registration data to `/functions/v1/register-customer` with the anon key.
4. The Edge Function validates name, email, password, phone, address, and PIN code.
5. The Edge Function uses the server-only service-role key internally to create the Auth user.
6. The database trigger creates the initial profile row, or the function updates the profile details.
7. The function inserts the customer's first address as the default address.
8. If profile or address creation fails, the function deletes the newly created Auth user so partial registration is not left behind.
9. The browser signs the customer in with email and password.

The Edge Function has CORS headers for preflight, success, and error responses. Its source is `supabase/functions/register-customer/index.ts`, and its deployment setting is in `supabase/config.toml`.

### Session restoration

When the app starts, `AuthProvider` calls `supabase.auth.getSession()` and then subscribes to `onAuthStateChange`.

The auth listener wraps asynchronous profile loading in a separate async block. This avoids calling another Supabase method directly inside the synchronous auth event callback, which can otherwise deadlock.

## 7. Database tables

The current Supabase schema contains these application tables.

### Catalog tables

#### `categories`

Stores product categories.

Important columns:

- `id`: UUID primary key
- `name`: display name
- `slug`: unique URL/filter value
- `image_url`: category image reference
- `created_at`: creation timestamp

#### `products`

Stores the catalog items shown to shoppers and administrators.

Important columns:

- `id`: UUID primary key
- `category_id`: optional foreign key to `categories.id`
- `name`, `slug`, `sku`
- `description`
- `price`, `discount`
- `stock`
- `images`: text array of image URLs
- `material`, `colors`, `sizes`, `dimensions`, `weight`
- `is_featured`, `is_bestseller`, `is_new`
- `rating`, `num_reviews`, `sold_count`
- `created_at`

A product query commonly uses:

```ts
supabase
  .from('products')
  .select('*, category:categories(*)')
```

The `category:categories(*)` part is a Supabase relationship selection. It works because `products.category_id` references `categories.id`.

### Customer and commerce tables

#### `profiles`

Stores application profile data connected to `auth.users`.

- `id`: same UUID as the Auth user
- `name`
- `phone`
- `role`: `customer` or `admin`
- `is_disabled`
- `phone_verified`
- `created_at`

#### `addresses`

Stores private customer delivery addresses.

- `user_id` identifies the owner
- `house`, `street`, `city`, `state`, `pincode`, `landmark`
- `is_default`
- `created_at`

Address functions are in `src/lib/addresses.ts`.

#### `cart_items`

Stores the signed-in customer's persistent cart.

- `user_id`
- `product_id`
- `quantity`
- `color`, `size`
- `created_at`

#### `wishlist_items`

Stores products saved by a signed-in customer.

#### `orders`

Stores customer and offline/admin orders.

Important fields include:

- `user_id`
- `order_number`
- `status`
- `payment_status`
- `payment_method`
- `subtotal`, `discount`, `delivery_charge`, `tax`, `total`
- shipping name, phone, address, city, state, ZIP, and landmark
- `sales_channel`
- `admin_id`
- `created_at`

#### `order_items`

Stores the product snapshot for each order line.

It records the product ID plus name, price, quantity, image URL, color, and size. Storing the name and price on the order item preserves what the customer ordered even if the catalog changes later.

#### `reviews`

Stores product reviews.

- `product_id`
- `user_id`
- `rating` from 1 to 5
- `comment`
- `created_at`

Reviews reference `auth.users` through `reviews_user_id_fkey`, not `profiles`. The frontend therefore loads review rows first and then safely matches profile names by ID in `src/lib/reviews.ts`. It must not use `profiles!reviews_user_id_fkey` because that relationship does not exist.

#### `coupons`

Stores coupon codes, percentage/fixed discount values, minimum order amounts, expiry dates, and active status.

#### `store_settings`

Stores store-wide values such as store name, contact details, shipping charge, tax percentage, currency, and logo URL.

## 8. Row Level Security

RLS is enabled on all public application tables.

### Public read data

Anonymous visitors can read catalog and presentation data such as:

- products
- categories
- public reviews
- active store settings
- coupon lookup data used by checkout, according to the current policies

### Private customer data

Signed-in customers are scoped by `auth.uid()`.

- Profiles: customer can read/update their own profile.
- Addresses: customer can read, insert, update, and delete their own addresses.
- Cart items: customer can read and change their own cart.
- Wishlist items: customer can read and change their own wishlist.
- Orders: customer can read their own orders and create orders for themselves.
- Order items: customer can access items through orders they own.
- Reviews: customer can create and manage their own review rows; reviews are publicly readable.

### Administrator access

Administrator operations are guarded by profile role checks. Admin policies allow approved administrator profiles to manage catalog, customer, order, coupon, review, and settings data according to each table's policies.

The service-role key is not a substitute for RLS in browser code. It is used only by the registration Edge Function, which runs outside the browser.

## 9. Homepage data flow

`HomePage.tsx` loads five independent data sets:

1. Featured products from `products` where `is_featured = true`.
2. New products from `products` where `is_new = true`, newest first.
3. Bestseller products from `products` where `is_bestseller = true`.
4. All categories from `categories`, sorted by name.
5. Recent reviews from `reviews`, followed by profile-name enrichment.

Each product query includes its category using the valid `products → categories` relationship.

The homepage uses `Promise.all`, so all requests must succeed for the page to show its normal product sections. Errors are now caught and shown visibly instead of being silently converted into empty arrays.

## 10. Shop and product detail data flow

### Shop page

`ShopPage.tsx` first loads categories. It then loads products with their category relation.

Server-side query filters:

- Category ID
- Product name search

Client-side filters:

- Minimum price
- Maximum price
- Minimum rating
- In-stock/out-of-stock
- Discounted products only

Client-side sorting supports newest, price low-to-high, price high-to-low, best-rated, and most popular. Pagination displays 12 products per page.

### Product detail page

`ProductDetailPage.tsx` loads one product by its unique `slug`.

If found, it additionally loads:

- Related products with the same `category_id`
- Reviews for the product
- Profile names for those reviews
- Wishlist status for the current signed-in user

The page reads image URLs from the product `images` text array. Images are remote URLs; the browser does not upload or serve them through the application bundle.

## 11. Cart flow

`CartProvider` in `src/context/CartContext.tsx` owns cart state for the app.

When a session exists:

1. It queries `cart_items` filtered by the current user ID.
2. It joins each item to its product using `product:products(*)`.
3. It stores the result in React state.

When adding a product:

- If the same product, color, and size already exist, quantity is increased.
- Otherwise a new `cart_items` row is inserted.

Quantity updates, removal, and clearing the cart update Supabase first and then update the visible state.

When the user signs out, cart state is cleared from memory. The database rows remain associated with that account.

## 12. Checkout and Cash on Delivery

Checkout is protected by authentication and uses three visible stages:

1. Address selection
2. Order review and coupon
3. Cash on Delivery confirmation

The totals are calculated from the current cart:

- Subtotal uses product price after discount.
- Delivery is free above the configured threshold used by the page; otherwise the current delivery charge is applied.
- Tax is calculated from the discounted subtotal.
- Coupon discount is applied when a matching active coupon is found.

When the customer places the order:

1. The selected address and profile data are copied into the order shipping fields.
2. A new `orders` row is inserted with `payment_method = 'COD'` and `payment_status = 'Pending'`.
3. Current cart lines are inserted into `order_items`.
4. Product stock and sold counts are updated.
5. The cart is cleared.
6. The confirmation screen displays the order number, total, address, and COD instructions.

There is no card payment gateway in the current flow. Cash on Delivery is the only payment method exposed by checkout.

## 13. Admin data flow

Admin pages use the same Supabase client but are protected by both routing and database policies.

Examples:

- Products page reads and writes `products`.
- Categories page reads and writes `categories`.
- Inventory page reads products and updates stock.
- Orders page reads orders and order items, then changes permitted order statuses.
- Customers page reads profiles and customer-related order data.
- Sales page calculates reports from order data.
- Coupons page manages `coupons`.
- Reviews page loads reviews, products, and profile names.
- Settings page manages the single `store_settings` row.

The route guard prevents ordinary customers from opening admin screens, while RLS policies protect the database if someone attempts to call the REST API directly.

## 14. Error handling and debugging

Supabase requests return `{ data, error }`. Important rules for debugging:

1. Always inspect `error` before using `data`.
2. Check the browser Network panel for the exact request URL, status, and response body.
3. A `PGRST200` error usually means a requested relationship hint does not match the actual foreign keys.
4. A 404 or invalid path commonly indicates an invalid Supabase URL, a missing route, or a deployment environment variable problem.
5. A successful privileged SQL query does not prove the anon-key browser client can read a row; RLS still applies to browser requests.

The current app has visible error states on the homepage, shop page, and product detail flow so database failures are not hidden behind empty sections.

## 15. Deployment flow

Vercel builds the app with Vite:

1. Vercel reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. `npm run build` creates `dist/index.html` and hashed assets under `dist/assets`.
3. Vercel serves the `dist` directory.
4. `vercel.json` rewrites client-side application routes to `index.html`.
5. The browser loads the generated JavaScript bundle.
6. The bundle connects to the Supabase project named by the build-time URL.

If Vercel variables are added or changed, a fresh deployment is required because Vite embeds them during the build.

## 16. Important files

```text
index.html                         HTML entry point
src/main.tsx                       React startup
src/App.tsx                        Providers and routes
src/lib/supabase.ts                Supabase browser client
src/lib/accountApi.ts              Registration Edge Function client
src/lib/addresses.ts               Address CRUD operations
src/lib/reviews.ts                 Review/profile enrichment
src/lib/format.ts                  Prices, dates, and order numbers
src/lib/validation.ts              Customer and address validation
src/context/AuthContext.tsx        Session, profile, login, registration, logout
src/context/CartContext.tsx        Persistent signed-in cart
src/pages/HomePage.tsx             Homepage data loading
src/pages/ShopPage.tsx             Catalog search and filters
src/pages/ProductDetailPage.tsx    Product, reviews, wishlist, and related products
src/pages/CheckoutPage.tsx         COD order creation
src/pages/ProfilePage.tsx          Profile, orders, wishlist, addresses
src/pages/admin/                   Administrator screens
src/components/layout/              Customer and admin shells
src/types/index.ts                 Shared TypeScript data shapes
supabase/functions/register-customer/index.ts
                                    Secure server-side registration
supabase/migrations/               Database history and security changes
vercel.json                        Build output and SPA routing
```

## 17. Safe maintenance rules

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Do not manually insert duplicate products when the database already contains catalog rows.
- Before changing a query relationship, inspect the actual foreign keys.
- Use `maybeSingle()` when zero or one row is valid.
- Keep customer ownership checks based on `auth.uid()`.
- Add RLS and grants in the same database migration when adding a table.
- Avoid destructive schema operations such as dropping tables, columns, or customer/order records.
- Run type checking and a production build after code changes.
- Test both anonymous catalog browsing and signed-in customer flows.
