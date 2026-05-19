// app/components/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Search, User, LogOut, ShieldAlert, Menu, X, MessageSquare, ChevronDown } from 'lucide-react';
import { useCurrency } from './CurrencyProvider';

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const { data: session, status } = useSession();
  const { currency, setCurrency } = useCurrency();

  const handleSearch = (e: React.FormEvent) => { 
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?keyword=${encodeURIComponent(searchTerm.trim())}`);
      setIsMobileMenuOpen(false); 
    }
  };

  if (pathname.startsWith('/admin')) {
    return null;
  }

  // 🛠 FIXED: Wrapped the entire return in a fragment <> so the mobile menu can sit OUTSIDE the header
  return (
    <>
      <header className="bg-zinc-950 text-white sticky top-0 z-50 border-b border-zinc-900">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
          
          {/* Left Side: Logo & Desktop Search */}
          <div className="flex items-center md:gap-8 w-full md:w-auto">
            <Link href="/" className="flex items-center cursor-pointer group flex-shrink-0 mr-auto md:mr-6">
              <img 
                src="/logo.png" 
                alt="Tixresale" 
                className="w-44 md:w-52 h-10 md:h-12 object-contain flex-shrink-0 scale-[2] md:scale-[2.5] origin-left transition-transform" 
              />
            </Link>
            
            <form onSubmit={handleSearch} className="hidden lg:flex bg-zinc-900 rounded-full items-center px-4 py-2.5 w-72 border border-zinc-800 focus-within:border-lime-500 focus-within:ring-1 focus-within:ring-lime-500 transition-all">
              <Search className="w-4 h-4 text-zinc-500 mr-3" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events or artists..." 
                className="bg-transparent outline-none w-full text-sm font-medium text-white placeholder-zinc-600"
              />
            </form>
          </div>

          {/* Right Side: Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center text-[10px] lg:text-xs font-bold uppercase tracking-widest text-zinc-400">
            
            <Link href="/explore" className="hover:text-lime-400 transition-colors">Explore</Link>
            
            {/* Categories Dropdown */}
            <div className="relative group py-4">
              <button className="flex items-center gap-1 hover:text-lime-400 transition-colors">
                Categories <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full left-0 mt-0 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link href="/category/concerts" className="block px-4 py-3 hover:bg-zinc-800 hover:text-lime-400 text-white rounded-t-xl transition-colors">Concerts</Link>
                <Link href="/category/festivals" className="block px-4 py-3 hover:bg-zinc-800 hover:text-lime-400 text-white transition-colors">Festivals</Link>
                <Link href="/category/sports" className="block px-4 py-3 hover:bg-zinc-800 hover:text-lime-400 text-white rounded-b-xl transition-colors">Sports</Link>
              </div>
            </div>

            {/* Cities Dropdown */}
            <div className="relative group py-4">
              <button className="flex items-center gap-1 hover:text-lime-400 transition-colors">
                Cities <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full left-0 mt-0 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link href="/city/london" className="block px-4 py-3 hover:bg-zinc-800 hover:text-lime-400 text-white rounded-t-xl transition-colors">London</Link>
                <Link href="/city/new-york" className="block px-4 py-3 hover:bg-zinc-800 hover:text-lime-400 text-white transition-colors">New York</Link>
                <Link href="/city/paris" className="block px-4 py-3 hover:bg-zinc-800 hover:text-lime-400 text-white transition-colors">Paris</Link>
                <Link href="/city/toronto" className="block px-4 py-3 hover:bg-zinc-800 hover:text-lime-400 text-white rounded-b-xl transition-colors">Toronto</Link>
              </div>
            </div>

            <Link href="/support" className="hover:text-lime-400 transition-colors">Support</Link>
            
            <div className="w-px h-4 bg-zinc-800 mx-2"></div>

            {/* Currency Switcher */}
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-white text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-lime-400 transition cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>

            {status === 'loading' ? (
               <div className="w-20 h-4 bg-zinc-900 animate-pulse rounded-full"></div>
            ) : session ? (
              <>
                {(session.user as any)?.role === 'ADMIN' && (
                  <Link href="/admin" className="text-lime-400 hover:text-lime-300 transition-colors flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Admin Console
                  </Link>
                )}
                <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <User className="w-4 h-4" /> My Tickets
                </Link>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" /> Exit
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors">Sign in</Link>
            )}
          </nav>

         {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            // 🛠 FIXED: Added 'relative z-20' to force the button above the logo's invisible box
            className="relative z-20 md:hidden p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>
       <Menu classNam    {/* 🛠 FIXED: Mobile Sidebar is now OUTSIDE the sticky header to prevent touch-blocking */}
      <div 
        className={`fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-900 z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-5 flex items-center justify-between border-b border-zinc-900">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="Tixresale" className="w-24 h-10 object-contain scale-[1.8] origin-left" />
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto flex flex-col space-y-6">
          
          <form onSubmit={handleSearch} className="flex bg-zinc-900 rounded-2xl items-center px-4 py-3 border border-zinc-800 focus-within:border-lime-500 focus-within:ring-1 focus-within:ring-lime-500 transition-all">
            <Search className="w-5 h-5 text-zinc-500 mr-3" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search artists or venues..." 
              className="bg-transparent outline-none w-full text-sm font-medium text-white placeholder-zinc-600"
            />
          </form>

          {/* Mobile Currency Switcher */}
          <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Currency</span>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-700 text-white text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-lime-400 transition"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>

          <nav className="flex flex-col space-y-6 mt-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
            
            <div className="space-y-4">
              <p className="text-[10px] text-zinc-600 mb-2">Discover</p>
              <Link href="/explore" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-lime-400 transition-colors">Explore All</Link>
              <Link href="/category/concerts" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-lime-400 transition-colors">Concerts</Link>
              <Link href="/category/festivals" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-lime-400 transition-colors">Festivals</Link>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <p className="text-[10px] text-zinc-600 mb-2">Top Cities</p>
              <Link href="/city/london" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-lime-400 transition-colors">London</Link>
              <Link href="/city/new-york" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-lime-400 transition-colors">New York</Link>
              <Link href="/city/paris" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-lime-400 transition-colors">Paris</Link>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <Link href="/help" onClick={() => setIsMobileMenuOpen(false)} className="block hover:text-lime-400 transition-colors">Help</Link>
              <Link href="/support" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-lime-400 transition-colors flex items-center gap-3">
                <MessageSquare className="w-5 h-5" /> Support Chat
              </Link>
            </div>
            
            <div className="border-t border-zinc-900 pt-6 flex flex-col space-y-6">
               {status === 'loading' ? (
                <div className="w-20 h-4 bg-zinc-900 animate-pulse rounded-full"></div>
              ) : session ? (
                <>
                 {(session.user as any)?.role === 'ADMIN' && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-lime-400 hover:text-lime-300 transition-colors flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5" /> Admin Console
                    </Link>
                  )}
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 hover:text-white transition-colors">
                    <User className="w-5 h-5" /> My Tickets
                  </Link>
                  <button onClick={() => { signOut({ callbackUrl: '/' }); setIsMobileMenuOpen(false); }} className="hover:text-zinc-200 transition-colors flex items-center gap-3 text-left">
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white transition-colors">Sign in</Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
        }
