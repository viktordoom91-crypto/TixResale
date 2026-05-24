// app/admin/events/[id]/edit/DeleteEventButton.tsx
'use client';

import { Trash2 } from 'lucide-react';

export default function DeleteEventButton({
  eventId,
  deleteAction,
}: {
  eventId: string;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={deleteAction}
      onSubmit={(e) => {
        if (!confirm('Permanently delete this event and all its tickets?')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
      >
        <Trash2 className="w-4 h-4" /> Delete
      </button>
    </form>
  );
}
