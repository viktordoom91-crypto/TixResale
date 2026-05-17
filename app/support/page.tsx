// app/support/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Send, ShieldCheck, HelpCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Kick out unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 2. Fetch Chat History (Polling the SAFE user endpoint)
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchChat = async () => {
      try {
        // 🛠 THE FIX: We now hit the safe user route, NOT the admin route!
        const res = await fetch('/api/support/chat');
        if (res.ok) {
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load chat", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChat(); // Initial fetch
    const interval = setInterval(fetchChat, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [status]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !session) return;

    const messageContent = reply;
    setReply(''); // Clear input instantly

    // OPTIMISTIC UPDATE: Add to screen immediately before DB confirms
    const tempMessage = {
      id: Date.now().toString(),
content: messageContent,
// 🛠 FIXED: Safe optional chaining + type bypass + fallback for guests
senderId: (session?.user as any)?.id || 'guest-user',
createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      // 🛠 THE FIX: Post to the safe user route
      await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      });
    } catch (error) {
      console.error("Message send failed", error);
    }
  };

  if (loading || status === 'loading') {
    return <div className="h-screen bg-zinc-950 flex items-center justify-center font-black animate-pulse text-lime-400 uppercase tracking-widest text-xl">Connecting to Escrow Support...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 py-12 selection:bg-lime-500 selection:text-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase">Escrow Support</h1>
            <p className="text-zinc-500 font-medium mt-2">Chat directly with our team regarding your tickets or account.</p>
          </div>
          <Link href="/" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
        </div>

        {/* Chat Window */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden h-[600px] flex flex-col relative">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 blur-[80px] rounded-full pointer-events-none" />

          {/* Top Bar */}
          <div className="h-20 border-b border-zinc-800 px-8 flex items-center gap-4 bg-zinc-950/50 relative z-10">
            <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 rounded-full flex items-center justify-center text-lime-400 shadow-[0_0_15px_rgba(57,255,20,0.15)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white uppercase tracking-tight leading-tight">Admin Support Team</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
                <p className="text-[10px] text-lime-400 font-black uppercase tracking-widest">Online - Replies in minutes</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-950/30 relative z-10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <HelpCircle className="w-16 h-16 mb-4 text-zinc-800" />
                <p className="font-black uppercase tracking-widest text-lg text-zinc-500">How can we help you today?</p>
                <p className="text-sm font-medium mt-1">Send a message below to start a secure conversation.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === session?.user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${isMe ? 'bg-lime-400 text-black rounded-br-sm' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-bl-sm'}`}>
                      <p className={`text-sm ${isMe ? 'font-bold' : 'font-medium'}`}>{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 font-black uppercase tracking-widest ${isMe ? 'text-zinc-800 text-right' : 'text-zinc-600'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-3 relative z-10">
            <input 
              type="text" 
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your message securely..." 
              className="flex-1 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-5 py-4 text-sm font-medium focus:border-lime-500 outline-none transition-all"
            />
            <button type="submit" disabled={!reply.trim()} className="bg-lime-400 text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-lime-300 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.15)]">
              Send <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
