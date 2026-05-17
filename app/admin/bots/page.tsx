// app/admin/bots/page.tsx
import { prisma } from '@/lib/prisma';
import { Bot, Ticket, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// --- SERVER ACTION: RE-ROLL BOT IDENTITIES ---
async function regenerateBotIdentities() {
  'use server';
  
  const bots = await prisma.sellerProfile.findMany({ where: { isBot: true } });
  
  const realisticNames = [
    "Verified Reseller", "TicketPro Exchange", "EventPass Hub", "SecureTickets",
    "Alex Johnson", "Sarah Miller", "David Kim", "Jessica Taylor", "Michael R.", "Emma L.",
    "Prime Tickets", "Global Event Access", "Swift Seats", "Elite Ticketing",
    "John D.", "Chris P.", "Amanda B.", "Daniel W.", "Sophia C.", "James H.",
    "VIP Access", "Front Row Ticketing", "Local Guide", "Concert Guru", "Festival Fanatic"
  ];

  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    // Assign a name from the list, appending a number if we run out of unique names
    const baseName = realisticNames[i % realisticNames.length];
    const finalName = i >= realisticNames.length ? `${baseName} ${Math.floor(Math.random() * 100)}` : baseName;

    await prisma.sellerProfile.update({
      where: { id: bot.id },
      data: { name: finalName }
    });
  }
  
  revalidatePath('/admin/bots');
}

export default async function SellersNetworkPage() {
  const bots = await prisma.sellerProfile.findMany({
    where: { isBot: true },
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { ticketBatches: true } 
      }
    }
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans pb-24 selection:bg-lime-500 selection:text-black">
      <header className="bg-zinc-950 border-b border-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              <Bot className="w-8 h-8 text-lime-400" /> Algorithmic Seller Network
            </h1>
            <p className="text-zinc-500 font-medium mt-2">Manage automated bot profiles providing market liquidity.</p>
          </div>
          
          {/* 🛠 THE FIX: The Identity Generator Button */}
          <form action={regenerateBotIdentities}>
            <button type="submit" className="bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 hover:border-lime-500/50 transition-all flex items-center gap-2 group">
              <RefreshCw className="w-4 h-4 text-zinc-500 group-hover:text-lime-400 group-hover:rotate-180 transition-all duration-500" />
              Regenerate Identities
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-lime-500/50 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xl text-white uppercase">
                  {bot.name ? bot.name[0] : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2 line-clamp-1">
                    {bot.name} <ShieldCheck className="w-4 h-4 text-lime-400 flex-shrink-0" />
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic">Verified Bot</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Active Batches</p>
                  <p className="text-2xl font-black text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-lime-400" /> {bot._count.ticketBatches}
                  </p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Reliability</p>
                  <p className="text-2xl font-black text-lime-400 flex items-center gap-1">
                    <Activity className="w-5 h-5" /> 100%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}