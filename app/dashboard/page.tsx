// app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route'; // Adjust path if needed
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, ExternalLink, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BuyerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login'); // Kicks out users who aren't logged in
  }

  // 🛠 THE FIX: Query ticketBatch instead of listing
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      ticketBatch: { 
        include: { 
          event: true,
          seller: true 
        } 
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans pb-24 selection:bg-lime-500 selection:text-black">
      
      {/* Dashboard Header */}
      <header className="bg-zinc-950 border-b border-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">My Tickets</h1>
            <p className="text-zinc-500 font-medium mt-1">Manage your purchases and active escrow reservations.</p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs hover:bg-zinc-800 hover:border-lime-500/50 transition-all">
            Find More Events
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
            <Ticket className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white uppercase mb-2">No Orders Yet</h3>
            <p className="text-zinc-500 font-medium mb-6">You haven't purchased or reserved any tickets.</p>
            <Link href="/" className="bg-lime-400 text-black px-8 py-3.5 rounded-full font-black uppercase tracking-widest hover:bg-lime-300 transition shadow-[0_0_15px_rgba(57,255,20,0.2)]">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              // 🛠 THE FIX: Route all variables through ticketBatch
              const { ticketBatch } = order;
              const { event } = ticketBatch;
              
              // Status Styling logic
              const isPending = order.status === 'PENDING';
              const isVerifying = order.status === 'VERIFYING';
              const isApproved = order.status === 'APPROVED';
              const isCancelled = order.status === 'CANCELLED';

              return (
                <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:border-lime-500/30 transition-colors">
                  
                  {/* Event Image */}
                  <div className="h-32 relative bg-zinc-950 overflow-hidden">
                    <img src={event.imageUrl || ''} alt={event.title} className="w-full h-full object-cover opacity-50 grayscale-[30%] group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {isPending && <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md"><Clock className="w-3 h-3"/> Awaiting Payment</span>}
                      {isVerifying && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md"><Clock className="w-3 h-3 animate-pulse"/> Verifying Transfer</span>}
                      {isApproved && <span className="bg-lime-500/10 text-lime-400 border border-lime-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md"><CheckCircle2 className="w-3 h-3"/> Ticket Secured</span>}
                      {isCancelled && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md"><XCircle className="w-3 h-3"/> Cancelled</span>}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1 mb-3">{event.title}</h3>
                    
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                        <Calendar className="w-4 h-4 mr-2 text-lime-400/70" /> 
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-400 line-clamp-1">
                        <MapPin className="w-4 h-4 mr-2 text-lime-400/70" /> 
                        {event.city}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="font-black text-xl text-white tracking-tighter">₦{ticketBatch.price.toLocaleString()}</p>
                      </div>

                      {/* Action Buttons based on Status */}
                      {isPending && (
                        <Link href={`/checkout/${order.id}`} className="bg-lime-400 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-lime-300 transition">
                          Complete Payment
                        </Link>
                      )}
                      
                      {isApproved && (
                        <button className="bg-white text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition flex items-center gap-2">
                          View Ticket <ExternalLink className="w-3 h-3"/>
                        </button>
                      )}

                      {(isVerifying || isCancelled) && (
                        <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">
                          Order #{order.id.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}