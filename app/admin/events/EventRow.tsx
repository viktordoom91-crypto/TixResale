// app/admin/events/EventRow.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Ticket, Flame, Edit } from 'lucide-react';
import Link from 'next/link';

export default function EventRow({ event }: { event: any }) {
  const router = useRouter();
  const [isFeatured, setIsFeatured] = useState(event.isFeatured);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleFeatured = async () => {
    setIsUpdating(true);
    const newStatus = !isFeatured;
    setIsFeatured(newStatus);

    try {
      await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newStatus }),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsFeatured(!newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isUpdating ? 'opacity-75' : ''}`}>

      {/* Event Info */}
      <td className="p-5">
        <div className="flex items-center gap-4">
          <img
            src={event.imageUrl || 'https://via.placeholder.com/150'}
            alt={event.title}
            className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-gray-200"
          />
          <div>
            <p className="font-black text-gray-900 line-clamp-1 max-w-[250px]">{event.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {event.isManual ? 'Manual' : 'API'}
              </span>
              <p className="text-xs text-gray-500 font-medium font-mono">ID: {event.id.slice(-6)}</p>
            </div>
          </div>
        </div>
      </td>

      {/* Location & Date */}
      <td className="p-5">
        <div className="space-y-1">
          <p className="text-sm font-bold flex items-center gap-1.5 text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {event.city}
          </p>
          <p className="text-xs font-medium flex items-center gap-1.5 text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {new Date(event.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>
      </td>

      {/* Inventory & Pricing */}
      <td className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-lg text-gray-900 leading-tight">{event._count.listings}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Tickets</p>
          </div>
        </div>
      </td>

      {/* Featured Toggle */}
      <td className="p-5">
        <div className="flex justify-center">
          <button
            onClick={toggleFeatured}
            disabled={isUpdating}
            className={`relative flex items-center justify-between w-20 h-8 rounded-full p-1 transition-all duration-300 ${
              isFeatured
                ? 'bg-orange-100 border border-orange-200'
                : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <span className={`absolute left-2.5 text-[10px] font-black uppercase tracking-wider transition-opacity ${isFeatured ? 'opacity-100 text-orange-600' : 'opacity-0'}`}>
              Hot
            </span>
            <div className={`w-6 h-6 rounded-full shadow-sm flex items-center justify-center transform transition-transform duration-300 ${
              isFeatured ? 'translate-x-12 bg-orange-500' : 'translate-x-0 bg-white'
            }`}>
              {isFeatured && <Flame className="w-3 h-3 text-white fill-current" />}
            </div>
          </button>
        </div>
      </td>

      {/* Edit Button */}
      <td className="p-5 text-right">
        <Link
          href={`/admin/events/${event.id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
        >
          <Edit className="w-3.5 h-3.5" /> Edit
        </Link>
      </td>

    </tr>
  );
}
