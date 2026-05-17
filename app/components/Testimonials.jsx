import React from 'react';

export default function Testimonials() {
  const reviews = [
    { title: "Easy and quick.", body: "Easy and quick.", author: "Pip", time: "4 hours ago" },
    { title: "I definately recommend...", body: "I definately recommend Salex for anyone wanting to sell o...", author: "Dougie", time: "5 hours ago" },
    { title: "Salex Tickets: Affordabe...", body: "The tickets offered were affordable, thanks to Salex's...", author: "Jordan Sterling", time: "5 hours ago" },
    { title: "Cheap tickets and no h...", body: "Cheap tickets and no hassles at all!", author: "Nicole Del Mas...", time: "22 hours ago" }
  ];

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <h2 className="text-3xl font-black tracking-tight mb-10">Why fans love Salex</h2>

        <div className="relative flex items-center justify-center mb-6">
          {/* Left Arrow */}
          <button className="absolute left-0 z-10 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 hover:text-gray-600 shadow-sm -ml-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full px-6">
            {reviews.map((review, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 text-left flex flex-col h-full border border-transparent hover:border-gray-200 transition">
                {/* Stars & Verified */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex space-x-1">
                    {[1,2,3,4,5].map(star => (
                      <div key={star} className="w-5 h-5 bg-[#00b67a] text-white flex items-center justify-center rounded-sm">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 font-semibold">
                    <svg className="w-3 h-3 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    Verified
                  </div>
                </div>
                
                {/* Text */}
                <h4 className="font-bold text-gray-900 mb-2 leading-snug">{review.title}</h4>
                <p className="text-sm text-gray-600 flex-grow mb-6">{review.body}</p>
                
                {/* Author */}
                <div className="text-sm">
                  <span className="font-bold text-gray-900">{review.author}</span>
                  <span className="text-gray-500">, {review.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button className="absolute right-0 z-10 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 shadow-sm -mr-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>

        {/* Trustpilot Footer */}
        <div className="text-sm text-gray-600 mt-4 flex flex-col items-center">
          <p>Rated <span className="font-bold text-gray-900">4.7</span> / 5 based on <a href="#" className="underline hover:text-gray-900">5,630 reviews</a>. Showing our 5 star reviews.</p>
          <div className="flex items-center mt-1 font-bold text-gray-900 text-lg">
            <svg className="w-6 h-6 text-[#00b67a] fill-current mr-1" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
            Trustpilot
          </div>
        </div>

      </div>
    </section>
  );
}