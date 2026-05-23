// app/admin/events/[id]/edit/page.tsx
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Ticket, MapPin, Calendar, Image as ImageIcon, FileText, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

// --- SERVER ACTION TO SAVE CHANGES ---
async function updateEvent(formData: FormData) {
  'use server';
  
  const id = formData.get('eventId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const city = formData.get('city') as string;
  const dateString = formData.get('date') as string;
  const basePrice = parseFloat(formData.get('basePrice') as string);
  const imageUrl = formData.get('imageUrl') as string;

  // Update the event in the database
  await prisma.event.update({
    where: { id },
    data: {
      title,
      description,
      city,
      date: new Date(dateString), // Convert HTML datetime string back to Date object
      basePrice,
      imageUrl: imageUrl || null,
    }
  });

  // Revalidate the cache so the updated data shows immediately
  revalidatePath('/admin/events');
  revalidatePath('/');
  
  // Send the admin back to the events table
  redirect('/admin/events');
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  // 1. Fetch the existing event
  const event = await prisma.event.findUnique({
    where: { id: params.id }
  });

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-black uppercase tracking-widest mb-4">Event Not Found</h1>
        <Link href="/admin/events" className="text-lime-400 hover:underline">Return to Events</Link>
      </div>
    );
  }

  // Format the Date object for the HTML datetime-local input (YYYY-MM-DDThh:mm)
  const formattedDate = new Date(event.date).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans pb-24 selection:bg-lime-500 selection:text-black">
      
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link 
            href="/admin/events" 
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-lime-500/50 hover:text-lime-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
              Edit Event
            </h1>
            <p className="text-zinc-500 font-medium mt-1 text-sm">
              Updating ID: {event.id}
            </p>
          </div>
        </div>
      </header>

      {/* Form Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 blur-[80px] rounded-full pointer-events-none" />

          <form action={updateEvent} className="space-y-8 relative z-10">
            <input type="hidden" name="eventId" value={event.id} />

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Title */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 text-lime-400" /> Event Title
                </label>
                <input 
                  required
                  type="text" 
                  name="title"
                  defaultValue={event.title}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700"
                  placeholder="e.g. Travis Scott - Utopia Tour"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-lime-400" /> City / Location
                </label>
                <input 
                  required
                  type="text" 
                  name="city"
                  defaultValue={event.city}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700"
                  placeholder="e.g. Los Angeles"
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-lime-400" /> Date & Time
                </label>
                <input 
                  required
                  type="datetime-local" 
                  name="date"
                  defaultValue={formattedDate}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all [color-scheme:dark]"
                />
              </div>

              {/* Base Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-lime-400" /> Base Price (₦)
                </label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  name="basePrice"
                  defaultValue={event.basePrice}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700"
                  placeholder="e.g. 50000"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-lime-400" /> Image URL
                </label>
                <input 
                  type="url" 
                  name="imageUrl"
                  defaultValue={event.imageUrl || ''}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-lime-400" /> Description / Venue info
                </label>
                <textarea 
                  name="description"
                  defaultValue={event.description || ''}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700 resize-none"
                  placeholder="Add details about the venue, supporting acts, or ticket rules..."
                />
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-end gap-4">
              <Link 
                href="/admin/events"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-center"
              >
                Cancel
              </Link>
              <button 
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-lime-400 text-black px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-lime-300 transition-all shadow-[0_0_20px_rgba(57,255,20,0.15)] hover:shadow-[0_0_30px_rgba(57,255,20,0.25)]"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>

          </form>
        </div>
      </main>

    </div>
  );
}
