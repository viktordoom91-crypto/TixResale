// app/components/BuyTicketButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from './CurrencyProvider';

export default function BuyTicketButton({ listingId, price }: { listingId: string, price: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { formatPrice } = useCurrency(); // 🛠 NEW: Initialize currency formatter

  const handleBuy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          userId: '65f1a2b3c4d5e6f7a8b9c0d1', 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/checkout/${data.orderId}`);
      } else {
        alert(data.error || 'Failed to lock ticket.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleBuy}
      disabled={loading}
      className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
      }`}
    >
      {/* 🛠 FIXED: Replaced hardcoded Naira with dynamic formatPrice */}
      {loading ? 'Locking Ticket...' : `Buy for ${formatPrice(price)}`}
    </button>
  );
}
