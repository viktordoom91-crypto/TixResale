// components/LiveChatWidget.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher';

// In a real app, grab the actual user ID from NextAuth. 
// We use a random string here for the blueprint.
const USER_ID = `user-${Math.floor(Math.random() * 1000)}`; 
const CHANNEL_NAME = `support-${USER_ID}`;

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, senderId: string}[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(CHANNEL_NAME);

    channel.bind('new-message', (data: {text: string, senderId: string}) => {
      setMessages((prev) => [...prev, data]);
      // Auto-scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const currentMessage = input;
    setInput(''); // Optimistic clear

    await fetch('/api/pusher/message', {
      method: 'POST',
      body: JSON.stringify({
        message: currentMessage,
        senderId: USER_ID,
        channelName: CHANNEL_NAME,
      }),
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-black text-white p-4 rounded-full shadow-xl font-bold"
      >
        💬 Support
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col h-96 overflow-hidden">
      <div className="bg-black text-white p-3 font-bold flex justify-between items-center">
        <span>Live Support</span>
        <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">✕</button>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col gap-2">
        {messages.map((msg, i) => (
          <div key={i} className={`p-2 rounded-lg max-w-[80%] ${msg.senderId === USER_ID ? 'bg-blue-600 text-white self-end' : 'bg-gray-200 text-black self-start'}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-black"
        />
        <button onClick={sendMessage} className="bg-black text-white px-4 py-2 rounded-lg font-bold">
          Send
        </button>
      </div>
    </div>
  );
}