// app/admin/events/page.tsx
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import {
  Calendar, MapPin, Star, Ticket,
  Image as ImageIcon, Plus, Edit, Clock, Tag,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// --- SERVER ACTION: TOGGLE FEATURED ---
async function toggleFeatured(formData: FormData) {
  'use server';
  const eventId       = formData.get('eventId')       as string;
  const currentStatus = formData.get('currentStatus') === 'true';

  await prisma.event.update({
    where: { id: eventId },
    data:  { isFeatured: !currentStatus },
  });

  revalidatePath('/admin/events');
}

// Category badge config
const CATEGORY_STYLES: Record<string, { label: string; color: string }> = {
  concert:  { label: 'Concert',  color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  festival: { label: 'Festival', color: 'bg-orange-500/10 text-orange-300 border-orange-500/20' },
  comedy:   { label: 'Comedy',   color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
  sports:   { label: 'Sports',   color: 'bg-blue-500/10  text-blue-300  border-blue-500/20'    },
  theater:  { label: 'Theater',  color: 'bg-pink-500/10  text-pink-300  border-pink-500/20'    },
};

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { ticketBatches: true } },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans pb-24 selection:bg-lime-500 selection:text-black">

      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              <Ticket className="w-8 h-8 text-lime-400" /> Event Inventory
            </h1>
            <p className="text-zinc-500 font-medium mt-2">
              Manage live events and track active ticket batches.
            </p>
          </div>

          <Link
            href="/admin/events/new"
            className="inline-flex items-center justify-center gap-2 bg-lime-400 text-black px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-lime-300 transition-all shadow-[0_0_20px_rgba(57,255,20,0.15)] hover:shadow-[0_0_30px_rgba(57,255,20,0.25)] w-full md:w-auto"
          >
            <Plus className="w-4 h-4" /> Add New Event
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-xs font-black uppercase tracking-widest text-zinc-500">
                  <th className="p-6">Event Details</th>
                  <th className="p-6">Category</th>
                  <th className="p-6">Location &amp; Date / Time</th>
                  <th className="p-6">Base Price</th>
                  <th className="p-6">Active Batches</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-500 font-bold uppercase tracking-widest">
                      No events found. Create your first event above.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => {
                    const eventDate = new Date(event.date);
                    const cat       = event.category ? CATEGORY_STYLES[event.category] : null;

                    return (
                      <tr
                        key={event.id}
                        className={`hover:bg-zinc-800/20 transition-colors group ${event.isFeatured ? 'bg-lime-500/5' : ''}`}
                      >

                        {/* 1. Event Details */}
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-700">
                              {event.imageUrl ? (
                                <img
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover grayscale-[20%]"
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-zinc-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-sm text-white line-clamp-1 uppercase tracking-tight">
                                {event.title}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                ID: {event.id.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Category */}
                        <td className="p-6">
                          {cat ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${cat.color}`}>
                              <Tag className="w-3 h-3" />
                              {cat.label}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                              &mdash;
                            </span>
                          )}
                        </td>

                        {/* 3. Location & Date / Time */}
                        <td className="p-6 space-y-1.5">
                          <div className="flex items-center text-xs font-bold text-zinc-300">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-lime-400/70 flex-shrink-0" />
                            {event.city}
                            {event.location ? (
                              <span className="ml-1 text-zinc-500 font-medium truncate max-w-[120px]">
                                &bull; {event.location}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center text-xs font-bold text-zinc-500">
                            <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-600 flex-shrink-0" />
                            {eventDate.toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center text-xs font-bold text-zinc-600">
                            <Clock className="w-3.5 h-3.5 mr-2 text-zinc-700 flex-shrink-0" />
                            {eventDate.toLocaleTimeString('en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* 4. Base Price */}
                        <td className="p-6">
                          <p className="font-black text-lg text-white tracking-tighter">
                            &#x20A6;{event.basePrice.toLocaleString()}
                          </p>
                        </td>

                        {/* 5. Active Batches */}
                        <td className="p-6">
                          <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                            <Ticket className="w-3.5 h-3.5 text-lime-400" />
                            {event._count.ticketBatches} Batches
                          </span>
                        </td>

                        {/* 6. Actions */}
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-3">

                            {/* Edit button — links to /admin/events/[id]/edit */}
                            <Link
                              href={`/admin/events/${event.id}/edit`}
                              className="p-2.5 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-lime-500/50 hover:text-lime-400 rounded-xl transition-all"
                              title="Edit Event"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* Featured toggle */}
                            <form action={toggleFeatured}>
                              <input type="hidden" name="eventId"       value={event.id} />
                              <input type="hidden" name="currentStatus" value={event.isFeatured.toString()} />
                              <button
                                type="submit"
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 ${
                                  event.isFeatured
                                    ? 'bg-lime-400 text-black shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:bg-lime-300'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${event.isFeatured ? 'fill-black' : ''}`} />
                                {event.isFeatured ? 'Featured' : 'Standard'}
                              </button>
                            </form>

                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
  }
