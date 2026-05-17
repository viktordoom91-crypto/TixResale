// app/admin/support/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, User as UserIcon, CheckCircle2, MessageSquare, ArrowLeft } from 'lucide-react';

export default function SupportDashboard() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  
  // 🛠 NEW: Mobile layout toggle state
  const [showMobileInbox, setShowMobileInbox] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  useEffect(() => {
    fetch('/api/admin/support')
      .then(res => res.json())
      .then(data => setConversations(Array.isArray(data) ? data : []));
  }, []);

  // Polling Engine: Fetch messages for the active chat every 3 seconds
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = () => {
      fetch(`/api/admin/support/${activeChatId}`)
        .then(res => res.json())
        .then(data => setMessages(Array.isArray(data) ? data : []));
    };

    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 3000); // Poll

    return () => clearInterval(interval);
  }, [activeChatId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeChatId) return;

    const messageContent = reply;
    setReply(''); // Optimistic clear

    // Optimistic UI append
    const tempMessage = {
      id: Date.now().toString(),
      content: messageContent,
      sender: { role: 'ADMIN' },
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    await fetch('/api/admin/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeChatId, content: messageContent })
    });

    // Manually trigger a message refetch so it syncs with DB
    fetch(`/api/admin/support/${activeChatId}`)
      .then(res => res.json())
      .then(data => setMessages(Array.isArray(data) ? data : []));
  };

  const activeConvo = conversations.find(c => c.id === activeChatId);

  return (
    <div className="max-w-7xl h-[85vh] flex bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-lime-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* 📱 LEFT: Conversation List (Hidden on mobile if a chat is active) */}
      <div className={`border-r border-zinc-800 flex-col bg-zinc-950/50 relative z-10 transition-all duration-300 ${showMobileInbox ? 'flex w-full' : 'hidden md:flex md:w-1/3'}`}>
        <div className="p-6 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-2xl font-black tracking-tight uppercase text-white mb-4">Inbox</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-medium text-white placeholder-zinc-600 focus:border-lime-500 outline-none transition-all" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 font-black uppercase tracking-widest text-xs">No active support tickets.</div>
          ) : (
            conversations.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => {
                  setActiveChatId(chat.id);
                  setShowMobileInbox(false); // 🛠 Hides inbox on mobile when a chat is tapped
                }}
                className={`p-6 border-b border-zinc-800/50 cursor-pointer transition-colors group ${activeChatId === chat.id ? 'bg-lime-400/5 border-l-4 border-l-lime-400' : 'hover:bg-zinc-800/30 border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className={`font-bold ${activeChatId === chat.id ? 'text-lime-400' : 'text-white group-hover:text-lime-400'} transition-colors`}>
                    {chat.user?.name || 'Guest User'}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                    {new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-1 font-medium">{chat.messages?.[0]?.content || 'Started a conversation'}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 📱 RIGHT: Chat Window (Hidden on mobile if inbox is active) */}
      <div className={`flex-col bg-zinc-900 relative z-10 transition-all duration-300 ${!showMobileInbox ? 'flex w-full' : 'hidden md:flex md:w-2/3'}`}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <MessageSquare className="w-16 h-16 mb-4 text-zinc-800" />
            <p className="font-black text-lg text-zinc-500 uppercase tracking-widest text-center px-4">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-20 border-b border-zinc-800 px-4 md:px-8 flex items-center justify-between bg-zinc-950/30">
              <div className="flex items-center gap-3 md:gap-4">
                
                {/* 🛠 NEW: Mobile Back Button */}
                <button 
                  onClick={() => setShowMobileInbox(true)} 
                  className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="w-10 h-10 md:w-12 md:h-12 bg-lime-400/10 border border-lime-400/20 text-lime-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.15)] flex-shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-black text-base md:text-lg leading-tight text-white uppercase tracking-tight truncate">
                    {activeConvo?.user?.name || 'Guest User'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse flex-shrink-0" />
                    <p className="text-[9px] md:text-[10px] text-lime-400 font-black uppercase tracking-widest truncate">Active Now</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-zinc-950/20">
              {messages.map((msg) => {
                const isAdmin = msg.sender?.role === 'ADMIN';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 md:px-5 py-3 shadow-md ${isAdmin ? 'bg-lime-400 text-black rounded-br-sm' : 'bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-bl-sm'}`}>
                      <p className={`text-sm ${isAdmin ? 'font-bold' : 'font-medium'}`}>{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 font-black uppercase tracking-widest text-right ${isAdmin ? 'text-zinc-800' : 'text-zinc-600'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2 md:gap-3">
              <input 
                type="text" 
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type reply..." 
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm font-medium text-white placeholder-zinc-600 focus:border-lime-500 outline-none transition-all"
              />
              <button type="submit" disabled={!reply.trim()} className="bg-lime-400 text-black px-4 md:px-8 py-3 md:py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-lime-300 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.15)] flex-shrink-0">
                <span className="hidden md:inline">Send</span> <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}