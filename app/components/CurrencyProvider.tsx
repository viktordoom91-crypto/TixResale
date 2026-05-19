// components/CurrencyProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Removed NGN, set USD as the base currency
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

// Exchange rates relative to 1 USD
const RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52
};

const SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$'
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (amountInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('user-currency') as Currency;
    if (stored && RATES[stored]) {
      setCurrency(stored);
      return;
    }

    // Auto-detect based on their device's timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('Europe/London')) setCurrency('GBP');
      else if (tz.includes('Europe')) setCurrency('EUR');
      else if (tz.includes('Australia')) setCurrency('AUD');
      else if (tz.includes('Canada')) setCurrency('CAD');
      else setCurrency('USD');
    } catch (e) {
      setCurrency('USD');
    }
  }, []);

  const handleSetCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('user-currency', c);
  };

  const formatPrice = (amountInUSD: number) => {
    const converted = amountInUSD * RATES[currency];
    // Prevent hydration errors by returning base string on server
    if (!mounted) return `$${amountInUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    return `${SYMBOLS[currency]}${converted.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
