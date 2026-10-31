import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) {
      setError('Authentication failed');
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (data?.role !== 'admin') {
      setError('Access denied. Admin credentials required.');
      await signOut();
      setLoading(false);
      return;
    }
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a2433] px-4 py-12">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-11 h-11 bg-[#ff9900] rounded-xl flex items-center justify-center">
          <Store size={24} className="text-[#1a2433]" />
        </div>
        <span className="text-2xl font-bold text-white">Kamini Bag House</span>
      </Link>

      {/* Login card */}
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-[#1a2433] to-[#243044] px-7 py-6 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <ShieldCheck size={22} className="text-[#ff9900]" />
              <h1 className="text-xl font-bold text-white">Admin Portal</h1>
            </div>
            <p className="text-sm text-slate-400">Sign in to manage your store</p>
          </div>

          {/* Form */}
          <div className="p-7">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#ff9900] transition-colors"
                  placeholder="admin@kaminibaghouse.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 pr-11 text-sm border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#ff9900] transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff9900] hover:bg-[#e88a00] text-[#1a2433] font-bold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>


          </div>
        </div>

        <Link to="/" className="block text-center text-sm text-slate-400 hover:text-[#ff9900] mt-6 transition-colors">
          Back to Store
        </Link>
      </div>
    </div>
  );
}
