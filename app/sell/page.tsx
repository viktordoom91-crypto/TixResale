import React from 'react';

export default function SellPage() {
  // ---------------------------------------------------------
  // MOCK SELL PAGE PAYLOAD
  // ---------------------------------------------------------
  const mockSellData = {
    liveActivity: [
      { id: 1, user: "Alexander B.", action: "sold tickets", initials: "A", bgColor: "bg-[#b89528]" },
      { id: 2, user: "Ngoc N.", action: "sold tickets", initials: "N", bgColor: "bg-[#1b4324]" },
      { id: 3, user: "Grace G.", action: "joined the waitlist", initials: "GG", bgColor: "bg-blue-600", image: true },
      { id: 4, user: "Arianna I.", action: "joined the waitlist", initials: "AI", bgColor: "bg-[#59a888]" }
    ],
    platforms: ["ticketmaster", "See TICKETS", "eventbrite", "TICKETEK", "HUMANITIX"],
    reviews: [
      { id: 1, name: "Stacey", initial: "S", title: "Beyond impressed, Salex you are the...", body: "Before this survey came through, I was genuinely thinking I needed to send a review to express how impressed I wa..." },
      { id: 2, name: "Casey O", initial: "CO", title: "Safe Secure and Satisfied!", body: "The process was simple and smooth. Customer service was also excellent with helping me get the ticket in time fo..." },
      { id: 3, name: "Scott", initial: "S", title: "Excellent customer service", body: "Excellent customer service, very easy to get in contact with if you have any issues." }
    ],
    faqs: [
      "What Is Salex?",
      "Can I sell my tickets?",
      "Is it safe to sell my ticket on Salex?"
    ]
  };

  return (
    <div className="w-full bg-white font-sans text-gray-900">
      <main className="w-full pb-20">
        
        {/* 1. Hero Section */}
        <section className="max-w-[800px] mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 uppercase">
            Turn spare tickets into cash
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 font-medium">
            Reach millions of fans on Salex
          </p>
          <button className="bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold text-lg px-12 py-4 rounded-full hover:opacity-90 transition shadow-lg inline-block">
            Sell your tickets
          </button>
        </section>

        {/* 2. Live Activity Carousel */}
        <section className="w-full overflow-hidden mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse mr-2"></div>
            <h2 className="text-xl font-bold">Live activity</h2>
          </div>
          
          <div className="relative max-w-[1200px] mx-auto">
            {/* Horizontal Scroll Container */}
            <div className="flex space-x-6 overflow-x-auto pb-8 px-4 sm:px-6 scrollbar-hide snap-x">
              {mockSellData.liveActivity.map((activity) => (
                <div key={activity.id} className={`min-w-[300px] md:min-w-[400px] h-[200px] rounded-2xl p-6 ${activity.bgColor} flex flex-col justify-between relative overflow-hidden snap-center cursor-pointer hover:scale-[1.02] transition-transform shadow-sm`}>
                  {/* Mock Background Graphics */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(255,255,255,0.8), transparent)' }}></div>
                  
                  {/* User Activity Badge */}
                  <div className="relative z-10 flex items-center self-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 mt-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold mr-2 border border-white/50">
                      {activity.initials}
                    </div>
                    <span className="text-white text-xs font-semibold">
                      <span className="font-bold">{activity.user}</span> {activity.action}
                    </span>
                  </div>

                  {/* Mock Content / Title */}
                  <div className="relative z-10 text-white mt-auto text-center">
                    {activity.image ? (
                       <span className="text-2xl font-black tracking-widest opacity-90">OLIVIA DEAN</span>
                    ) : (
                       <span className="text-lg font-bold opacity-80 font-mono tracking-widest">TICKET DATA</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Trustpilot Banner */}
          <div className="flex items-center justify-center text-sm font-bold mt-4">
            <span className="mr-2">Excellent</span>
            <div className="flex space-x-1 mr-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-6 h-6 bg-[#00b67a] text-white flex items-center justify-center rounded-sm">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
                </div>
              ))}
            </div>
            <div className="flex items-center text-[#00b67a] text-lg">
               <svg className="w-5 h-5 fill-current mr-1" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
               Trustpilot
            </div>
          </div>
        </section>

        {/* 3. Value Props (Fast / Secure) */}
        <section className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 flex flex-col space-y-16 text-center border-t border-gray-100">
          <div>
            <div className="flex justify-center mb-4">
              {/* Fast Icon Stand-in */}
              <span className="text-5xl text-green-500 font-black italic">💨$</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Fast Sales</h2>
            <p className="text-gray-600 text-lg font-medium max-w-2xl mx-auto">
              List your ticket in three easy steps. Our stats show that over 90% of tickets will sell within 4 days.
            </p>
          </div>
          
          <div className="w-full h-px bg-gray-200"></div>

          <div>
            <div className="flex justify-center mb-4">
               {/* Secure Icon Stand-in */}
               <span className="text-5xl text-yellow-500">💳✅</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Secure Payouts</h2>
            <p className="text-gray-600 text-lg font-medium max-w-2xl mx-auto">
              We handle the payment, so you don't have to. When your ticket sells you'll be able to withdraw your funds instantly for a small fee or after the event for free.
            </p>
          </div>
        </section>

        {/* 4. Supported Platforms */}
        <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="flex justify-center mb-4">
             {/* Barcode Icon Stand-in */}
             <span className="text-5xl text-gray-400">|||✨</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-10 uppercase">Sell Any Ticket</h2>
          
          <div className="bg-[#2c2c2c] rounded-3xl p-10 md:p-16 text-white shadow-xl">
            <h3 className="text-2xl md:text-3xl font-medium mb-12">Tickets exchanged on Salex include those from:</h3>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80 font-bold text-xl md:text-2xl tracking-tighter">
              {mockSellData.platforms.map((platform, i) => (
                <span key={i} className="hover:opacity-100 transition cursor-default">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Testimonials */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 border-t border-gray-100">
          <div className="flex justify-between items-center mb-8">
             <h2 className="text-3xl font-black tracking-tight text-center w-full">Why fans love Salex</h2>
             {/* Right Arrow Navigation Placeholder */}
             <button className="hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 absolute right-10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {mockSellData.reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-2xl p-6 flex flex-col bg-white shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#fdf5e6] text-[#b8860b] flex items-center justify-center font-bold mr-4">
                    {review.initial}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{review.name}</h4>
                    <div className="flex space-x-1 text-yellow-400">
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
                      ))}
                    </div>
                  </div>
                </div>
                <h5 className="font-bold text-gray-900 mb-2 leading-tight">{review.title}</h5>
                <p className="text-gray-600 text-sm mb-2">{review.body}</p>
                <a href="#" className="text-sm font-medium text-gray-900 underline mt-auto">Read more</a>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center text-sm font-bold">
            <span className="mr-2">Excellent</span>
            <div className="flex space-x-1 mr-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-6 h-6 bg-[#00b67a] text-white flex items-center justify-center rounded-sm">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
                </div>
              ))}
            </div>
            <div className="flex items-center text-[#00b67a] text-lg">
               <svg className="w-5 h-5 fill-current mr-1" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
               Trustpilot
            </div>
          </div>
        </section>

        {/* 6. FAQ Accordion Section */}
        <section className="max-w-[800px] mx-auto px-4 sm:px-6 py-16">
          {/* Decorative Gradient Banner placeholder */}
          <div className="w-full h-24 bg-gradient-to-r from-[#ff7a59] to-[#ff4e8d] rounded-2xl mb-12 opacity-80"></div>
          
          <h2 className="text-2xl font-black mb-8">Frequently Asked Questions</h2>
          <div className="space-y-0">
            {mockSellData.faqs.map((faq, i) => (
              <div key={i} className="flex justify-between items-center py-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition group">
                <span className="text-lg text-gray-800 font-medium group-hover:text-orange-500 transition">{faq}</span>
                <svg className="w-5 h-5 text-gray-500 transform transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}