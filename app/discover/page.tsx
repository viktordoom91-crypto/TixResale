import React from 'react';

export default function SalexDiscoverPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* Top Warning Banner */}
      <div className="bg-gray-100 py-2 text-center text-xs text-gray-600 font-medium border-b border-gray-200">
        Salex is Australia's leading ticket marketplace. This is a ticket resale service. You are not dealing with an original ticket seller
      </div>

      {/* Navbar */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between bg-white sticky top-0 z-50">
        <div className="flex items-center space-x-6 w-full md:w-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-orange-400 rounded-sm transform rotate-12 flex-shrink-0"></div>
            <span className="text-xl font-black tracking-tight">salex</span>
          </div>
          
          {/* Search Pill */}
          <div className="hidden md:flex bg-gray-100 hover:bg-gray-200 transition rounded-full items-center px-4 py-2 w-72">
            <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Event, artist or venue" 
              className="bg-transparent outline-none w-full text-sm font-medium placeholder-gray-500"
            />
          </div>
        </div>

        <nav className="hidden md:flex space-x-6 items-center text-sm font-semibold">
          <a href="#" className="hover:text-gray-500 transition">About</a>
          <a href="#" className="hover:text-gray-500 transition">Help</a>
          <a href="#" className="hover:text-gray-500 transition">Sign in</a>
          <div className="flex items-center cursor-pointer hover:text-gray-500 transition">
            Partner with us <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <button className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-5 py-2 rounded-full hover:opacity-90 transition shadow-sm">
            Sell your tickets
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Concerts in Melbourne</h1>
          <p className="text-gray-600">Buy tickets to catch live music, concerts, tours, and gigs in Melbourne, Australia.</p>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {/* Active Tab */}
          <button className="flex flex-col items-center justify-center border-2 border-gray-900 rounded-xl px-6 py-4 min-w-[110px]">
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            <span className="text-sm font-semibold text-gray-900">Concerts</span>
          </button>
          
          {/* Inactive Tabs */}
          {[
            { name: 'Festival', icon: '🤘' },
            { name: 'Sports', icon: '🏈' },
            { name: 'Theatre', icon: '🎭' },
            { name: 'Comedy', icon: '😄' },
            { name: 'Food & drink', icon: '🍷' }
          ].map((tab) => (
            <button key={tab.name} className="flex flex-col items-center justify-center border border-gray-200 rounded-xl px-6 py-4 min-w-[110px] hover:border-gray-300 hover:bg-gray-50 transition text-gray-600">
              <span className="text-2xl mb-1">{tab.icon}</span>
              <span className="text-sm font-medium">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 py-4 border-t border-gray-100 mb-8">
          {['Melbourne', 'Select a timeframe', 'Select a genre', 'Show all events'].map((filter, i) => (
            <div key={i} className="relative">
              <select className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition">
                <option>{filter}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          ))}
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900 ml-2">Clear filters</button>
        </div>

        {/* Date Header */}
        <h2 className="text-2xl font-bold mb-6">Saturday 25 April 2026</h2>

        {/* Event List */}
        <div className="flex flex-col">
          {[
            {
              name: "Mumford & Sons",
              venue: "Rod Laver Arena",
              tickets: "40 tickets available",
              price: "from $110.00",
              imageColor: "bg-gray-800"
            },
            {
              name: "The Music of The Lion King In Concert",
              venue: "Melbourne Town Hall",
              tickets: "5 tickets available",
              price: "from $80.00",
              imageColor: "bg-amber-700"
            },
            {
              name: "Coco Poco Loco Presents: Steam Pink",
              venue: "The Third Day",
              tickets: "5 tickets available",
              price: "from $34.00",
              imageColor: "bg-yellow-400"
            },
            {
              name: "40/40 Vision: Anthony Pappa & Kasey Taylor",
              venue: "Howler",
              lineup: "Line-up: Kasey Taylor, Anthony Pappa",
              tickets: "4 tickets available",
              price: "from $35.00",
              imageColor: "bg-gray-900"
            },
            {
              name: "William Kiss",
              venue: "Skyline Car Park",
              tickets: "2 tickets available",
              price: "from $45.00",
              imageColor: "bg-orange-400"
            }
          ].map((event, i) => (
            <div key={i} className="flex flex-col sm:flex-row justify-between py-5 border-b border-gray-200 group cursor-pointer hover:bg-gray-50 -mx-4 px-4 transition rounded-lg">
              
              <div className="flex gap-4">
                {/* Event Thumbnail Placeholder */}
                <div className={`w-24 h-24 rounded-xl flex-shrink-0 ${event.imageColor} shadow-sm overflow-hidden`}></div>
                
                {/* Event Details */}
                <div className="flex flex-col py-1">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 group-hover:underline">{event.name}</h3>
                  <p className="text-gray-600 text-sm mb-1">{event.venue}</p>
                  {event.lineup && <p className="text-gray-500 text-sm">{event.lineup}</p>}
                </div>
              </div>

              {/* Action/Price Area */}
              <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end mt-4 sm:mt-0 py-1">
                <span className="text-sm font-medium text-gray-500">{event.tickets}</span>
                <button className="border border-gray-300 rounded-full px-4 py-1.5 text-sm font-semibold hover:border-gray-900 transition">
                  {event.price}
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center space-x-1 mt-10">
          <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-md text-gray-400 cursor-not-allowed">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white font-bold rounded-md">1</button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 font-medium rounded-md">2</button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 font-medium rounded-md">3</button>
          <span className="w-10 h-10 flex items-center justify-center text-gray-500">...</span>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 font-medium rounded-md">18</button>
          <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>

      </main>
    </div>
  );
}