"use client";
import React, { useState } from 'react';

export default function AboutPage() {
  const [ctaState, setCtaState] = useState<'idle' | 'clicked'>('idle');

  const handleCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtaState('clicked');
    setTimeout(() => setCtaState('idle'), 3000);
  };

  return (
    <div className="w-full bg-black font-sans text-zinc-100 overflow-hidden selection:bg-lime-400 selection:text-black">
      
      {/* Top Warning Banner */}
      <div className="bg-lime-400 py-3 text-center text-xs md:text-sm text-black font-black uppercase tracking-widest border-b border-lime-500 shadow-[0_0_15px_rgba(163,230,53,0.2)]">
        Tixresale is a leading global ticket marketplace. This is a resale service. Not an original ticket seller.
      </div>

      <main className="w-full pb-20 relative">
        
        {/* Background Glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-lime-400/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

        {/* 1. Hero Section */}
        <section className="relative z-10 max-w-[800px] mx-auto px-4 sm:px-6 pt-24 pb-16 text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-lime-600 drop-shadow-[0_0_20px_rgba(163,230,53,0.3)] cursor-default">
              No More
            </span>{' '}
            Missing Out.
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-3xl mx-auto font-medium">
            We’re on a mission to get more fans to events they love while driving the industry to be fair, accessible, and transparent. We’ve built a dark-mode optimized marketplace that helps fans get to their favourite shows without paying through the nose.
          </p>
        </section>

        {/* 2. Top Tilted Image Placeholder */}
        <section className="max-w-[1000px] mx-auto px-4 sm:px-6 relative z-10 pb-20">
          <div className="w-full aspect-[21/9] md:aspect-[2.5/1] bg-zinc-900 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-1 hover:rotate-0 hover:shadow-[0_0_30px_rgba(163,230,53,0.15)] transition-all duration-500 overflow-hidden border-2 border-zinc-800 hover:border-lime-400/50 flex items-center justify-center cursor-pointer group">
            
            {/* Abstract Dark Tech Grid Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0"></div>
            
            <span className="relative z-10 text-lime-400/50 font-black text-2xl tracking-[0.2em] uppercase group-hover:scale-110 group-hover:text-lime-400 transition-all duration-500 drop-shadow-[0_0_10px_rgba(163,230,53,0)] group-hover:drop-shadow-[0_0_15px_rgba(163,230,53,0.6)]">
              Interactive Crowd Feed
            </span>
          </div>
        </section>

        {/* 3. Dark Slanted Section */}
        <section className="relative mt-16 py-32 md:py-48 border-t border-b border-zinc-900/50">
          {/* Slanted Background Element */}
          <div className="absolute inset-0 bg-zinc-950 transform -skew-y-3 origin-top-left z-0 overflow-hidden">
             {/* Subtle internal gradient */}
             <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-lime-400/5 to-transparent blur-[100px]"></div>
          </div>
          
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-20">
            
            {/* Left: Tilted Image */}
            <div className="w-full md:w-1/2 flex justify-center perspective-[1000px]">
               <div className="w-full max-w-[450px] aspect-[4/3] bg-black rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 hover:shadow-[0_0_30px_rgba(163,230,53,0.2)] transition-all duration-700 overflow-hidden border border-zinc-800 flex items-center justify-center relative group">
                 <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black opacity-50 group-hover:opacity-30 transition-opacity"></div>
                 <span className="relative text-zinc-600 font-black text-lg tracking-widest uppercase text-center px-4 group-hover:text-lime-400 transition-colors duration-500">
                   Stage Blueprint
                 </span>
               </div>
            </div>

            {/* Right: Text Content */}
            <div className="w-full md:w-1/2 text-white">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
                <span className="text-lime-400 drop-shadow-[0_0_15px_rgba(163,230,53,0.4)]">
                  Fueling
                </span>{' '}
                artists & the live ecosystem
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed mb-10 font-medium">
                Tixresale keeps good company, partnering directly with some of the greatest events and artists across the globe. From celebrated artists like Rüfüs Du Sol to world-class festivals like Beyond the Valley (AUS) and Boardmasters (UK), we provide a secure, hyper-fast infrastructure for verifying resale tickets.
              </p>
              
              {/* Interactive CTA */}
              <button 
                onClick={handleCtaClick}
                className="inline-flex items-center text-black bg-lime-400 px-8 py-4 rounded-lg font-black tracking-wide text-sm md:text-base hover:bg-lime-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(163,230,53,0.5)] transition-all duration-300 focus:outline-none group"
              >
                {ctaState === 'idle' ? (
                  <>
                    CONNECT YOUR EVENT
                    <svg className="w-5 h-5 ml-3 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </>
                ) : (
                  <span className="flex items-center text-black">
                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    INITIALIZING...
                  </span>
                )}
              </button>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}