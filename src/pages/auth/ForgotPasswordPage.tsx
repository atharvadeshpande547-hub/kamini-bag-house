import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
            <Package size={22} className="text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-stone-900">Urban<span className="text-amber-500">Carry</span></span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={26} className="text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-stone-900 mb-2">Check Your Email</h1>
              <p className="text-sm text-stone-500 mb-6">
                We've sent a password reset link to <span className="font-medium text-stone-700">{email}</span>
              </p>
              <Link to="/login">
                <Button variant="outline" fullWidth>
                  <ArrowLeft size={16} /> Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-stone-900 mb-1">Reset Password</h1>
              <p className="text-sm text-stone-500 mb-6">
                Enter your email and we'll send you a reset link
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" fullWidth size="lg" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
              <p className="text-center text-sm text-stone-600 mt-6">
                <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
