// app/admin/page.tsx
import { prisma } from '@/lib/prisma';
import { Ticket, Users, ShoppingBag, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch platform stats simultaneously for speed
  const [eventCount, botCount, orderCount] = await Promise.all([
    prisma.event.count(),
    prisma.sellerProfile.count({ where: { isBot: true } }),
    prisma.order.count()
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">Platform Overview</h1>
        <p className="text-zinc-500 font-medium mt-2">Welcome back to Salex Command. Here is live network data.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stat Card 1 */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl flex items-center justify-between group hover:border-lime-500/50 transition-colors">
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Events</p>
            <p className="text-4xl font-black tracking-tighter text-white">{eventCount.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 bg-lime-400/10 border border-lime-400/20 text-lime-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] transition-all">
            <Ticket className="w-8 h-8" />
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl flex items-center justify-between group hover:border-lime-500/50 transition-colors">
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Bots</p>
            <p className="text-4xl font-black tracking-tighter text-white">{botCount.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 bg-lime-400/10 border border-lime-400/20 text-lime-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] transition-all">
            <Users className="w-8 h-8" />
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl flex items-center justify-between group hover:border-lime-500/50 transition-colors">
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Orders</p>
            <p className="text-4xl font-black tracking-tighter text-white">{orderCount.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 bg-lime-400/10 border border-lime-400/20 text-lime-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] transition-all">
            <ShoppingBag className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <h2 className="text-2xl font-black mb-8 text-white uppercase tracking-tight relative z-10">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <Link href="/admin/events" className="flex flex-col justify-center bg-zinc-950 hover:bg-lime-400 hover:text-black border border-zinc-800 hover:border-lime-400 p-6 rounded-2xl transition-all group">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black uppercase tracking-widest">Add Event</span>
              <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-black" />
            </div>
          </Link>
          
          <Link href="/admin/orders" className="flex flex-col justify-center bg-zinc-950 hover:bg-lime-400 hover:text-black border border-zinc-800 hover:border-lime-400 p-6 rounded-2xl transition-all group">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black uppercase tracking-widest">Review Orders</span>
              <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-black" />
            </div>
          </Link>
          
          <Link href="/admin/settings" className="flex flex-col justify-center bg-zinc-950 hover:bg-lime-400 hover:text-black border border-zinc-800 hover:border-lime-400 p-6 rounded-2xl transition-all group">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black uppercase tracking-widest">Bank Details</span>
              <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-black" />
            </div>
          </Link>
          
          <Link href="/admin/support" className="flex flex-col justify-center bg-zinc-950 hover:bg-lime-400 hover:text-black border border-zinc-800 hover:border-lime-400 p-6 rounded-2xl transition-all group">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black uppercase tracking-widest">Live Chat</span>
              <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-black" />
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}