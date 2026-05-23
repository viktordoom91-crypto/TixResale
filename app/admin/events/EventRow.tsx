// app/admin/events/EventRow.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Ticket, Flame, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

export default function EventRow({ event }: { event: any }) {
  const router = useRouter();
  const [isFeatured, setIsFeatured] = useState(event.isFeatured);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleFeatured = async () => {
    setIsUpdating(true);
    const newStatus = !isFeatured;
    setIsFeatured(newStatus); 

    try {
      await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newStatus })
      });
      router.refresh(); 
    } catch (error) {
      console.error(error);
      setIsFeatured(!newStatus); 
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteEvent = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this event?")) return;
    
    setIsDeleting(true);
    try {
      await fetch(`/api/admin/events/${event.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) {
      console.error("Failed to delete", error);
      setIsDeleting(false);
    }
  };

  // Gracefully handle ticket count whether it uses 'listings' or 'ticketBatches'
  const ticketCount = event._count?.ticketBatches || event._count?.listings || 0;

  if (isDeleting) return null; // Hide row immediately upon successful delete

  return (
    <tr className={`hover:bg-zinc-800/20 transition-colors group border-b border-zinc-800 ${isUpdating ? 'opacity-75' : ''} ${isFeatured ? 'bg-lime-500/5' : ''}`}>
      
      {/* 1. Event Info */}
      <td className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-700">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover grayscale-[20%]" />
            ) : (
              <ImageIcon className="w-5 h-5 text-zinc-600" />
            )}
          </div>
          <div>
            <p className="font-black text-sm text-white line-clamp-1 uppercase tracking-tight">{event.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${event.isManual ? 'bg-lime-400/10 text-lime-400' : 'bg-blue-400/10 text-blue-400'}`}>
                {event.isManual ? 'Manual' : 'API'}
              </span>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ID: {event.id.slice(-6)}</p>
            </div>
          </div>
        </div>
      </td>

      {/* 2. Location & Date */}
      <td className="p-6 space-y-1">
        <div className="flex items-center text-xs font-bold text-zinc-300">
          <MapPin className="w-3.5 h-3.5 mr-2 text-lime-400/70" /> {event.city}
        </div>
        <div className="flex items-center text-xs font-bold text-zinc-500">
          <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-600" /> 
          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </td>

      {/* 3. Inventory */}
      <td className="p-6">
        <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
          <Ticket className="w-3.5 h-3.5 text-lime-400" />
          {ticketCount} Tickets
        </span>
      </td>

      {/* 4. Actions (Featured Toggle, Edit, Delete) */}
      <td className="p-6">
        <div className="flex items-center justify-end gap-4">
          
          {/* Featured Toggle */}
          <button 
            onClick={toggleFeatured}
            disabled={isUpdating}
            className={`relative flex items-center justify-between w-16 h-7 rounded-full p-1 transition-all duration-300 border ${
              isFeatured ? 'bg-lime-400/20 border-lime-400/50' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transform transition-transform duration-300 ${
              isFeatured ? 'translate-x-9 bg-lime-400 shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'translate-x-0 bg-zinc-600'
            }`}>
              {isFeatured && <Flame className="w-3 h-3 text-black fill-current" />}
            </div>
          </button>

          <div className="w-px h-6 bg-zinc-800 mx-2"></div>

          {/* Edit Button */}
          <Link 
            href={`/admin/events/${event.id}/edit`} 
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-lime-500/50 hover:text-lime-400 rounded-lg transition-all"
            title="Edit Event"
          >
            <Edit className="w-4 h-4" />
          </Link>

          {/* Delete Button */}
          <button 
            onClick={deleteEvent}
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
            title="Delete Event"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
      </td>
    </tr>
  );
          }
