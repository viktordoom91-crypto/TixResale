import React from 'react';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-zinc-300 selection:bg-lime-500 selection:text-black">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-10 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-zinc-800 relative overflow-hidden">
          
          {/* Neon background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="mb-8 text-center relative z-10">
            <Link href="/" className="inline-flex items-center justify-center w-full mb-6">
              {/* 🛠 FIXED: Replaced standard text with the Tixresale logo image */}
              <img 
                src="/logo.png" 
                alt="Tixresale" 
                className="w-48 h-12 object-contain hover:scale-105 transition-transform duration-300" 
              />
            </Link>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">
              Create Account
            </h2>
            <p className="text-zinc-500 font-medium text-sm mt-2">
              Join Tixresale to securely buy and sell verified tickets.
            </p>
          </div>

          {/* 🛠 FIXED: Removed all Google/Apple/Facebook buttons and the "Or" divider. Only Email & Password remains. */}

          {/* Standard Form */}
          <form className="space-y-5 relative z-10" action="#" method="POST">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">First name</label>
                <input id="firstName" name="firstName" type="text" required 
                  className="w-full px-4 py-3.5 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-lime-500 outline-none font-medium transition-all placeholder-zinc-600" 
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Last name</label>
                <input id="lastName" name="lastName" type="text" required 
                  className="w-full px-4 py-3.5 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-lime-500 outline-none font-medium transition-all placeholder-zinc-600" 
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Email</label>
              <input id="email" name="email" type="email" required 
                className="w-full px-4 py-3.5 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-lime-500 outline-none font-medium transition-all placeholder-zinc-600" 
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Password</label>
              <input id="password" name="password" type="password" required 
                className="w-full px-4 py-3.5 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-lime-500 outline-none font-medium transition-all placeholder-zinc-600" 
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Phone number</label>
              <div className="flex gap-2">
                <div className="relative w-28 flex-shrink-0">
                  <select id="countryCode" name="countryCode" className="appearance-none block w-full px-3 py-3.5 border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:border-lime-500 sm:text-sm transition cursor-pointer">
                    <option>US (+1)</option>
                    <option>UK (+44)</option>
                    <option>AU (+61)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <input id="phone" name="phone" type="tel" required 
                  className="w-full px-4 py-3.5 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-lime-500 outline-none font-medium transition-all placeholder-zinc-600" 
                  placeholder="234 567 8900"
                />
              </div>
            </div>

            {/* Newsletter Checkbox */}
            <div className="flex items-start mt-6">
              <div className="flex items-center h-5">
                <input id="newsletter" name="newsletter" type="checkbox" 
                  className="focus:ring-lime-500 h-4 w-4 bg-zinc-950 text-lime-500 border-zinc-800 rounded cursor-pointer accent-lime-400" 
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="newsletter" className="text-zinc-400 cursor-pointer">
                  Sign up to our monthly gig guide to discover the top events in your city.
                </label>
              </div>
            </div>

            {/* Terms Agreement */}
            <p className="text-sm text-zinc-500 mt-6">
              {/* 🛠 FIXED: Updated Salex to Tixresale */}
              By continuing, you agree to Tixresale's <a href="#" className="text-lime-400 hover:underline">terms & conditions</a> and <a href="#" className="text-lime-400 hover:underline">privacy policy</a>.
            </p>

            {/* Submit Button */}
            <div className="pt-2">
              <button type="submit" className="w-full bg-lime-400 text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-lime-300 transition shadow-[0_0_20px_rgba(57,255,20,0.15)] flex justify-center items-center">
                Create your account
              </button>
            </div>

          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500 relative z-10">
            Remembered your account details? <Link href="/login" className="text-lime-400 hover:underline font-black uppercase tracking-widest text-xs ml-2">Log in</Link>
          </div>

        </div>
      </div>
    </div>
  );
}
