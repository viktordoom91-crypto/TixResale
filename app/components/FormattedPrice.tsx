// app/components/FormattedPrice.tsx
'use client';

import { useCurrency } from './CurrencyProvider';

export default function FormattedPrice({ amount, className = "" }: { amount: number, className?: string }) {
  const { formatPrice } = useCurrency();
  return <span className={className}>{formatPrice(amount)}</span>;
}
