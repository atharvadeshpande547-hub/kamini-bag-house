import { Link } from 'react-router-dom';
import { Package, Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-stone-800 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-amber-400" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Kamini<span className="text-amber-400"> Bag House</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-stone-400">
              Premium bags for every journey. From backpacks to handbags, we craft
              quality carry solutions that combine style and function.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center hover:bg-stone-700 transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center hover:bg-stone-700 transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center hover:bg-stone-700 transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shop?category=backpacks" className="hover:text-white transition-colors">Backpacks</Link></li>
              <li><Link to="/shop?category=handbags" className="hover:text-white transition-colors">Handbags</Link></li>
              <li><Link to="/shop?category=travel-bags" className="hover:text-white transition-colors">Travel Bags</Link></li>
              <li><Link to="/shop?category=laptop-bags" className="hover:text-white transition-colors">Laptop Bags</Link></li>
              <li><Link to="/shop?category=tote-bags" className="hover:text-white transition-colors">Tote Bags</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">View All</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={15} className="text-amber-400" />
                <a href="mailto:support@kaminibaghouse.com" className="hover:text-white transition-colors">support@kaminibaghouse.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-amber-400" />
                <a href="tel:+15550100" className="hover:text-white transition-colors">+1 555 0100</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={15} className="text-amber-400" />
                <span>123 Market St, Springfield</span>
              </li>
              <li><Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            (c) {new Date().getFullYear()} Kamini Bag House. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-stone-500">
            <a href="#" className="hover:text-stone-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Shipping Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
