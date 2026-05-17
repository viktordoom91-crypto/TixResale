// app/event/[id]/page.tsx
import React, { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BuyTicketButton from '../../components/BuyTicketButton';
import { MapPin, Calendar, ShieldCheck, Zap, Ticket, Clock, AlertTriangle, Hash } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RANDOM_BUYERS = ['Oliver', 'Emma', 'Lucas', 'Sophia', 'Jack', 'Mia', 'Harry', 'Isabella', 'Leo', 'Ava'];

const SECTIONS = ['VIP Standing', 'Main Floor', 'Balcony Unreserved', 'Backstage Pass'];
const getSeatInfo = (id: string) => {
  const charCode = id.charCodeAt(id.length - 1) + id.charCodeAt(id.length - 2);
  const section = SECTIONS[charCode % SECTIONS.length];
  return { section, detail: 'General Admission - No Reserved Seating' };
};

// ============================================================================
// 1. THE PHANTOM SKELETON
// ============================================================================
function EventSkeleton() {
  return (
    <div className="w-full bg-zinc-950 min-h-screen text-zinc-300 font-sans">
      <section className="relative pt-8 md:pt-12 pb-16 md:pb-24 border-b border-zinc-900 overflow-hidden">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 md:gap-10 items-start relative z-10">
          <div className="w-full md:w-80 h-[250px] sm:h-[300px] md:h-[400px] rounded-3xl bg-zinc-900 border border-zinc-800 animate-pulse flex-shrink-0" />
          <div className="flex flex-col justify-center h-full pt-2 md:pt-4 w-full">
            <div className="h-10 md:h-16 w-3/4 max-w-lg bg-zinc-900 rounded-2xl animate-pulse mb-6" />
            <div className="space-y-4">
              <div className="h-5 md:h-6 w-48 bg-zinc-900 rounded-md animate-pulse" />
              <div className="h-5 md:h-6 w-64 bg-zinc-900 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-[72px] z-30 shadow-sm">
        <div className="max-w-[1000px] mx-auto px-4 py-4 flex justify-between items-center overflow-x-auto text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hide-scrollbar gap-8">
          {[
            { text: "Fraud Prevention", icon: ShieldCheck }, 
            { text: "Instant Transfer", icon: Zap }, 
            { text: "Escrow Protected", icon: Ticket }
          ].map((badge, idx) => (
            <div key={idx} className="flex items-center whitespace-nowrap flex-shrink-0">
              <badge.icon className="w-4 h-4 text-lime-400 mr-2" />
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="mb-12 md:mb-16">
          <div className="h-6 md:h-8 w-48 bg-zinc-900 rounded-md animate-pulse mb-6" />
          <div className="flex space-x-4 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="min-w-[240px] md:min-w-[260px] h-32 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-8 md:h-10 w-48 bg-zinc-900 rounded-md animate-pulse mb-8" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 md:h-32 w-full bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-3xl animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 2. THE SERVER PAYLOAD
// ============================================================================
async function EventContent({ id }: { id: string }) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketBatches: {
        where: { quantity: { gt: 0 } }, 
        include: {
          seller: { select: { id: true, name: true, avatarUrl: true, isBot: true } },
        },
        orderBy: { price: 'asc' }, 
      },
    },
  });

  if (!event) return notFound();

  const uniqueSellers = Array.from(new Set(event.ticketBatches.map(b => b.seller.name)));
  const shuffledSellers = uniqueSellers.sort(() => 0.5 - Math.random()).slice(0, 4);
  
  const liveActivity = shuffledSellers.map((sellerName) => {
    const randomBuyer = RANDOM_BUYERS[Math.floor(Math.random() * RANDOM_BUYERS.length)];
    return {
      seller: sellerName,
      buyer: randomBuyer,
      time: `${Math.floor(Math.random() * 59) + 1} min ago`,
      initial: sellerName[0]
    };
  });

  return (
    <div className="w-full bg-zinc-950 min-h-screen text-zinc-300 font-sans selection:bg-lime-500 selection:text-black">
      
      {/* Hero Section */}
      <section className="relative pt-8 md:pt-12 pb-16 md:pb-24 border-b border-zinc-900 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={event.imageUrl || ''} alt="" className="w-full h-full object-cover blur-3xl scale-110 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 to-zinc-950" />
        </div>

        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 md:gap-10 items-start relative z-10">
          <div className="w-full md:w-80 h-[250px] sm:h-[300px] md:h-[400px] rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] flex-shrink-0 bg-zinc-900 border border-zinc-800 relative">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="" className="w-full h-full object-cover grayscale-[20%]" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700">No Image</div>
            )}
            <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">Live</span>
            </div>
          </div>
          
          <div className="flex flex-col justify-center h-full pt-2 md:pt-4 w-full">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-4 md:mb-6 leading-tight text-white uppercase break-words">
              {event.title}
            </h1>
            <div className="flex flex-col gap-3 md:gap-4 text-zinc-400 font-bold text-xs sm:text-sm uppercase tracking-widest">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-start gap-3 text-lime-400">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{event.description}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-[72px] z-30 shadow-sm">
        <div className="max-w-[1000px] mx-auto px-4 py-4 flex justify-between items-center overflow-x-auto text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hide-scrollbar gap-8">
          {[
            { text: "Fraud Prevention", icon: ShieldCheck }, 
            { text: "Instant Transfer", icon: Zap }, 
            { text: "Escrow Protected", icon: Ticket }
          ].map((badge, idx) => (
            <div key={idx} className="flex items-center whitespace-nowrap flex-shrink-0">
              <badge.icon className="w-4 h-4 text-lime-400 mr-2" />
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        
        {/* Live Activity Feed */}
        <div className="mb-12 md:mb-16">
          <div className="flex items-center mb-6 gap-3">
            <Clock className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-white">Recent Activity</h2>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-6 hide-scrollbar">
            {liveActivity.map((activity, i) => (
              <div key={i} className="min-w-[240px] md:min-w-[260px] border border-zinc-800 rounded-2xl p-4 md:p-5 flex flex-col justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lime-400 text-xs font-black uppercase">{activity.initial}</div>
                   <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs ml--2">👤</div>
                </div>
                <p className="text-sm font-medium text-zinc-300 leading-tight">
                  <span className="text-white font-bold">{activity.seller}</span> sold to <span className="text-white font-bold">{activity.buyer}</span>
                </p>
                <p className="text-[10px] font-black uppercase text-lime-400/70 mt-3 tracking-widest">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Real Ticket Batches */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">Buy Tickets</h2>
              <div className="text-lime-400 mt-2 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
                {event.ticketBatches.length} Sellers Available Now
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            {event.ticketBatches.length === 0 ? (
              <div className="p-12 md:p-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-white font-black uppercase tracking-widest mb-2">Sold Out</p>
                <p className="text-zinc-500 font-medium text-xs md:text-sm">Waiting for new sellers to list inventory.</p>
              </div>
            ) : (
              event.ticketBatches.map((batch) => {
                const seatInfo = getSeatInfo(batch.id);
                const hexString = batch.id.substring(18, 24) || 'a1b2c3';
                const baseTicketNum = parseInt(hexString, 16) % 90000 + 10000;

                return (
                  <div key={batch.id} className="border border-zinc-800 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col md:flex-row justify-between md:items-center bg-zinc-900 hover:border-lime-500/50 transition-colors group">
                    
                    <div className="flex gap-4 sm:gap-5 mb-6 md:mb-0 w-full md:w-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-zinc-950 rounded-full border border-zinc-800 flex items-center justify-center font-black text-lg md:text-xl text-white flex-shrink-0">
                        {batch.seller.name[0]}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-lg md:text-xl text-white leading-none truncate">{batch.seller.name}</h3>
                          <ShieldCheck className="w-4 h-4 text-lime-400 flex-shrink-0" />
                        </div>
                        
                        <div className="mt-2 md:mt-3 space-y-1">
                          <p className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" /> <span className="truncate">{seatInfo.section}</span>
                          </p>
                          <p className="text-[10px] md:text-xs font-medium text-zinc-500 flex items-center gap-2 mt-1">
                            <Hash className="w-3 h-3 text-lime-400/50 flex-shrink-0" /> 
                            Ticket ID: #{baseTicketNum} {batch.quantity > 1 ? `- #${baseTicketNum + batch.quantity - 1}` : ''}
                          </p>
                        </div>

                        <div className="mt-3 md:mt-4 inline-flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
                          <Ticket className="w-3 h-3 md:w-3.5 md:h-3.5 text-lime-400" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {batch.quantity} Tickets Held
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col w-full md:w-auto md:items-end justify-between border-t border-zinc-800 md:border-t-0 pt-5 md:pt-0">
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start w-full mb-4 md:mb-4">
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block mb-0 md:mb-1">Price per ticket</span>
                        <span className="font-black text-2xl md:text-3xl text-white tracking-tighter">₦{batch.price.toLocaleString()}</span>
                      </div>
                      
                      <div className="w-full md:w-auto">
                        <BuyTicketButton listingId={batch.id} price={batch.price} maxAvailable={batch.quantity} />
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

// ============================================================================
// 3. MAIN EXPORT
// ============================================================================
export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<EventSkeleton />}>
      <EventContent id={id} />
    </Suspense>
  );
}