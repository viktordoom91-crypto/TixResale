// app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        setError('Invalid email or password.');
        setLoading(false);
      } else {
        // 🚀 Sends EVERYONE to /admin. Middleware kicks standard users back to '/' seamlessly!
        window.location.href = '/admin'; 
      }
    } else {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        await signIn('credentials', { redirect: false, email: formData.email, password: formData.password });
        window.location.href = '/admin';
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create account');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-zinc-300 selection:bg-lime-500 selection:text-black">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-10 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-zinc-800 relative overflow-hidden">
          
          {/* Neon background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="mb-8 text-center relative z-10">
            <Link href="/" className="inline-flex items-center space-x-2 group mb-6">
              <div className="w-6 h-6 bg-lime-400 rounded-sm transform rotate-12 flex-shrink-0 group-hover:rotate-180 transition-transform duration-500 shadow-[0_0_15px_rgba(57,255,20,0.4)]"></div>
              <span className="text-2xl font-black tracking-tight text-white uppercase">salex</span>
            </Link>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-zinc-500 font-medium text-sm mt-2">
              {isLogin ? 'Sign in to access your secure escrow tickets.' : 'Join Salex to buy and sell verified tickets.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-xl text-center uppercase tracking-widest">{error}</div>}

            {!isLogin && (
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input required type="text" placeholder="Full Name" 
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-lime-500 outline-none font-medium transition-all placeholder-zinc-600" 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input required type="email" placeholder="Email Address" 
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-lime-500 outline-none font-medium transition-all placeholder-zinc-600" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            <div className="relative">
              <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input required type="password" placeholder="Password" 
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-lime-500 outline-none font-medium transition-all placeholder-zinc-600" 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-lime-400 text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-lime-300 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.15)] mt-6">
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8 z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-900 text-zinc-500 font-black tracking-widest uppercase text-[10px]">Or</span>
            </div>
          </div>

          {/* Social Logins (Visual) */}
          <div className="space-y-3 z-10 relative">
            <button className="w-full flex justify-center items-center py-3 px-4 border border-zinc-800 rounded-xl bg-zinc-950 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition">
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button className="w-full flex justify-center items-center py-3 px-4 border border-zinc-800 rounded-xl bg-zinc-950 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition">
              <svg className="h-5 w-5 mr-3 fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.33-.85 3.73-.72 1.58.11 2.83.74 3.6 1.88-3.13 1.92-2.61 6.04.44 7.28-.7 1.69-1.55 3.3-2.85 3.73zm-2.03-14.8c.84-1.12 1.25-2.48 1.08-3.83-1.2.06-2.58.82-3.41 1.95-.69.93-1.2 2.25-1 3.55 1.34.1 2.51-.55 3.33-1.67z"/></svg>
              Continue with Apple
            </button>
          </div>

          <div className="pt-8 mt-8 border-t border-zinc-800 text-center relative z-10">
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-lime-400 transition">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}