# Kamini Bag House - Premium Bag E-Commerce Store

A full-stack bag e-commerce web application with a customer-facing storefront and a complete admin dashboard.

## Features

### Customer Storefront
- Home page with hero, featured products, new arrivals, bestsellers, categories, and customer reviews
- Product listing with filters (category, price range, rating, availability, discount), sorting, and pagination
- Product detail pages with image gallery, specs, reviews, quantity selector, and related products
- Customer authentication (register, login, forgot password)
- Shopping cart with quantity controls and persistent storage
- Multi-step checkout (information, shipping, summary, payment) with coupon support
- Order tracking with status flow (Pending -> Confirmed -> Packed -> Shipped -> Delivered)
- Wishlist with move-to-cart functionality
- Product reviews with star ratings
- Customer profile management (edit profile, change password, view orders, manage wishlist)

### Admin Dashboard
- Dashboard with sales statistics, daily sales chart, top products, and recent orders
- Product management (add, edit, delete, search, filter, manage stock, set flags)
- Category management (add, edit, delete, view product counts)
- Inventory management with stock indicators and low-stock alerts
- Order management with status updates and order detail view
- Customer management with order history and account enable/disable
- Sales analytics with date range filters, revenue charts, category performance, and best-sellers
- Coupon management (create, toggle, delete coupons)
- Reviews moderation
- Store settings (store name, contact info, shipping charges, tax, currency)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kaminibaghouse.com | admin123 |
| Customer | customer@demo.com | demo123 |

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Router
- **Backend:** Supabase (PostgreSQL database, authentication, row-level security)
- **Icons:** Lucide React
- **Images:** Pexels stock photography

## Getting Started

The dev server runs automatically. The Supabase database is pre-provisioned with:
- 8 categories (Backpacks, Laptop Bags, Travel Bags, Handbags, Sling Bags, School Bags, Office Bags, Tote Bags)
- 24 products with real images and specifications
- 3 coupon codes (WELCOME10, SAVE20, FLAT15)
- Sample orders and reviews
- Demo admin and customer accounts

## Project Structure

```
src/
  components/        Reusable UI components
    layout/          Navbar, Footer, AdminLayout, CustomerLayout
    ui/              Button, Badge, Modal, Rating
  context/           Auth and Cart React contexts
  lib/               Supabase client and utility functions
  pages/             Page components
    auth/            Login, Register, Forgot Password
    admin/           Admin dashboard pages
  types/             TypeScript type definitions
```
