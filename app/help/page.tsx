"use client";
import React, { useState } from 'react';

export default function HelpCenterPage() {
  const helpData = {
    quickLinks: [
      { id: "buyer", title: "Buyer", desc: "Everything you need to know about buying", icon: "signpost" },
      { id: "chat", title: "Need an updated ticket from your seller?", desc: "Most situations can be resolved within the buyer/seller chat.", icon: "chat" },
      { id: "seller", title: "Seller", desc: "Everything you need to know about selling", icon: "laptop" }
    ],
    categories: [
      { title: "How do I contact my buyer or seller?", items: ["Contacting your buyer or seller"] },
      { title: "I need help selling a ticket", items: ["Name changes", "My ticket is still for sale", "I'm trying to list my ticket", "I already sold a ticket", "General"] },
      { title: "I need help buying a ticket", items: ["Name changes", "I want to buy a ticket", "I already bought a ticket", "General"] },
      { title: "I need help with accessing my account", items: ["My Tixresale account"] },
      { title: "I need help with a waitlist or auto-purchase", items: ["Auto-purchase", "Waitlist"] },
      { title: "General", items: ["Event Specific FAQ's", "General"] }
    ],
    promotedArticles: [
      { title: "Can I contact my buyer or seller?", desc: "Yes, in certain cases where you need to finalise...", date: "20 April 2026" },
      { title: "I'm having trouble listing my ticket", desc: "There are a number of ways you can list your tickets...", date: "20 April 2026" },
      { title: "How to transfer a ticket to a buyer", desc: "Why do I need to transfer the ticket, hasn't Tixresale...", date: "20 April 2026" },
      { title: "I don't have my PDF, e-ticket or barcode yet, how do I list my ticket?", desc: "If you haven't received a PDF or e-ticket, we help...", date: "20 April 2026" },
      { title: "My name is not on my ticket", desc: "Do I need to worry about the name on my ticket...", date: "20 April 2026" },
      { title: "I haven't received my tickets", desc: "If your tickets are not available for download...", date: "20 April 2026" },
      { title: "I'm having trouble verifying my account?", desc: "There may be occasions where a Tixresale account has...", date: "20 April 2026" },
      { title: "I sold a ticket but haven't received the payout yet", desc: "There are a few possible reasons why you might...", date: "20 April 2026" },
      { title: "Burning Man Resale 2026", desc: "Buy & Sell Your Burning Man 2026 Tickets Safely...", date: "17 March 2026", icon: "user" }
    ]
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleCategory = (idx: number) => {
    setOpenCategories(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredCategories = helpData.categories.filter(cat => 
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredArticles = helpData.promotedArticles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black font-sans text-zinc-100 relative selection:bg-lime-400 selection:text-black">
      
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-50">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="w-5 h-5 bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.5)] rounded-sm transform rotate-12 group-hover:rotate-45 transition-all duration-300 flex-shrink-0"></div>
              <span className="text-xl font-black tracking-tight text-white group-hover:text-lime-400 transition-colors">tixresale</span>
            </div>
            
            <nav className="hidden md:flex space-x-6 text-sm font-bold text-zinc-400">
              <a href="#" className="hover:text-lime-400 transition-colors">Buyer/Seller Chat</a>
              <a href="#" className="hover:text-lime-400 transition-colors">Purchased Tickets</a>
              <a href="#" className="hover:text-lime-400 transition-colors">Listed Tickets</a>
            </nav>
          </div>

          <div className="md:hidden cursor-pointer text-lime-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
            </svg>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-950 px-4 py-4 space-y-4 text-sm font-bold border-t border-zinc-900 text-zinc-400">
             <a href="#" className="block hover:text-lime-400 transition-colors">Buyer/Seller Chat</a>
             <a href="#" className="block hover:text-lime-400 transition-colors">Purchased Tickets</a>
             <a href="#" className="block hover:text-lime-400 transition-colors">Listed Tickets</a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black pt-20 pb-32 px-4 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] bg-lime-400/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-[1100px] mx-auto relative z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8">
            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-lime-500 drop-shadow-[0_0_10px_rgba(163,230,53,0.3)]">help</span> you?
          </h1>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 relative -mt-20 pb-20 z-20">
        
        {/* Search Bar */}
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden mb-12">
          <div className="p-2 border-b border-zinc-800/50">
            <div className="flex items-center px-4 py-5">
              <svg className="w-8 h-8 text-lime-400 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Search for answers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xl md:text-2xl outline-none placeholder-zinc-600 font-medium text-white bg-transparent"
              />
            </div>
          </div>

          {!searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800 bg-zinc-950/50">
              {helpData.quickLinks.map((link) => (
                <div key={link.id} className="p-10 flex flex-col items-center text-center cursor-pointer hover:bg-zinc-900 transition-colors group">
                  <div className="w-16 h-16 mb-6 text-lime-400 transform group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(163,230,53,0.6)] transition-all duration-300">
                    {link.icon === "signpost" && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20v-6h6l2-2-2-2H9V4M9 10H5l-2 2 2 2h4"/></svg>}
                    {link.icon === "chat" && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>}
                    {link.icon === "laptop" && <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-lime-400 transition-colors">{link.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-[200px]">{link.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories Accordions */}
        <div className="space-y-6 mb-20">
          {filteredCategories.length > 0 ? filteredCategories.map((category, idx) => (
            <div key={idx} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors">
              <button 
                onClick={() => toggleCategory(idx)}
                className="w-full text-left px-6 py-6 flex justify-between items-center group"
              >
                <h2 className="text-2xl font-black text-white group-hover:text-lime-400 transition-colors">{category.title}</h2>
                <div className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center transition-transform duration-300 ${openCategories[idx] ? 'rotate-180 bg-lime-400/10 text-lime-400' : 'text-zinc-400 group-hover:text-lime-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </button>
              
              <div className={`grid transition-all duration-300 ease-in-out ${openCategories[idx] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 pt-2 space-y-3 bg-zinc-950/50 border-t border-zinc-800/50">
                    {category.items.map((item, i) => (
                      <div key={i} className="bg-zinc-900 border border-zinc-800/80 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:border-lime-400/50 hover:bg-zinc-800/50 transition-all group">
                        <span className="text-md font-medium text-zinc-300 group-hover:text-white transition-colors">{item}</span>
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-500 group-hover:bg-lime-400/20 group-hover:text-lime-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-zinc-500 font-medium text-center py-8">No categories matching "{searchQuery}"</p>
          )}
        </div>

        {/* Promoted Articles Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-black mb-2 text-white">{searchQuery ? 'Search Results' : 'Promoted articles'}</h2>
          {!searchQuery && <p className="text-zinc-500 mb-8 font-medium">Find our most searched for articles here</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.length > 0 ? filteredArticles.map((article, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col cursor-pointer hover:border-lime-400/50 hover:shadow-[0_5px_30px_rgba(163,230,53,0.1)] hover:-translate-y-1 transition-all duration-300 group h-[200px]">
                <div className="flex justify-between items-center mb-6">
                  {article.icon === "user" ? (
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-lime-400/20 group-hover:text-lime-400 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-lime-400 rounded-sm transform rotate-12 group-hover:rotate-45 group-hover:shadow-[0_0_15px_rgba(163,230,53,0.5)] transition-all duration-300"></div>
                  )}
                  <span className="text-xs font-medium text-zinc-500">{article.date}</span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-lime-400 transition-colors mb-3 leading-snug line-clamp-2">{article.title}</h3>
                <p className="text-zinc-400 text-sm line-clamp-2 mt-auto">{article.desc}</p>
              </div>
            )) : (
              <p className="text-zinc-500 col-span-full text-center py-8">No articles found.</p>
            )}
          </div>
        </div>

        {/* Final CTA */}
        <div className="pt-6 border-t border-zinc-900">
          <p className="text-xl font-bold text-zinc-300">
            Still need help? - <a href="#" className="text-lime-400 hover:text-lime-300 hover:underline transition-colors cursor-pointer drop-shadow-[0_0_8px_rgba(163,230,53,0.4)]">Contact the team</a>
          </p>
        </div>

      </main>

      {/* Floating "Get Help" Button */}
      <button className="fixed bottom-6 right-6 bg-lime-400 text-black px-6 py-3 rounded-full font-black shadow-[0_0_20px_rgba(163,230,53,0.3)] flex items-center hover:scale-105 hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] transition-all duration-300 z-50 group">
        <svg className="w-5 h-5 mr-2 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
        GET HELP
      </button>

    </div>
  );
}