import React from 'react';

export default function FestivalUmbrellaPage() {
  // ---------------------------------------------------------
  // MOCK FESTIVAL PAYLOAD: 
  // This schema handles "Parent" events that contain multiple 
  // dates/locations. Perfect for mapping to a relational DB.
  // ---------------------------------------------------------
  const mockFestivalPayload = {
    id: "dangerous-goods-xxl",
    title: "Dangerous Goods XXL Festival tickets",
    image: "bg-purple-900", // Placeholder for the circular festival graphic
    trustBadges: ["Fraud Prevention", "Capped Prices", "Buyer Guarantee"],
    subEvents: [
      { id: "evt_bne", month: "JUNE", day: "19", city: "Brisbane", venue: "Superordinary", minPrice: 54.99 },
      { id: "evt_per", month: "JUNE", day: "20", city: "Perth", venue: "The Ice Cream Factory", minPrice: 120.00 },
      { id: "evt_syd", month: "JUNE", day: "26", city: "Sydney", venue: "Dangerous Goods XXL Festival | Sydney @ Home The Venue", minPrice: 70.00 },
      { id: "evt_mel", month: "JUNE", day: "27", city: "Melbourne", venue: "Dangerous Goods XXL Festival | Melbourne @ Melbourne Showgrounds", minPrice: 71.49 }
    ],
    lineup: [
      { name: "Alex Farell", eventsCount: 3, imageColor: "bg-blue-600" },
      { name: "Blazy", eventsCount: 2, imageColor: "bg-gray-800" },
      { name: "KX CHR", eventsCount: 3, imageColor: "bg-stone-300" },
      { name: "Nik Kastel", eventsCount: 4, imageColor: "bg-gray-500" },
      { name: "SIKOTI (UK)", eventsCount: 3, imageColor: "bg-teal-800" },
      { name: "SLVL", eventsCount: 2, imageColor: "bg-slate-700" },
      { name: "SLVL", eventsCount: 2, imageColor: "bg-slate-800" }
    ],
    tags: ["Australia", "Perth", "Music", "Electronic"],
    faqs: [
      {
        question: "How do I sell Dangerous Goods XXL Festival | Perth tickets?",
        answer: "Selling ticket to Dangerous Goods XXL Festival | Perth on Salex is safe and easy. Sell your ticket here. If you are selling your ticket privately, you can choose to create a private listing before finalising your listing."
      },
      {
        question: "Is buying Dangerous Goods XXL Festival | Perth tickets on Salex safe?",
        answer: "Salex is the safest and easiest place to buy tickets online. The latest anti-fraud tech means you are always protected from scammers and scalpers/touts. Only real tickets for real fans."
      },
      {
        question: "What are the costs of using Salex?",
        answer: "The fees for selling or buying a ticket varies by event and event organiser but we will always outline what you will be charged before you confirm your listing or ticket purchase."
      }
    ]
  };

  return (
    <div className="w-full font-sans text-gray-900 bg-white">
      
      {/* 1. Hero Section (Festival Variant) */}
      <section className="bg-[#181818] text-white pt-12 pb-16">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Circular Festival Poster */}
          <div className={`w-40 h-40 md:w-48 md:h-48 rounded-full ${mockFestivalPayload.image} flex-shrink-0 shadow-2xl border-4 border-gray-800 overflow-hidden relative`}>
             <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-black/40">
                <span className="font-black text-xl italic leading-tight">DANGEROUS GOODS XXL</span>
             </div>
          </div>
          
          {/* Title */}
          <div className="flex flex-col justify-center h-full pt-6 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight md:max-w-xl">
              {mockFestivalPayload.title}
            </h1>
          </div>
        </div>
      </section>

      {/* 2. Trust Badges */}
      <div className="border-b border-gray-100 bg-white shadow-sm relative z-10">
        <div className="max-w-[1000px] mx-auto px-4 py-5 flex justify-between items-center overflow-x-auto text-sm font-semibold text-gray-700">
          {mockFestivalPayload.trustBadges.map((badge, idx) => (
            <div key={idx} className="flex items-center whitespace-nowrap px-4">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span className="underline hover:no-underline cursor-pointer">{badge}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-12">
        
        {/* 3. Sub-Events / Tour Dates List */}
        <div className="mb-16">
          <h2 className="text-2xl font-black mb-6">{mockFestivalPayload.title}</h2>
          
          <div className="flex flex-col">
            {mockFestivalPayload.subEvents.map((event) => (
              <div key={event.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 border-b border-gray-200 group cursor-pointer hover:bg-gray-50 -mx-4 px-4 transition">
                
                <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
                  {/* Date Block */}
                  <div className="flex flex-col items-center justify-center border border-gray-200 rounded-lg w-14 h-16 mr-6 bg-white flex-shrink-0">
                    <span className="text-[#ff4e00] text-[10px] font-black uppercase tracking-wider">{event.month}</span>
                    <span className="text-lg font-black text-gray-900">{event.day}</span>
                  </div>
                  
                  {/* Location Info */}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:underline">{event.city}</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{event.venue}</p>
                  </div>
                </div>

                {/* Price CTA */}
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <span className="font-bold text-gray-900 mr-4">Tickets from ${event.minPrice.toFixed(2)}</span>
                  <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 group-hover:border-gray-900 group-hover:text-gray-900 transition bg-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* 4. "Can't attend?" CTA Banner */}
        <div className="bg-gray-50 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between mb-16 border border-gray-100">
          <h3 className="text-xl font-bold mb-4 sm:mb-0 text-gray-900">Can't attend the event?</h3>
          <button className="bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition w-full sm:w-auto text-center shadow-md">
            Sell your tickets
          </button>
        </div>

        {/* 5. Line-up Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-black mb-8">The line-up for {mockFestivalPayload.title.replace(' tickets', '')}</h2>
          
          <div className="relative">
            <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
              {mockFestivalPayload.lineup.map((artist, i) => (
                <div key={i} className="flex flex-col items-center text-center cursor-pointer group min-w-[120px]">
                  <div className={`w-32 h-32 rounded-full ${artist.imageColor} mb-4 border-2 border-transparent group-hover:border-orange-500 transition shadow-sm`}></div>
                  <h4 className="font-medium text-gray-900 group-hover:underline">{artist.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{artist.eventsCount} upcoming events</p>
                </div>
              ))}
            </div>
            {/* Overlay Gradient & Arrow for scrolling indication */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-full bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end pr-2 pb-6">
               <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm pointer-events-auto hover:bg-gray-50">
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
               </button>
            </div>
          </div>
        </div>

        {/* 6. Tags Section */}
        <div className="mb-16 border-t border-gray-100 pt-16">
          <h2 className="text-2xl font-black mb-6">Tags</h2>
          <div className="flex flex-wrap gap-3">
            {mockFestivalPayload.tags.map((tag, i) => (
              <span key={i} className="bg-gray-100 hover:bg-gray-200 cursor-pointer transition text-gray-800 font-medium px-5 py-2.5 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 7. FAQs Section */}
        <div className="mb-16 border-t border-gray-100 pt-16">
          <h2 className="text-2xl font-black mb-10">Frequently asked questions</h2>
          
          <div className="space-y-10">
            {mockFestivalPayload.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {/* Simple text rendering; in production you might use dangerouslySetInnerHTML if your CMS outputs rich text with links */}
                  {faq.answer.includes("Sell your ticket here") ? (
                    <>
                      Selling ticket to Dangerous Goods XXL Festival | Perth on Salex is safe and easy. <a href="#" className="text-[#ff4e00] hover:underline">Sell your ticket here</a>. If you are selling your ticket privately, you can choose to create a private listing before finalising your listing.
                    </>
                  ) : (
                    faq.answer
                  )}
                </p>
                {i < mockFestivalPayload.faqs.length - 1 && <div className="w-full h-px bg-gray-100 mt-10"></div>}
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}