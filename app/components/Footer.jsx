// app/components/Footer.tsx
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 pt-16 border-t border-zinc-900 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-6">Resources</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-500">
              <li><Link href="/about" className="hover:text-lime-400 transition-colors">About us</Link></li>
            </ul>
          </div>
          
          {/* Dynamic City Links */}
          <div>
            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-6">Cities</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-500">
              <li><Link href="/?city=London" className="hover:text-lime-400 transition-colors text-lime-400/70">London</Link></li>
              <li><Link href="/?city=Berlin" className="hover:text-lime-400 transition-colors text-lime-400/70">Berlin</Link></li>
              <li><Link href="/?city=Las-Vegas" className="hover:text-lime-400 transition-colors text-lime-400/70">Las Vegas</Link></li>
              <li><Link href="/?city=Nashville" className="hover:text-lime-400 transition-colors text-lime-400/70">Nashville</Link></li>
              <li><Link href="/?city=Chicago" className="hover:text-lime-400 transition-colors text-lime-400/70">Chicago</Link></li>
              <li><Link href="/?city=Tokyo" className="hover:text-lime-400 transition-colors text-lime-400/70">Tokyo</Link></li>
              <li><Link href="/?city=Rio-de-Janeiro" className="hover:text-lime-400 transition-colors text-lime-400/70">Rio de Janeiro</Link></li>
              <li><Link href="/?city=Amsterdam" className="hover:text-lime-400 transition-colors text-lime-400/70">Amsterdam</Link></li>
              <li><Link href="/?city=Vienna" className="hover:text-lime-400 transition-colors text-lime-400/70">Vienna</Link></li>
              <li><Link href="/?city=Barcelona" className="hover:text-lime-400 transition-colors text-lime-400/70">Barcelona</Link></li>
            </ul> {/* <-- Missing closing tag added here */}
          </div>
          
          {/* Dynamic Country/Region Links */}
          <div>
            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-6">Regions</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-500">
              <li><Link href="/?region=Western-Europe" className="hover:text-lime-400 transition-colors text-lime-400/70">Western Europe</Link></li>
              <li><Link href="/?region=California" className="hover:text-lime-400 transition-colors text-lime-400/70">California</Link></li>
              <li><Link href="/?region=Latin-America" className="hover:text-lime-400 transition-colors text-lime-400/70">Latin America</Link></li>
              <li><Link href="/?region=East-Asia" className="hover:text-lime-400 transition-colors text-lime-400/70">East Asia</Link></li>
              <li><Link href="/?region=Southern-USA" className="hover:text-lime-400 transition-colors text-lime-400/70">Southern USA</Link></li>
              <li><Link href="/?region=Scandinavia" className="hover:text-lime-400 transition-colors text-lime-400/70">Scandinavia</Link></li>
              <li><Link href="/?region=Midwest-USA" className="hover:text-lime-400 transition-colors text-lime-400/70">Midwest USA</Link></li>
              <li><Link href="/?region=Oceania" className="hover:text-lime-400 transition-colors text-lime-400/70">Oceania</Link></li>
              <li><Link href="/?region=Mediterranean" className="hover:text-lime-400 transition-colors text-lime-400/70">Mediterranean</Link></li>
              <li><Link href="/?region=Southeast-Asia" className="hover:text-lime-400 transition-colors text-lime-400/70">Southeast Asia</Link></li>
            </ul>
          </div>
          
          {/* Dynamic Category Links */}
          <div>
            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-6">Explore</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-500">
              <li><Link href="/?keyword=Concerts" className="hover:text-lime-400 transition-colors">Concerts</Link></li>
              <li><Link href="/?keyword=Festivals" className="hover:text-lime-400 transition-colors">Festivals</Link></li>
              <li><Link href="/?keyword=Sports" className="hover:text-lime-400 transition-colors">Sports</Link></li>
              <li><Link href="/?keyword=Theatre" className="hover:text-lime-400 transition-colors">Theatre</Link></li>
              <li><Link href="/?keyword=Comedy" className="hover:text-lime-400 transition-colors">Comedy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="py-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs text-zinc-600 font-black uppercase tracking-widest">
          <p>© 2018-2026 Salex Pty Ltd. ACN 625 710 581</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-lime-400 transition-colors"><span className="text-lg">f</span></a>
            <a href="#" className="hover:text-lime-400 transition-colors"><span className="text-lg">𝕏</span></a>
            <a href="#" className="hover:text-lime-400 transition-colors"><span className="text-lg">ig</span></a>
            <a href="#" className="hover:text-lime-400 transition-colors"><span className="text-lg">tik</span></a>
          </div>
        </div>

      </div>
      {/* Bottom Glowing Accent Line */}
      <div className="h-1 w-full bg-lime-400 shadow-[0_-5px_15px_rgba(57,255,20,0.4)]"></div>
    </footer>
  );
}