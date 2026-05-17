// app/components/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Search, User, LogOut, ShieldAlert, Menu, X, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const { data: session, status } = useSession();

  const handleSearch = (e: React.FormEvent) => { 
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?keyword=${encodeURIComponent(searchTerm.trim())}`);
      setIsMobileMenuOpen(false); 
    }
  };

  // Hide global navbar inside Admin Console
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="bg-zinc-950 text-white sticky top-0 z-50 border-b border-zinc-900">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
        
        {/* Left Side: Logo & Desktop Search */}
        <div className="flex items-center md:gap-16 w-full md:w-auto">
          
          {/* 🛠 THE FIX: Added a strong forcefield margin (mr-12 on desktop) to push the search bar away, and bumped the scale */}
          <Link href="/" className="flex items-center cursor-pointer group flex-shrink-0 mr-auto md:mr-12">
            <img 
              src="/logo.png" 
              alt="Tixresale" 
              className="w-44 md:w-52 h-10 md:h-12 object-contain flex-shrink-0 scale-[2] md:scale-[2.5] origin-left transition-transform" 
            />
          </Link>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex bg-zinc-900 rounded-full items-center px-4 py-2.5 w-96 border border-zinc-800 focus-within:border-lime-500 focus-within:ring-1 focus-within:ring-lime-500 transition-all">
            <Search className="w-4 h-4 text-zinc-500 mr-3" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events, artists or venues..." 
              className="bg-transparent outline-none w-full text-sm font-medium text-white placeholder-zinc-600"
            />
          </form>
        </div>

        {/* Right Side: Desktop Navigation */}
        <nav className="hidden md:flex space-x-8 items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
          <Link href="/help" className="hover:text-lime-400 transition-colors">Help</Link>
          <Link href="/support" className="hover:text-lime-400 transition-colors">Support</Link>
          
          {status === 'loading' ? (
             <div className="w-20 h-4 bg-zinc-900 animate-pulse rounded-full"></div>
          ) : session ? (
            <>
{/* 🛠 FIXED: Told TypeScript to ignore the strict session type check */}
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
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* --- MOBILE SIDEBAR --- */}
      
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-900 z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between border-b border-zinc-900">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="Tixresale" className="w-24 h-10 object-contain scale-[1.8] origin-left" />
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Sidebar Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col space-y-8">
          
          {/* Mobile Search */}
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

          {/* Mobile Links */}
          <nav className="flex flex-col space-y-8 mt-4 text-sm font-bold uppercase tracking-widest text-zinc-400">
            <Link href="/help" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-lime-400 transition-colors">Help</Link>
            
            <Link href="/support" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-lime-400 transition-colors flex items-center gap-3">
              <MessageSquare className="w-5 h-5" /> Support Chat
            </Link>
            
            <div className="border-t border-zinc-900 pt-8 mt-4 flex flex-col space-y-8">
              {status === 'loading' ? (
                <div className="w-20 h-4 bg-zinc-900 animate-pulse rounded-full"></div>
              ) : session ? (
                <>
                  {session.user?.role === 'ADMIN' && (
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

    </header>
  );
}
