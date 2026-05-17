import React from 'react';

export default function ArtistTourPage() {
  // ---------------------------------------------------------
  // MOCK ARTIST PAYLOAD: 
  // Schema for an individual artist's international tour dates.
  // ---------------------------------------------------------
  const mockArtistPayload = {
    id: "harry-styles",
    name: "Harry Styles",
    title: "Harry Styles international tour dates",
    // In production, this would be an actual URL to the artist's promo image
    imagePlaceholder: "bg-gradient-to-r from-yellow-100 via-white to-teal-100", 
    tourDates: [
      { id: "tour_01", month: "MAY", day: "16", city: "Amsterdam", venue: "Johan Cruijff Arena", minPrice: "€90" },
      { id: "tour_02", month: "MAY", day: "17", city: "Amsterdam", venue: "Johan Cruijff Arena", minPrice: "€96" },
      { id: "tour_03", month: "MAY", day: "20", city: "Amsterdam", venue: "Johan Cruijff Arena", minPrice: "€151.2" },
      { id: "tour_04", month: "MAY", day: "22", city: "Amsterdam", venue: "Johan Cruijff Arena", minPrice: "€96.49" },
      { id: "tour_05", month: "MAY", day: "23", city: "Amsterdam", venue: "Johan Cruijff Arena", minPrice: "€152" }
    ]
  };

  return (
    <div className="w-full bg-white font-sans text-gray-900">
      
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Massive Artist Image */}
          <div className="w-full lg:w-[45%] flex-shrink-0 sticky top-24">
            {/* The aspect ratio matches the tall portrait style in the screenshot */}
            <div className={`w-full aspect-[4/5] rounded-3xl ${mockArtistPayload.imagePlaceholder} shadow-sm border border-gray-100 relative overflow-hidden flex items-center justify-center`}>
               {/* Stand-in for the actual image */}
               <span className="text-gray-400 font-bold text-xl">Artist Image Placeholder</span>
            </div>
          </div>

          {/* Right Column: Tour Dates */}
          <div className="w-full lg:w-[55%] flex flex-col">
            
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-8">
              {mockArtistPayload.title}
            </h1>

            <div className="flex flex-col">
              {mockArtistPayload.tourDates.map((date) => (
                <div key={date.id} className="flex items-center justify-between py-5 border-b border-gray-100 group cursor-pointer hover:bg-gray-50 -mx-4 px-4 transition rounded-lg">
                  
                  <div className="flex items-center">
                    {/* Minimalist Date Badge */}
                    <div className="flex flex-col items-center justify-center border border-gray-200 rounded-[14px] w-[52px] h-[60px] mr-5 bg-white flex-shrink-0 group-hover:border-gray-300 transition">
                      <span className="text-[#ff4e00] text-[10px] font-black uppercase tracking-widest">{date.month}</span>
                      <span className="text-lg font-black text-gray-900 leading-none mt-0.5">{date.day}</span>
                    </div>
                    
                    {/* Location Info */}
                    <div className="flex flex-col">
                      <div className="flex items-center font-bold text-gray-900 text-[15px]">
                        <span className="group-hover:underline">{date.city}</span>
                        <span className="mx-2 text-gray-400 font-normal">•</span>
                        <span className="font-medium">{date.venue}</span>
                      </div>
                      <p className="text-gray-500 text-[15px] mt-0.5">{mockArtistPayload.name}</p>
                    </div>
                  </div>

                  {/* Price CTA */}
                  <div className="flex items-center flex-shrink-0 ml-4">
                    <span className="font-bold text-gray-900 text-[15px] mr-4 hidden sm:block">Tickets from {date.minPrice}</span>
                    <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-gray-900 group-hover:text-gray-900 transition bg-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>

                </div>
              ))}
            </div>
            
            {/* Can't attend banner (Optional based on screenshot context, but standard for these pages) */}
            <div className="mt-12 bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between border border-gray-100">
               <span className="font-bold text-gray-900 mb-4 sm:mb-0">Got spare tickets?</span>
               <button className="bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition text-sm">
                  Sell them here
               </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}