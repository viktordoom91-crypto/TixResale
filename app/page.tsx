// app/page.tsx
'use client';

import { useEffect, useState, Suspense, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Tag, MapPin, Calendar, Music, Tent, Ticket, Trophy, Search, Loader2, Radar, CheckCircle2, TrendingUp, Star, Mail, SearchCheck, Mic, Percent, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

// 🛠 Import the dynamic currency formatter
import { useCurrency } from './components/CurrencyProvider';

// --- TYPES ---
type Listing = { id: string; price: number; quantity: number };
type Event = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  city: string;
  imageUrl: string | null;
  listings: Listing[];
  minPrice?: number; // Captures TM's actual price before selling out
  maxPrice?: number;
};

const CATEGORIES = [
  { id: 'All', label: 'All Events', icon: Zap },
  { id: 'Concerts', label: 'Concerts', icon: Music },
  { id: 'Festivals', label: 'Festivals', icon: Tent },
  { id: 'Comedy', label: 'Comedy', icon: Mic }, 
  { id: 'Theater', label: 'Theater & Arts', icon: Ticket },
  { id: 'Sports', label: 'Sports', icon: Trophy },
];

const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function HomeContent() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get('city');
  const keywordParam = searchParams.get('keyword');
  const categoryParam = searchParams.get('category');

  // Initialize currency formatter
  const { formatPrice } = useCurrency();

  const [data, setData] = useState<{ events: Event[]; count: number; location: { city: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false); 
  
  const [searchInput, setSearchInput] = useState(keywordParam || '');
  const [activeKeyword, setActiveKeyword] = useState(keywordParam || '');
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'All');
  const [activeDate, setActiveDate] = useState<string>('Any');
  const [currentHero, setCurrentHero] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [visibleLimit, setVisibleLimit] = useState(6);
  
  // 🚀 PAGINATION STATE FOR LARGE DATASETS
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination to page 1 whenever search filters alter to capture full fresh tours
  useEffect(() => {
    if (keywordParam !== null) {
      setActiveKeyword(keywordParam);
      setSearchInput(keywordParam);
      setActiveCategory('All'); 
    }
    if (categoryParam !== null) {
      setActiveCategory(categoryParam);
      setActiveKeyword('');
      setSearchInput('');
    }
    setCurrentPage(1);
  }, [keywordParam, categoryParam]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeKeyword, activeCategory, cityParam]);

  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date(); 
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        id: getLocalDateString(d),
        dayOfWeek: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfMonth: d.getDate(),
      });
    }
    return dates;
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchStreamedEvents() {
      setLoading(true);
      setIsStreaming(true);
      
      // Default to 'Global' if no city is specified to unlock worldwide queries
      setData({ events: [], count: 0, location: { city: cityParam || 'Global' } });

      try {
        let apiUrl = '/api/events?';
        if (cityParam) apiUrl += `city=${encodeURIComponent(cityParam)}&`;
        if (activeKeyword) apiUrl += `keyword=${encodeURIComponent(activeKeyword)}&`;
        if (activeCategory !== 'All') apiUrl += `category=${encodeURIComponent(activeCategory)}&`;
        apiUrl += `page=${currentPage}&limit=50`;

        const response = await fetch(apiUrl);
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const accumulatedEvents: Event[] = [];
        let streamBuffer = '';
        let lastUpdateTime = Date.now();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split("\n");
          
          // Retain the incomplete chunk component in buffer for next cycle assembly
          streamBuffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === "") continue;
            try {
              const newEvents = JSON.parse(line);
              
              // 🚀 SCALABILITY FIX: Push directly instead of using spread (...) which causes massive memory thrashing
              if (Array.isArray(newEvents)) {
                accumulatedEvents.push(...newEvents);
              } else {
                accumulatedEvents.push(newEvents);
              }
              
              // 🚀 PERFORMANCE FIX: Throttle React state updates to every 100ms so the UI thread doesn't choke on massive tours
              if (isMounted && (Date.now() - lastUpdateTime > 100)) {
                setData({
                  events: [...accumulatedEvents],
                  count: accumulatedEvents.length,
                  location: { city: cityParam || 'Global' }
                });
                setLoading(false); 
                lastUpdateTime = Date.now();
              }
            } catch(e) {
              // Gracefully bypass line-fragments until loop catch matches completely
            }
          }
        }
        
        // Final update catch all after stream finishes
        if (isMounted) {
          setData({
            events: [...accumulatedEvents],
            count: accumulatedEvents.length,
            location: { city: cityParam || 'Global' }
          });
        }

      } catch (error) {
        console.error('Streaming network error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsStreaming(false);
        }
      }
    }
    
    fetchStreamedEvents();
    return () => { isMounted = false; };
  }, [cityParam, activeKeyword, activeCategory, currentPage]);

  const currentCity = data?.location?.city || cityParam || 'Global';

  const validEvents = useMemo(() => {
    if (!data?.events) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return data.events.filter(e => new Date(e.date) >= today);
  }, [data?.events]);

  const heroEvents = useMemo(() => {
    return [...validEvents].sort((a, b) => (b.listings?.length || 0) - (a.listings?.length || 0)).slice(0, 3);
  }, [validEvents]);

  const dynamicTrending = useMemo(() => {
    if (!validEvents || validEvents.length === 0) return [];
    const unique = [];
    const seen = new Set();
    for (const ev of validEvents) {
      if (!seen.has(ev.title)) {
        seen.add(ev.title);
        const category = ev.description?.split(' at ')[0] || 'Live Event';
        unique.push({ name: ev.title, category, image: ev.imageUrl });
        if (unique.length === 6) break; 
      }
    }
    return unique;
  }, [validEvents]);

  const dynamicArtists = useMemo(() => {
    if (!validEvents || validEvents.length === 0) return [];
    const unique = [];
    const seen = new Set();
    const sortedByPopularity = [...validEvents].sort((a, b) => (b.listings?.length || 0) - (a.listings?.length || 0));
    let rank = 1;
    for (const ev of sortedByPopularity) {
      const cleanName = ev.title.split(' - ')[0]; 
      if (!seen.has(cleanName)) {
        seen.add(cleanName);
        unique.push({ rank: rank++, name: cleanName, image: ev.imageUrl });
        if (unique.length === 8) break; 
      }
    }
    return unique;
  }, [validEvents]);

  const filteredEvents = useMemo(() => {
    return validEvents.filter((event) => {
      let matchesDate = true;
      if (activeDate !== 'Any') {
        const eventDate = new Date(event.date);
        matchesDate = getLocalDateString(eventDate) === activeDate;
      }
      return matchesDate; 
    });
  }, [validEvents, activeDate]);

  useEffect(() => {
    setVisibleLimit(6);
    const interval = setInterval(() => {
      setVisibleLimit((prev) => (prev >= filteredEvents.length ? prev : prev + 3));
    }, 150);
    return () => clearInterval(interval);
  }, [filteredEvents]);

  useEffect(() => {
    if (heroEvents.length <= 1) {
      setCurrentHero(0);
      return;
    }
    const timer = setInterval(() => setCurrentHero((p) => (p + 1) % heroEvents.length), 5000);
    return () => clearInterval(timer);
  }, [heroEvents]);

  useEffect(() => {
    const timer = setInterval(() => setRotation((p) => p + 90), 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setActiveKeyword(searchInput);
    setActiveCategory('All'); 
    setActiveDate('Any');
    setCurrentPage(1);
  };

  const activeHero = heroEvents[currentHero] || heroEvents[0];
  const scanTarget = activeCategory !== 'All' ? activeCategory : (activeKeyword ? `"${activeKeyword}"` : currentCity);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-lime-500 selection:text-black pb-24">
      
      {/* --- 1. HERO SLIDER --- */}
      <div className="relative h-[65vh] w-full overflow-hidden border-b border-zinc-900 bg-zinc-950">
        {loading && heroEvents.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900 z-10" />
            <div className="z-20 mt-16 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-lime-400 blur-2xl opacity-20 rounded-full animate-pulse" />
                <Radar className="w-16 h-16 text-lime-400 animate-spin relative z-10" style={{ animationDuration: '3s' }} />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">Scanning {scanTarget}</h1>
              <p className="text-zinc-400 font-medium">Syncing live Ticketmaster inventory. Refresh in a few seconds.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {heroEvents.length > 0 && activeHero && (
              <motion.div
                key={activeHero.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
                <img src={activeHero.imageUrl || ''} alt="Hero" className="w-full h-full object-cover opacity-60 grayscale-[30%]" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 z-20 max-w-[1200px] mx-auto">
                  <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block px-3 py-1 bg-lime-500/10 text-lime-400 border border-lime-500/20 text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md">
                    {activeCategory !== 'All' ? `Global Trending ${activeCategory}` : `Trending in ${currentCity}`}
                  </motion.span>
                  <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-tight line-clamp-2">
                    {activeHero.title}
                  </motion.h1>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-6 text-sm font-bold text-zinc-400">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-lime-400"/> {activeHero.city}</span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-lime-400"/> {new Date(activeHero.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="absolute top-8 left-0 w-full z-30 px-4">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder={isStreaming ? "Searching live inventory..." : `Search global events, artists, or venues...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-14 pr-32 py-4 rounded-full bg-zinc-900/80 backdrop-blur-md text-white font-medium border border-zinc-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all outline-none"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-lime-400 text-black px-6 py-2.5 rounded-full font-black text-sm hover:bg-lime-300 transition-colors uppercase tracking-widest">
              Find
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        
        {/* VALUE PROPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, text: "100% Verified Sellers" },
            { icon: Tag, text: "Cheapest Escrow Options" },
            { icon: Zap, text: "Instant Ticket Delivery" }
          ].map((item, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 flex items-center justify-center gap-3 hover:border-lime-500/50 transition-colors cursor-default">
              <item.icon className="w-5 h-5 text-lime-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 🚀 DYNAMIC LIVE CHARTS (Trending & Top Artists) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-zinc-900 pb-16">
          
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-lime-400/10 rounded-full flex items-center justify-center border border-lime-400/20">
                <TrendingUp className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Trending Now</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Live in {activeCategory !== 'All' ? 'Global' : currentCity}</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading && dynamicTrending.length === 0 ? (
                <motion.div key="skeleton-trend" className="flex overflow-x-auto gap-5 pb-8 pt-2 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="flex-shrink-0 w-56 h-72 rounded-3xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key={`trending-${currentCity}-${activeCategory}`} 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="flex overflow-x-auto gap-5 pb-8 pt-2 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {dynamicTrending.map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => { setSearchInput(item.name); setActiveKeyword(item.name); setActiveCategory('All'); }} 
                      className="flex-shrink-0 group text-left w-56 relative outline-none"
                    >
                      <div className="h-72 rounded-3xl overflow-hidden relative border border-zinc-800 bg-zinc-900 shadow-xl group-hover:border-lime-400/50 group-hover:shadow-[0_0_30px_rgba(57,255,20,0.15)] transition-all duration-500">
                        <img src={item.image || ''} alt={item.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-700 ease-out grayscale-[30%] group-hover:grayscale-0" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        
                        <div className="absolute bottom-6 left-6 right-6">
                          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                            {item.category}
                          </span>
                          <p className="font-black text-white text-2xl uppercase tracking-tighter leading-tight group-hover:text-lime-400 transition-colors drop-shadow-lg line-clamp-2">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-lime-400/10 rounded-full flex items-center justify-center border border-lime-400/20">
                <Star className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Top Artists</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Most Searched</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading && dynamicArtists.length === 0 ? (
                <motion.div key="skeleton-artists" className="flex overflow-x-auto gap-6 pb-8 pt-4 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="flex-shrink-0 flex flex-col items-center w-28">
                      <div className="w-24 h-24 rounded-full bg-zinc-900/50 border border-zinc-800 animate-pulse mb-4" />
                      <div className="h-3 w-16 bg-zinc-900/50 rounded animate-pulse" />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key={`artists-${currentCity}-${activeCategory}`}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex overflow-x-auto gap-6 pb-8 pt-4 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {dynamicArtists.map((artist) => (
                    <button 
                      key={artist.rank} 
                      onClick={() => { setSearchInput(artist.name); setActiveKeyword(artist.name); setActiveCategory('All'); }} 
                      className="flex-shrink-0 group relative flex flex-col items-center w-28 outline-none"
                    >
                      <div className="absolute -top-6 text-7xl font-black italic text-zinc-800/50 group-hover:text-lime-400/20 transition-colors z-0 select-none pointer-events-none">
                        {artist.rank}
                      </div>
                      
                      <div className={`w-24 h-24 rounded-full overflow-hidden relative z-10 mb-4 transition-all duration-500 ${artist.rank === 1 ? 'border-2 border-lime-400 shadow-[0_0_20px_rgba(57,255,20,0.3)] ring-4 ring-lime-400/10' : 'border-2 border-zinc-800 group-hover:border-lime-500/50'}`}>
                        <img src={artist.image || ''} alt={artist.name} className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" />
                      </div>
                      
                      <p className="font-black text-white text-sm uppercase tracking-tight group-hover:text-lime-400 transition-colors text-center w-full truncate relative z-10">
                        {artist.name}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MAIN FILTER TABS */}
        <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl py-4 border-b border-zinc-900 mb-8">
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CATEGORIES.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id} onClick={() => setActiveCategory(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${activeCategory === tab.id ? 'border-lime-400 text-black' : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
                >
                  {activeCategory === tab.id && (
                    <motion.div layoutId="cat-bg" className="absolute inset-0 bg-lime-400 rounded-full" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 uppercase tracking-widest text-xs">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2 pt-2 items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button 
              onClick={() => setActiveDate('Any')}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-all ${activeDate === 'Any' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:bg-zinc-900'}`}
            >
              <span className="text-xs font-bold uppercase">All</span>
              <span className="text-lg font-black leading-none mt-1">Dates</span>
            </button>
            <div className="w-px h-8 bg-zinc-800 mx-2" />
            
            {upcomingDates.map((dateObj) => (
              <button
                key={dateObj.id} 
                onClick={() => setActiveDate(dateObj.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-all ${activeDate === dateObj.id ? 'bg-lime-400 border-lime-400 text-black shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
               >
                <span className="text-[10px] font-black uppercase tracking-widest">{dateObj.dayOfWeek}</span>
                <span className="text-xl font-black leading-none mt-1">{dateObj.dayOfMonth}</span>
              </button>
            ))}
          </div>
        </div>

        {/* EVENT FEED */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              {activeKeyword ? `Results for "${activeKeyword}"` : `${activeCategory === 'All' ? 'Upcoming' : activeCategory} Events`}
              
              {isStreaming && !loading && (
                <span className="bg-lime-500/10 border border-lime-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                  <Radar className="w-3.5 h-3.5 text-lime-400 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">Syncing More...</span>
                </span>
              )}
            </h2>
            
            {!loading && (
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                {isStreaming ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" /> Finding verified tickets</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-lime-400" /> {filteredEvents.length} Verified</>
                )}
              </span>
            )}
          </div>

          {loading && filteredEvents.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-[380px] bg-zinc-900/40 border border-zinc-800/50 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 && !isStreaming ? (
            <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center justify-center">
              <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white uppercase mb-2">No Matches Found</h3>
              <p className="text-zinc-500 font-medium text-sm">Try adjusting your dates or searching a different keyword.</p>
            </div>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredEvents.slice(0, visibleLimit).map((event, index) => {
                    const availableTickets = event.listings?.length || 0;
                    
                    // 🚀 PRICING FIX: Accurate Base Price / Fallback to original TM value instead of hallucination
                    let lowestPrice = 0;
                    if (availableTickets > 0) {
                      lowestPrice = Math.min(...event.listings.map(l => l.price));
                    } else if (event.minPrice && event.minPrice > 0) {
                      lowestPrice = event.minPrice; 
                    }

                    return (
                      <motion.div
                        layout initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                        key={`${event.id}-${index}`} 
                        className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-lime-500/50 transition-all flex flex-col cursor-pointer shadow-xl"
                      >
                        <div className="h-48 bg-zinc-950 overflow-hidden relative">
                          <img src={event.imageUrl || ''} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-700 ease-in-out opacity-90 grayscale-[20%]" />
                          <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-zinc-800">
                            <div className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                            <div className="text-xl font-black leading-none text-white">{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric' })}</div>
                          </div>
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="font-black text-xl text-white mb-2 line-clamp-2 leading-tight group-hover:text-lime-400 transition-colors uppercase tracking-tight">{event.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase trac// app/page.tsx
'use client';

import { useEffect, useState, Suspense, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Tag, MapPin, Calendar, Music, Tent, Ticket, Trophy, Search, Loader2, Radar, CheckCircle2, TrendingUp, Star, Mail, SearchCheck, Mic, Percent, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

// 🛠 Import the dynamic currency formatter
import { useCurrency } from './components/CurrencyProvider';

// --- TYPES ---
type Listing = { id: string; price: number; quantity: number };
type Event = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  city: string;
  imageUrl: string | null;
  listings: Listing[];
  minPrice?: number; // Captures TM's actual price before selling out
  maxPrice?: number;
};

const CATEGORIES = [
  { id: 'All', label: 'All Events', icon: Zap },
  { id: 'Concerts', label: 'Concerts', icon: Music },
  { id: 'Festivals', label: 'Festivals', icon: Tent },
  { id: 'Comedy', label: 'Comedy', icon: Mic }, 
  { id: 'Theater', label: 'Theater & Arts', icon: Ticket },
  { id: 'Sports', label: 'Sports', icon: Trophy },
];

const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function HomeContent() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get('city');
  const keywordParam = searchParams.get('keyword');
  const categoryParam = searchParams.get('category');

  // Initialize currency formatter
  const { formatPrice } = useCurrency();

  const [data, setData] = useState<{ events: Event[]; count: number; location: { city: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false); 
  
  const [searchInput, setSearchInput] = useState(keywordParam || '');
  const [activeKeyword, setActiveKeyword] = useState(keywordParam || '');
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'All');
  const [activeDate, setActiveDate] = useState<string>('Any');
  const [currentHero, setCurrentHero] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [visibleLimit, setVisibleLimit] = useState(6);
  
  // 🚀 PAGINATION STATE FOR LARGE DATASETS
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination to page 1 whenever search filters alter to capture full fresh tours
  useEffect(() => {
    if (keywordParam !== null) {
      setActiveKeyword(keywordParam);
      setSearchInput(keywordParam);
      setActiveCategory('All'); 
    }
    if (categoryParam !== null) {
      setActiveCategory(categoryParam);
      setActiveKeyword('');
      setSearchInput('');
    }
    setCurrentPage(1);
  }, [keywordParam, categoryParam]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeKeyword, activeCategory, cityParam]);

  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date(); 
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        id: getLocalDateString(d),
        dayOfWeek: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfMonth: d.getDate(),
      });
    }
    return dates;
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchStreamedEvents() {
      setLoading(true);
      setIsStreaming(true);
      
      // Default to 'Global' if no city is specified to unlock worldwide queries
      setData({ events: [], count: 0, location: { city: cityParam || 'Global' } });

      try {
        let apiUrl = '/api/events?';
        if (cityParam) apiUrl += `city=${encodeURIComponent(cityParam)}&`;
        if (activeKeyword) apiUrl += `keyword=${encodeURIComponent(activeKeyword)}&`;
        if (activeCategory !== 'All') apiUrl += `category=${encodeURIComponent(activeCategory)}&`;
        apiUrl += `page=${currentPage}&limit=50`;

        const response = await fetch(apiUrl);
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const accumulatedEvents: Event[] = [];
        let streamBuffer = '';
        let lastUpdateTime = Date.now();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split("\n");
          
          // Retain the incomplete chunk component in buffer for next cycle assembly
          streamBuffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === "") continue;
            try {
              const newEvents = JSON.parse(line);
              
              // 🚀 SCALABILITY FIX: Push directly instead of using spread (...) which causes massive memory thrashing
              if (Array.isArray(newEvents)) {
                accumulatedEvents.push(...newEvents);
              } else {
                accumulatedEvents.push(newEvents);
              }
              
              // 🚀 PERFORMANCE FIX: Throttle React state updates to every 100ms so the UI thread doesn't choke on massive tours
              if (isMounted && (Date.now() - lastUpdateTime > 100)) {
                setData({
                  events: [...accumulatedEvents],
                  count: accumulatedEvents.length,
                  location: { city: cityParam || 'Global' }
                });
                setLoading(false); 
                lastUpdateTime = Date.now();
              }
            } catch(e) {
              // Gracefully bypass line-fragments until loop catch matches completely
            }
          }
        }
        
        // Final update catch all after stream finishes
        if (isMounted) {
          setData({
            events: [...accumulatedEvents],
            count: accumulatedEvents.length,
            location: { city: cityParam || 'Global' }
          });
        }

      } catch (error) {
        console.error('Streaming network error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsStreaming(false);
        }
      }
    }
    
    fetchStreamedEvents();
    return () => { isMounted = false; };
  }, [cityParam, activeKeyword, activeCategory, currentPage]);

  const currentCity = data?.location?.city || cityParam || 'Global';

  const validEvents = useMemo(() => {
    if (!data?.events) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return data.events.filter(e => new Date(e.date) >= today);
  }, [data?.events]);

  const heroEvents = useMemo(() => {
    return [...validEvents].sort((a, b) => (b.listings?.length || 0) - (a.listings?.length || 0)).slice(0, 3);
  }, [validEvents]);

  const dynamicTrending = useMemo(() => {
    if (!validEvents || validEvents.length === 0) return [];
    const unique = [];
    const seen = new Set();
    for (const ev of validEvents) {
      if (!seen.has(ev.title)) {
        seen.add(ev.title);
        const category = ev.description?.split(' at ')[0] || 'Live Event';
        unique.push({ name: ev.title, category, image: ev.imageUrl });
        if (unique.length === 6) break; 
      }
    }
    return unique;
  }, [validEvents]);

  const dynamicArtists = useMemo(() => {
    if (!validEvents || validEvents.length === 0) return [];
    const unique = [];
    const seen = new Set();
    const sortedByPopularity = [...validEvents].sort((a, b) => (b.listings?.length || 0) - (a.listings?.length || 0));
    let rank = 1;
    for (const ev of sortedByPopularity) {
      const cleanName = ev.title.split(' - ')[0]; 
      if (!seen.has(cleanName)) {
        seen.add(cleanName);
        unique.push({ rank: rank++, name: cleanName, image: ev.imageUrl });
        if (unique.length === 8) break; 
      }
    }
    return unique;
  }, [validEvents]);

  const filteredEvents = useMemo(() => {
    return validEvents.filter((event) => {
      let matchesDate = true;
      if (activeDate !== 'Any') {
        const eventDate = new Date(event.date);
        matchesDate = getLocalDateString(eventDate) === activeDate;
      }
      return matchesDate; 
    });
  }, [validEvents, activeDate]);

  useEffect(() => {
    setVisibleLimit(6);
    const interval = setInterval(() => {
      setVisibleLimit((prev) => (prev >= filteredEvents.length ? prev : prev + 3));
    }, 150);
    return () => clearInterval(interval);
  }, [filteredEvents]);

  useEffect(() => {
    if (heroEvents.length <= 1) {
      setCurrentHero(0);
      return;
    }
    const timer = setInterval(() => setCurrentHero((p) => (p + 1) % heroEvents.length), 5000);
    return () => clearInterval(timer);
  }, [heroEvents]);

  useEffect(() => {
    const timer = setInterval(() => setRotation((p) => p + 90), 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setActiveKeyword(searchInput);
    setActiveCategory('All'); 
    setActiveDate('Any');
    setCurrentPage(1);
  };

  const activeHero = heroEvents[currentHero] || heroEvents[0];
  const scanTarget = activeCategory !== 'All' ? activeCategory : (activeKeyword ? `"${activeKeyword}"` : currentCity);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-lime-500 selection:text-black pb-24">
      
      {/* --- 1. HERO SLIDER --- */}
      <div className="relative h-[65vh] w-full overflow-hidden border-b border-zinc-900 bg-zinc-950">
        {loading && heroEvents.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900 z-10" />
            <div className="z-20 mt-16 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-lime-400 blur-2xl opacity-20 rounded-full animate-pulse" />
                <Radar className="w-16 h-16 text-lime-400 animate-spin relative z-10" style={{ animationDuration: '3s' }} />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">Scanning {scanTarget}</h1>
              <p className="text-zinc-400 font-medium">Syncing live Ticketmaster inventory. Refresh in a few seconds.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {heroEvents.length > 0 && activeHero && (
              <motion.div
                key={activeHero.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
                <img src={activeHero.imageUrl || ''} alt="Hero" className="w-full h-full object-cover opacity-60 grayscale-[30%]" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 z-20 max-w-[1200px] mx-auto">
                  <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block px-3 py-1 bg-lime-500/10 text-lime-400 border border-lime-500/20 text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md">
                    {activeCategory !== 'All' ? `Global Trending ${activeCategory}` : `Trending in ${currentCity}`}
                  </motion.span>
                  <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-tight line-clamp-2">
                    {activeHero.title}
                  </motion.h1>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-6 text-sm font-bold text-zinc-400">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-lime-400"/> {activeHero.city}</span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-lime-400"/> {new Date(activeHero.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="absolute top-8 left-0 w-full z-30 px-4">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder={isStreaming ? "Searching live inventory..." : `Search global events, artists, or venues...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-14 pr-32 py-4 rounded-full bg-zinc-900/80 backdrop-blur-md text-white font-medium border border-zinc-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all outline-none"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-lime-400 text-black px-6 py-2.5 rounded-full font-black text-sm hover:bg-lime-300 transition-colors uppercase tracking-widest">
              Find
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        
        {/* VALUE PROPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, text: "100% Verified Sellers" },
            { icon: Tag, text: "Cheapest Escrow Options" },
            { icon: Zap, text: "Instant Ticket Delivery" }
          ].map((item, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 flex items-center justify-center gap-3 hover:border-lime-500/50 transition-colors cursor-default">
              <item.icon className="w-5 h-5 text-lime-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 🚀 DYNAMIC LIVE CHARTS (Trending & Top Artists) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-zinc-900 pb-16">
          
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-lime-400/10 rounded-full flex items-center justify-center border border-lime-400/20">
                <TrendingUp className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Trending Now</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Live in {activeCategory !== 'All' ? 'Global' : currentCity}</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading && dynamicTrending.length === 0 ? (
                <motion.div key="skeleton-trend" className="flex overflow-x-auto gap-5 pb-8 pt-2 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="flex-shrink-0 w-56 h-72 rounded-3xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key={`trending-${currentCity}-${activeCategory}`} 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="flex overflow-x-auto gap-5 pb-8 pt-2 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {dynamicTrending.map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => { setSearchInput(item.name); setActiveKeyword(item.name); setActiveCategory('All'); }} 
                      className="flex-shrink-0 group text-left w-56 relative outline-none"
                    >
                      <div className="h-72 rounded-3xl overflow-hidden relative border border-zinc-800 bg-zinc-900 shadow-xl group-hover:border-lime-400/50 group-hover:shadow-[0_0_30px_rgba(57,255,20,0.15)] transition-all duration-500">
                        <img src={item.image || ''} alt={item.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-700 ease-out grayscale-[30%] group-hover:grayscale-0" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        
                        <div className="absolute bottom-6 left-6 right-6">
                          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                            {item.category}
                          </span>
                          <p className="font-black text-white text-2xl uppercase tracking-tighter leading-tight group-hover:text-lime-400 transition-colors drop-shadow-lg line-clamp-2">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-lime-400/10 rounded-full flex items-center justify-center border border-lime-400/20">
                <Star className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Top Artists</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Most Searched</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading && dynamicArtists.length === 0 ? (
                <motion.div key="skeleton-artists" className="flex overflow-x-auto gap-6 pb-8 pt-4 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="flex-shrink-0 flex flex-col items-center w-28">
                      <div className="w-24 h-24 rounded-full bg-zinc-900/50 border border-zinc-800 animate-pulse mb-4" />
                      <div className="h-3 w-16 bg-zinc-900/50 rounded animate-pulse" />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key={`artists-${currentCity}-${activeCategory}`}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex overflow-x-auto gap-6 pb-8 pt-4 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {dynamicArtists.map((artist) => (
                    <button 
                      key={artist.rank} 
                      onClick={() => { setSearchInput(artist.name); setActiveKeyword(artist.name); setActiveCategory('All'); }} 
                      className="flex-shrink-0 group relative flex flex-col items-center w-28 outline-none"
                    >
                      <div className="absolute -top-6 text-7xl font-black italic text-zinc-800/50 group-hover:text-lime-400/20 transition-colors z-0 select-none pointer-events-none">
                        {artist.rank}
                      </div>
                      
                      <div className={`w-24 h-24 rounded-full overflow-hidden relative z-10 mb-4 transition-all duration-500 ${artist.rank === 1 ? 'border-2 border-lime-400 shadow-[0_0_20px_rgba(57,255,20,0.3)] ring-4 ring-lime-400/10' : 'border-2 border-zinc-800 group-hover:border-lime-500/50'}`}>
                        <img src={artist.image || ''} alt={artist.name} className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" />
                      </div>
                      
                      <p className="font-black text-white text-sm uppercase tracking-tight group-hover:text-lime-400 transition-colors text-center w-full truncate relative z-10">
                        {artist.name}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MAIN FILTER TABS */}
        <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl py-4 border-b border-zinc-900 mb-8">
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CATEGORIES.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id} onClick={() => setActiveCategory(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${activeCategory === tab.id ? 'border-lime-400 text-black' : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
                >
                  {activeCategory === tab.id && (
                    <motion.div layoutId="cat-bg" className="absolute inset-0 bg-lime-400 rounded-full" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 uppercase tracking-widest text-xs">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2 pt-2 items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button 
              onClick={() => setActiveDate('Any')}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-all ${activeDate === 'Any' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:bg-zinc-900'}`}
            >
              <span className="text-xs font-bold uppercase">All</span>
              <span className="text-lg font-black leading-none mt-1">Dates</span>
            </button>
            <div className="w-px h-8 bg-zinc-800 mx-2" />
            
            {upcomingDates.map((dateObj) => (
              <button
                key={dateObj.id} 
                onClick={() => setActiveDate(dateObj.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-all ${activeDate === dateObj.id ? 'bg-lime-400 border-lime-400 text-black shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
               >
                <span className="text-[10px] font-black uppercase tracking-widest">{dateObj.dayOfWeek}</span>
                <span className="text-xl font-black leading-none mt-1">{dateObj.dayOfMonth}</span>
              </button>
            ))}
          </div>
        </div>

        {/* EVENT FEED */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              {activeKeyword ? `Results for "${activeKeyword}"` : `${activeCategory === 'All' ? 'Upcoming' : activeCategory} Events`}
              
              {isStreaming && !loading && (
                <span className="bg-lime-500/10 border border-lime-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                  <Radar className="w-3.5 h-3.5 text-lime-400 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">Syncing More...</span>
                </span>
              )}
            </h2>
            
            {!loading && (
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                {isStreaming ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" /> Finding verified tickets</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-lime-400" /> {filteredEvents.length} Verified</>
                )}
              </span>
            )}
          </div>

          {loading && filteredEvents.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-[380px] bg-zinc-900/40 border border-zinc-800/50 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 && !isStreaming ? (
            <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center justify-center">
              <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white uppercase mb-2">No Matches Found</h3>
              <p className="text-zinc-500 font-medium text-sm">Try adjusting your dates or searching a different keyword.</p>
            </div>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredEvents.slice(0, visibleLimit).map((event, index) => {
                    const availableTickets = event.listings?.length || 0;
                    
                    // 🚀 PRICING FIX: Accurate Base Price / Fallback to original TM value instead of hallucination
                    let lowestPrice = 0;
                    if (availableTickets > 0) {
                      lowestPrice = Math.min(...event.listings.map(l => l.price));
                    } else if (event.minPrice && event.minPrice > 0) {
                      lowestPrice = event.minPrice; 
                    }

                    return (
                      <motion.div
                        layout initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                        key={`${event.id}-${index}`} 
                        className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-lime-500/50 transition-all flex flex-col cursor-pointer shadow-xl"
                      >
                        <div className="h-48 bg-zinc-950 overflow-hidden relative">
                          <img src={event.imageUrl || ''} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-700 ease-in-out opacity-90 grayscale-[20%]" />
                          <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-zinc-800">
                            <div className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                            <div className="text-xl font-black leading-none text-white">{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric' })}</div>
                          </div>
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="font-black text-xl text-white mb-2 line-clamp-2 leading-tight group-hover:text-lime-400 transition-colors uppercase tracking-tight">{event.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-widest mb-6">
                            <MapPin className="w-3.5 h-3.5 text-lime-500/50" /> {event.city}
                          </div>
                          
                          <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-end justify-between">
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">
                                {availableTickets > 0 ? 'Starting at' : 'Original Price'}
                              </p>
                              <p className="font-black text-2xl text-white tracking-tighter">
                                {lowestPrice > 0 ? formatPrice(lowestPrice) : 'TBD'}
                              </p>
                            </div>
                            <Link href={`/event/${event.id}`} className={`px-5 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${availableTickets > 0 ? 'bg-white text-black hover:bg-lime-400 shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
                              {availableTickets > 0 ? `Get Tickets` : 'Sold Out'}
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* 🚀 PAGINATION CONTROLS (Appears if page > 1 or total event pool hits query thresholds) */}
              {(filteredEvents.length >= 45 || currentPage > 1) && (
                <div className="flex items-center justify-center gap-4 pt-12 border-t border-zinc-900 mt-12">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isStreaming}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold uppercase tracking-wider text-white hover:border-lime-400/50 disabled:opacity-40 disabled:hover:border-zinc-800 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                    Page <span className="text-lime-400">{currentPage}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={filteredEvents.length < 30 || isStreaming}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold uppercase tracking-wider text-white hover:border-lime-400/50 disabled:opacity-40 disabled:hover:border-zinc-800 transition-all"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Custom CSS Animation for Marquee & Fonts */}
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
          .font-heavy {
            font-family: 'Archivo Black', sans-serif;
            text-transform: uppercase;
          }

          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 25s linear infinite;
          }
          .animate-marquee-slow {
            animation: marquee 35s linear infinite reverse;
          }

          .text-glow {
            color: #ffffff;
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.5);
          }
          .text-dim {
            color: rgba(255, 255, 255, 0.4);
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
          }
        `}} />

        {/* 🚀 THE TIXRESALE ADVANTAGE (Cards Section) */}
        <div className="relative py-24 md:py-32 border border-zinc-800 bg-zinc-950 overflow-hidden mt-24 rounded-[3rem] shadow-2xl">
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                The <span className="text-lime-400">Tixresale</span> Advantage
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Secure Escrow */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-lime-500/50 transition-all duration-300 group shadow-lg hover:shadow-[0_0_40px_rgba(57,255,20,0.15)]">
                <div className="w-14 h-14 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-8 border border-lime-400/20 text-lime-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                  <Percent className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-5">Secure Escrow</h3>
                <div className="bg-black/60 rounded-xl p-4 mb-5 border border-zinc-800 font-mono text-xs flex justify-between items-center text-zinc-400">
                  <span>GLOBAL VAT RATE (%)</span>
                  <span className="text-lime-400 font-black text-lg">12.4</span>
                </div>
                <p className="text-zinc-400 font-medium leading-relaxed">
                  Your funds are held safely within our platform until the event is successfully confirmed. This guarantees peace of mind for both buyers and sellers, preventing fraud.
                </p>
              </div>

              {/* Card 2: Instant Payouts */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-lime-500/50 transition-all duration-300 group shadow-lg hover:shadow-[0_0_40px_rgba(57,255,20,0.15)]">
                <div className="w-14 h-14 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-8 border border-lime-400/20 text-lime-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-5">Instant Payouts</h3>
                <div className="bg-black/60 rounded-xl p-4 mb-5 border border-zinc-800 font-mono text-xs flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-lime-400"/> GATEWAY</span>
                  <span className="w-10 h-5 bg-lime-400 rounded-full relative"><span className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full"></span></span>
                </div>
                <p className="text-zinc-400 font-medium leading-relaxed">
                  Receive your funds fast, straight to your linked account. Our optimized gateway ensures that as soon as the event is verified, your payment is processed without delay.
                </p>
              </div>

              {/* Card 3: Verified Tickets */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-lime-500/50 transition-all duration-300 group shadow-lg hover:shadow-[0_0_40px_rgba(57,255,20,0.15)]">
                <div className="w-14 h-14 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-8 border border-lime-400/20 text-lime-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-5">Verified Tickets</h3>
                <div className="bg-black/60 rounded-xl p-4 mb-5 border border-zinc-800 font-mono text-xs flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-2"><Radar className="w-4 h-4 text-lime-400"/> ALGORITHM</span>
                  <span className="text-lime-400 font-black flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> ACTIVE</span>
                </div>
                <p className="text-zinc-400 font-medium leading-relaxed">
                  Platform-verified ticket authenticity for peace of mind. We use state-of-the-art verification to guarantee every ticket is authentic, locking out scammers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 WALL OF TEXT MARQUEE (Separated Section) */}
        <div className="relative border border-zinc-800 bg-black overflow-hidden mt-8 rounded-[3rem] shadow-2xl py-12">
          <div className="flex flex-col justify-center pointer-events-none select-none overflow-hidden bg-black">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="whitespace-nowrap flex text-[3rem] md:text-[5rem] font-heavy leading-[0.85] tracking-tight">
                <span className={`${i % 2 === 0 ? "animate-marquee text-glow" : "animate-marquee-slow text-dim"}`}>
                  TIX RESALE TIX RESALE TIX RESALE TIX RESALE TIX RESALE TIX RESALE TIX RESALE TIX RESALE
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 🚀 HOW TIXRESALE WORKS (4 Steps) */}
        <div className="pt-16 pb-8 border-t border-zinc-900 mt-8">
          <div className="text-center mb-12">
            <h2 className="text-sm font-black text-lime-400 uppercase tracking-[0.2em] mb-3">Escrow in 4 Steps</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">How Tixresale Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", icon: SearchCheck, title: "Search & Pick", desc: "Find your favorite event and select tickets from algorithmically verified sellers." },
              { num: "02", icon: Mail, title: "Sign Up & Details", desc: "Create a secure account and provide the email address to receive your tickets." },
              { num: "03", icon: ShieldCheck, title: "Pay via Escrow", desc: "Pay with Instant Card or Manual Transfer. Your funds are locked safely in Escrow." },
              { num: "04", icon: Ticket, title: "Verify & Receive", desc: "Once verified by our agents, the digital barcode is instantly sent to your email." }
            ].map((step, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group hover:border-lime-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-6 text-6xl font-black text-zinc-800 opacity-30 pointer-events-none transition-transform group-hover:scale-110 duration-500">{step.num}</div>
                <div className="w-12 h-12 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-6 border border-lime-400/20 text-lime-400 relative z-10">
                  <step.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight mb-3 relative z-10">{step.title}</h4>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed relative z-10">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FINAL ESCROW CTA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800">
                <ShieldCheck className="w-4 h-4 text-lime-400" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-300">End-to-End Escrow</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">
                We ensure you are <br/><span className="text-lime-400">safe from end to end.</span>
              </h2>
              <p className="text-zinc-400 font-medium leading-relaxed max-w-md">
                Every ticket is verified. Funds are held in our secure escrow until you scan the barcode at the gate. No scammers, no fake tickets. Just pure experiences.
              </p>
            </div>

            <div className="relative h-80 flex items-center justify-center perspective-[1000px]">
              <motion.div animate={{ rotateY: rotation }} transition={{ duration: 1.2, ease: "backInOut" }} className="relative w-48 h-64 preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
                {[0, 90, 180, 270].map((deg, index) => (
                  <div key={deg} className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden" style={{ transform: `rotateY(${deg}deg) translateZ(140px)`, WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}>
                    {index === 0 && <><ShieldCheck className="w-12 h-12 text-lime-400 mb-4"/><p className="font-black text-white uppercase tracking-widest text-sm">Verified</p></>}
                    {index === 1 && <><Zap className="w-12 h-12 text-lime-400 mb-4"/><p className="font-black text-white uppercase tracking-widest text-sm">Instant</p></>}
                    {index === 2 && <><Tag className="w-12 h-12 text-lime-400 mb-4"/><p className="font-black text-white uppercase tracking-widest text-sm">Secured</p></>}
                    {index === 3 && <><MapPin className="w-12 h-12 text-lime-400 mb-4"/><p className="font-black text-white uppercase tracking-widest text-sm">Local</p></>}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen bg-zinc-950" />}>
      <HomeContent />
    </Suspense>
  );
}￼Enterking-widest mb-6">
                            <MapPin className="w-3.5 h-3.5 text-lime-500/50" /> {event.city}
                          </div>
                          
                          <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-end justify-between">
                            <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">
                                {availableTickets > 0 ? 'Starting at' : 'Original Price'}
                              </p>
                              <p className="font-black text-2xl text-white tracking-tighter">
                                {lowestPrice > 0 ? formatPrice(lowestPrice) : 'TBD'}
                              </p>
                            </div>
                            <Link href={`/event/${event.id}`} className={`px-5 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${availableTickets > 0 ? 'bg-white text-black hover:bg-lime-400 shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
                              {availableTickets > 0 ? `Get Tickets` : 'Sold Out'}
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* 🚀 PAGINATION CONTROLS (Appears if page > 1 or total event pool hits query thresholds) */}
              {(filteredEvents.length >= 45 || currentPage > 1) && (
                <div className="flex items-center justify-center gap-4 pt-12 border-t border-zinc-900 mt-12">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isStreaming}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold uppercase tracking-wider text-white hover:border-lime-400/50 disabled:opacity-40 disabled:hover:border-zinc-800 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                    Page <span className="text-lime-400">{currentPage}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={filteredEvents.length < 30 || isStreaming}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold uppercase tracking-wider text-white hover:border-lime-400/50 disabled:opacity-40 disabled:hover:border-zinc-800 transition-all"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Custom CSS Animation for Marquee & Fonts */}
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
          .font-heavy {
            font-family: 'Archivo Black', sans-serif;
            text-transform: uppercase;
          }

          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 25s linear infinite;
          }
          .animate-marquee-slow {
            animation: marquee 35s linear infinite reverse;
          }

          .text-glow {
            color: #ffffff;
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.5);
          }
          .text-dim {
            color: rgba(255, 255, 255, 0.4);
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
          }
        `}} />

        {/* 🚀 THE TIXRESALE ADVANTAGE (Cards Section) */}
        <div className="relative py-24 md:py-32 border border-zinc-800 bg-zinc-950 overflow-hidden mt-24 rounded-[3rem] shadow-2xl">
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                The <span className="text-lime-400">Tixresale</span> Advantage
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Secure Escrow */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-lime-500/50 transition-all duration-300 group shadow-lg hover:shadow-[0_0_40px_rgba(57,255,20,0.15)]">
                <div className="w-14 h-14 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-8 border border-lime-400/20 text-lime-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                  <Percent className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-5">Secure Escrow</h3>
                <div className="bg-black/60 rounded-xl p-4 mb-5 border border-zinc-800 font-mono text-xs flex justify-between items-center text-zinc-400">
                  <span>GLOBAL VAT RATE (%)</span>
                  <span className="text-lime-400 font-black text-lg">12.4</span>
                </div>
                <p className="text-zinc-400 font-medium leading-relaxed">
                  Your funds are held safely within our platform until the event is successfully confirmed. This guarantees peace of mind for both buyers and sellers, preventing fraud.
                </p>
              </div>

              {/* Card 2: Instant Payouts */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-lime-500/50 transition-all duration-300 group shadow-lg hover:shadow-[0_0_40px_rgba(57,255,20,0.15)]">
                <div className="w-14 h-14 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-8 border border-lime-400/20 text-lime-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-5">Instant Payouts</h3>
                <div className="bg-black/60 rounded-xl p-4 mb-5 border border-zinc-800 font-mono text-xs flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-lime-400"/> GATEWAY</span>
                  <span className="w-10 h-5 bg-lime-400 rounded-full relative"><span className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full"></span></span>
