// components/CheckoutTimer.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutTimer({ expiresAt, orderId }: { expiresAt: string, orderId: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const router = useRouter();

  useEffect(() => {
    const targetTime = new Date(expiresAt).getTime();

    const interval = setInterval(async () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft('00:00');
        
        // Trigger auto-release
        await fetch('/api/checkout/expire', {
          method: 'POST',
          body: JSON.stringify({ orderId }),
        });
        
        alert("Time expired! This ticket has been released back to the market.");
        router.push('/discover'); // Kick them back to events page
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, orderId, router]);

  return (
    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
      <p className="text-sm text-red-600 font-semibold uppercase tracking-wider mb-1">
        Time Remaining to Transfer
      </p>
      <div className="text-4xl font-mono font-bold text-red-700">
        {timeLeft || '--:--'}
      </div>
    </div>
  );
}