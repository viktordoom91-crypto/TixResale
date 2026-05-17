// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, ShoppingBag, Bot, MessageSquare, Settings, Store, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard Overview' },
  { href: '/admin/events', icon: CalendarDays, label: 'Manage Events' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders & Receipts' },
  { href: '/admin/bots', icon: Bot, label: 'Seller Network' },
  { href: '/admin/support', icon: MessageSquare, label: 'Live Support' },
  { href: '/admin/settings', icon: Settings, label: 'System Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For Mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // For Desktop

  // Automatically close the mobile sidebar whenever the page changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-zinc-950 font-sans text-zinc-300 overflow-hidden selection:bg-lime-500 selection:text-black">
      
      {/* 🛠 MOBILE HEADER: Fixed at the top, Neon styling */}
      <div className="md:hidden fixed top-0 left-0 w-full h-20 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-900 flex items-center justify-between px-6 z-[100]">
        <Link href="/admin" className="flex items-center space-x-3 group">
          <img src="/logo.png" alt="Tixresale" className="w-6 h-6 object-contain" />
          <span className="text-xl font-black tracking-tight uppercase text-white">Tixresale <span className="text-lime-400">admin</span></span>
        </Link>
        
        {/* Neon Admin Hamburger Button */}
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2 bg-lime-400/10 border border-lime-400/20 text-lime-400 rounded-lg hover:bg-lime-400 hover:text-black transition-colors shadow-[0_0_15px_rgba(57,255,20,0.1)] flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* 🛠 MOBILE BACKDROP */}
      <div 
        className={`fixed inset-0 bg-black/90 z-[100] backdrop-blur-sm transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* 🛡️ THE ADMIN SIDEBAR */}
      <aside 
        className={`fixed md:relative top-0 left-0 h-full bg-zinc-950 border-r border-zinc-900 flex flex-col flex-shrink-0 z-[110] transform transition-all duration-300 ease-in-out md:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} 
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        
        {/* Desktop Collapse Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-8 w-7 h-7 bg-zinc-900 border border-zinc-700 hover:border-lime-400 text-zinc-400 hover:text-lime-400 rounded-full items-center justify-center z-50 transition-colors shadow-lg"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Header */}
        <div className={`h-20 flex items-center ${isCollapsed ? 'md:justify-center' : 'justify-between'} px-6 md:px-8 border-b border-zinc-900 transition-all`}>
          <Link href="/admin" className="flex items-center space-x-3 group">
            <img src="/logo.png" alt="Tixresale" className="w-6 h-6 object-contain flex-shrink-0" />
            <span className={`text-xl font-black tracking-tight uppercase text-white transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : 'block'}`}>
              Tixresale <span className="text-lime-400">admin</span>
            </span>
          </Link>
          {/* Close button for mobile inside the sidebar */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto hide-scrollbar">
          <p className={`px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 ${isCollapsed ? 'md:hidden' : 'block'}`}>
            Command Center
          </p>
          
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                title={isCollapsed ? item.label : ''} // Shows tooltip on hover when collapsed
                className={`flex items-center ${isCollapsed ? 'md:justify-center px-0' : 'gap-3 px-4'} py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  isActive 
                  ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20 shadow-[0_0_15px_rgba(57,255,20,0.05)]' 
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-lime-400' : 'text-zinc-500'}`} />
                <span className={`${isCollapsed ? 'md:hidden' : 'block'} whitespace-nowrap`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Return to Public Store */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950">
          <Link 
            href="/" 
            title={isCollapsed ? "Return to Storefront" : ""}
            className={`flex items-center justify-center gap-2 w-full bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:border-lime-500 hover:text-lime-400 transition-colors shadow-sm ${isCollapsed ? 'md:px-0' : 'px-4'}`}
          >
            <Store className="w-5 h-5 flex-shrink-0" /> 
            <span className={`${isCollapsed ? 'md:hidden' : 'block'} whitespace-nowrap`}>
              Storefront
            </span>
          </Link>
        </div>
      </aside>

      {/* 📊 MAIN CONTENT CANVAS */}
      <main className="flex-1 overflow-y-auto relative bg-zinc-950 pt-20 md:pt-0">
        {/* Decorative Top Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 p-4 sm:p-8 lg:p-12">
          {children}
        </div>
      </main>

    </div>
  );
}