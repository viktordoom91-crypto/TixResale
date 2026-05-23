// app/admin/events/[id]/edit/page.tsx
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Ticket, MapPin, Calendar, Image as ImageIcon, FileText, DollarSign, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

// --- SERVER ACTION: UPDATE EVENT ---
async function updateEvent(formData: FormData) {
  'use server';
  
  const id = formData.get('eventId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const city = formData.get('city') as string;
  const dateString = formData.get('date') as string;
  const basePrice = parseFloat(formData.get('basePrice') as string);
  const imageUrl = formData.get('imageUrl') as string;

  await prisma.event.update({
    where: { id },
    data: {
      title,
      description,
      city,
      date: new Date(dateString),
      basePrice,
      imageUrl: imageUrl || null,
    }
  });

  revalidatePath('/admin/events');
  revalidatePath('/');
  redirect('/admin/events');
}

// --- SERVER ACTION: DELETE EVENT ---
async function deleteEvent(formData: FormData) {
  'use server';
  const id = formData.get('eventId') as string;
  
  await prisma.event.delete({ where: { id } });
  
  revalidatePath('/admin/events');
  revalidatePath('/');
  redirect('/admin/events');
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
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

  // Format the Date object for the HTML datetime-local input
  const formattedDate = new Date(event.date).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans pb-24 selection:bg-lime-500 selection:text-black">
      
      <header className="bg-zinc-950 border-b border-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/events" className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-lime-500/50 hover:text-lime-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">Edit Event</h1>
              <p className="text-zinc-500 font-medium mt-1 text-sm">ID: {event.id}</p>
            </div>
          </div>
          
          {/* SECURE DELETE BUTTON */}
          <form action={deleteEvent} onSubmit={(e) => { if(!confirm('Are you sure you want to permanently delete this event?')) e.preventDefault(); }}>
            <input type="hidden" name="eventId" value={event.id} />
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 blur-[80px] rounded-full pointer-events-none" />

          <form action={updateEvent} className="space-y-8 relative z-10">
            <input type="hidden" name="eventId" value={event.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Ticket className="w-3.5 h-3.5 text-lime-400" /> Event Title</label>
                <input required type="text" name="title" defaultValue={event.title} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-lime-400" /> City / Location</label>
                <input required type="text" name="city" defaultValue={event.city} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-lime-400" /> Date & Time</label>
                <input required type="datetime-local" name="date" defaultValue={formattedDate} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all [color-scheme:dark]" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-lime-400" /> Base Price (₦)</label>
                <input required type="number" step="0.01" name="basePrice" defaultValue={event.basePrice} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-lime-400" /> Image URL</label>
                <input type="url" name="imageUrl" defaultValue={event.imageUrl || ''} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-lime-400" /> Description / Venue info</label>
                <textarea name="description" defaultValue={event.description || ''} rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-zinc-700 resize-none" />
              </div>

            </div>

            <div className="pt-8 border-t border-zinc-800 flex justify-end gap-4">
              <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-lime-400 text-black px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-lime-300 transition-all shadow-[0_0_20px_rgba(57,255,20,0.15)] hover:shadow-[0_0_30px_rgba(57,255,20,0.25)]">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
