// app/components/CurrencyProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

// Fallback rates just in case the live API goes down
const FALLBACK_RATES: Record<Currency, number> = {
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
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('user-currency') as Currency;
    if (stored && FALLBACK_RATES[stored]) {
      setCurrency(stored);
    } else {
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
    }

    // 🛠 NEW: Fetch real-time live currency exchange rates
    const fetchLiveRates = async () => {
      try {
        // Using a free, no-auth open exchange rate API
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        if (data && data.rates) {
          setRates(data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch live rates, falling back to static rates.', error);
      }
    };

    fetchLiveRates();
  }, []);

  const handleSetCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('user-currency', c);
  };

  const formatPrice = (amountInUSD: number) => {
    // Prevent hydration errors by returning base string on server
    if (!mounted) return `$${amountInUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // 🛠 NEW: Use the dynamically fetched rate!
    const dynamicRate = rates[currency] || FALLBACK_RATES[currency] || 1;
    const converted = amountInUSD * dynamicRate;
    
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
