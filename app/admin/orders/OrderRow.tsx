// app/admin/orders/OrderRow.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function OrderRow({ order }: { order: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${loading ? 'opacity-50' : ''}`}>
      <td className="p-5">
        <p className="font-bold text-gray-900 line-clamp-1">{order.listing.event.title}</p>
        <p className="text-xs text-gray-500 font-medium font-mono mt-1">ID: {order.id.slice(-8)}</p>
      </td>
      <td className="p-5">
        <p className="font-bold text-sm">{order.user?.name || 'Guest User'}</p>
        <p className="text-xs text-gray-500">{order.user?.email || 'No email'}</p>
      </td>
      <td className="p-5 font-black">₦{order.listing.price.toLocaleString()}</td>
      <td className="p-5">
        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
          ${order.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
            'bg-orange-100 text-orange-700'}`}>
          {order.status === 'PENDING' && <Clock className="w-3 h-3" />}
          {order.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
          {order.status}
        </span>
      </td>
      <td className="p-5 text-right space-x-2">
        {order.status === 'PENDING' && (
          <>
            <button onClick={() => updateStatus('APPROVED')} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition">Approve</button>
            <button onClick={() => updateStatus('CANCELLED')} disabled={loading} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold transition">Cancel</button>
          </>
        )}
      </td>
    </tr>
  );
}