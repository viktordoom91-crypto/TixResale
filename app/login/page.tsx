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
            <Link href="/" className="inline-flex items-center justify-center w-full mb-6">
              {/* 🛠 FIXED: Replaced "salex" text with the Tixresale logo image */}
              <img 
                src="/logo.png" 
                alt="Tixresale" 
                className="w-48 h-12 object-contain hover:scale-105 transition-transform duration-300" 
              />
            </Link>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-zinc-500 font-medium text-sm mt-2">
              {/* 🛠 FIXED: Updated branding to Tixresale */}
              {isLogin ? 'Sign in to access your secure escrow tickets.' : 'Join Tixresale to buy and sell verified tickets.'}
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

          {/* 🛠 FIXED: Removed the "Or" divider and all Social Login buttons (Google, Apple, etc.) completely. Only Email & Password remains. */}

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
