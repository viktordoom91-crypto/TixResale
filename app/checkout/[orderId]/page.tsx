// app/checkout/[orderId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldCheck, MapPin, Calendar, Copy, Ticket, CheckCircle2, AlertTriangle, ArrowLeft, Lock, Minus, Plus, UploadCloud, FileImage, CreditCard, MessageSquareWarning, ArrowRight, Check, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { useCurrency } from '../../components/CurrencyProvider';

const SECTIONS = ['VIP Standing', 'Main Floor', 'Balcony Unreserved', 'Backstage Pass', 'Lower Tier', 'Golden Circle'];
const getSeatInfo = (id: string) => {
  const charCode = id.charCodeAt(id.length - 1) + id.charCodeAt(id.length - 2);
  const section = SECTIONS[charCode % SECTIONS.length];
  const row = String.fromCharCode(65 + (charCode % 11)); 
  return { section, row };
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState('');
  
  const { formatPrice } = useCurrency();

  // --- PAGINATION & FLOW STATE ---
  const [step, setStep] = useState(1);
  const [selectedGateway, setSelectedGateway] = useState<'CARD' | 'ESCROW' | null>(null);
  const [escrowNotified, setEscrowNotified] = useState(false);
  
  const [escrowWaitTime, setEscrowWaitTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeMethodIndex, setActiveMethodIndex] = useState(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [maxAvailable, setMaxAvailable] = useState(1);

  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');

  const fetchOrder = useCallback(async (isSilentRefresh = false) => {
    if (!isSilentRefresh) setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        if (!isSilentRefresh) router.push('/'); 
        return;
      }
      const json = await res.json();
      setData(json);
      
      if (json.order?.ticketBatch?.quantity) {
        setMaxAvailable(json.order.ticketBatch.quantity);
      }

      if (!isSilentRefresh) {
        const diff = new Date(json.order.expiresAt).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (orderId) fetchOrder(refreshKey > 0);
  }, [orderId, fetchOrder, refreshKey]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (escrowWaitTime === null || escrowWaitTime <= 0) return;
    const interval = setInterval(() => {
      setEscrowWaitTime((prev) => (prev ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [escrowWaitTime]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleCardPayment = async () => {
    setCardLoading(true);
    try {
      const res = await fetch('/api/checkout/card2crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: orderId,
          buyerName, buyerEmail, buyerPhone, buyerAddress
        })
      });
      const resData = await res.json();
      
      if (resData.url) {
        window.location.href = resData.url;
      } else {
        alert(resData.error || 'Failed to initialize payment gateway.');
      }
    } catch (error) {
      console.error('Card2Crypto Error:', error);
      alert('Network error. Please try again or use manual escrow.');
    } finally {
      setCardLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!receiptFile) {
      alert("Please upload a payment receipt to confirm your reservation.");
      return;
    }

    setIsConfirming(true);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) throw new Error("Cloudinary environment variables are missing.");

      const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const formData = new FormData();
      formData.append('file', receiptFile);
      formData.append('upload_preset', uploadPreset);

      const cloudinaryRes = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const cloudinaryData = await cloudinaryRes.json();
      
      if (!cloudinaryRes.ok || !cloudinaryData.secure_url) {
        throw new Error("Failed to upload receipt image.");
      }

      const confirmRes = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: orderId, 
          receiptUrl: cloudinaryData.secure_url,
          buyerName, buyerEmail, buyerPhone, buyerAddress
        }),
      });
      if (confirmRes.ok) {
        alert("Payment submitted! The admin is verifying your receipt.");
        router.push('/');
      } else {
        throw new Error("Failed to update order in database.");
      }
    } catch (error) {
      console.error(error);
      alert("Error confirming payment. Please try again or contact Escrow Support.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) return <div className="h-screen bg-zinc-950 flex items-center justify-center font-black text-2xl animate-pulse text-lime-400 uppercase tracking-widest">Securing Checkout...</div>;
  if (!data || data.error || !data.order) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Order Not Found</h2>
        <Link href="/" className="bg-lime-400 text-black px-8 py-3 rounded-full font-black uppercase tracking-widest hover:bg-lime-300 transition mt-6">Return to Home</Link>
      </div>
    );
  }

  const { order, systemSettings } = data;
  const { ticketBatch } = order;
  const { event } = ticketBatch;

  const paymentMethods = systemSettings?.paymentMethods || [];
  const activeMethod = paymentMethods[activeMethodIndex] || null;
  const mins = Math.floor((timeLeft || 0) / 60);
  const secs = (timeLeft || 0) % 60;
  const isExpiring = (timeLeft || 0) < 300; 
  const isExpired = timeLeft === 0;

  const currentQuantity = Math.min(selectedQuantity, maxAvailable);
  const subtotal = ticketBatch.price * currentQuantity;
  const vatRate = systemSettings?.vatRate || 0;
  const vatAmount = (subtotal * vatRate) / 100;
  const totalPrice = subtotal + vatAmount;

  const eventDate = new Date(event.date);
  const timeString = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateString = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  const venueParts = event.description?.split(' at ') || [];
  const venueName = venueParts.length > 1 ? venueParts[1] : event.city;
  const seatInfo = getSeatInfo(ticketBatch.id);
  const EMAIL_URL = `mailto:support.tixresale@gmail.com?subject=${encodeURIComponent(`Escrow Verification: Order ID ${order.id}`)}&body=${encodeURIComponent(`Hi Tix resale Escrow,\n\nI am ready to make a manual transfer for Order ID: ${order.id}.\n\n`)}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans pb-24 selection:bg-lime-500 selection:text-black">
      
      {/* HEADER */}
      <header className="bg-zinc-950 border-b border-zinc-900 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.push(`/event/${event.id}`)} className="flex items-center text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> {step > 1 ? "Back" : "Cancel"}
        </button>
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-lime-400" />
          <span className="font-black text-xs uppercase tracking-[0.2em] text-white">Checkout Step {step} of 4</span>
        </div>
        <div className="w-20"></div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: STATIC ORDER SUMMARY */}
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Order Summary</h2>
            
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
              <div className="h-56 relative overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-transparent z-10" />
                <img src={event.imageUrl || ''} alt={event.title} className="w-full h-full object-cover opacity-60 grayscale-[30%]" />
                <div className="absolute bottom-5 left-6 z-20 text-white right-6">
                  <h3 className="text-2xl font-black uppercase tracking-tight line-clamp-2 leading-tight mb-3">{event.title}</h3>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-300">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-lime-400" /> {dateString}
                    </div>
                    <div className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-300">
                      <Clock className="w-3.5 h-3.5 mr-2 text-lime-400" /> {timeString}
                    </div>
                    <div className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-300 col-span-2 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-lime-400 flex-shrink-0" /> Venue: {venueName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <div>
                  <p className="font-black text-lg text-white flex items-center gap-2 uppercase tracking-tight">
                    <Ticket className="w-5 h-5 text-lime-400" /> Event Ticket
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Sec: {seatInfo.section}</span>
                    <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Row: {seatInfo.row}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Qty</p>
                  <p className="font-black text-xl text-white">x{currentQuantity}</p>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-zinc-900/50">
                <div className="flex justify-between text-zinc-400 font-bold text-sm">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400 font-bold text-sm">
                  <span>VAT ({vatRate}%)</span>
                  <span className="text-white">{formatPrice(vatAmount)}</span>
                </div>
                <div className="pt-4 mt-2 border-t border-zinc-800 flex justify-between items-center">
                  <span className="font-black uppercase tracking-widest text-zinc-400 text-xs">Total</span>
                  <span className="font-black text-3xl text-white tracking-tighter">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl">
              <h4 className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest mb-2">
                <ShieldCheck className="w-4 h-4 text-lime-400" /> Need Assistance?
              </h4>
              <p className="text-xs text-zinc-500 font-medium mb-4 leading-relaxed">
                If you encounter any issues during payment or need your receipt verified manually, our Escrow Agents are live.
              </p>
              <div className="flex gap-3">
                <a href={EMAIL_URL} className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-blue-500/20 transition">
                  <Mail className="w-4 h-4" /> Email Escrow Support
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PAGINATED CHECKOUT WIZARD */}
          <div className="lg:col-span-7">
            
            {/* Timer Banner */}
            <div className={`p-4 rounded-2xl mb-8 flex items-center justify-center gap-3 border transition-colors duration-500 ${
              isExpired ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
              isExpiring ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 
              'bg-zinc-900 border-zinc-800 text-lime-400'
            }`}>
              {isExpired ? <AlertTriangle className="w-5 h-5" /> : <Clock className={`w-5 h-5 ${isExpiring ? 'animate-pulse' : ''}`} />}
              <div className="font-black text-lg tracking-widest uppercase">
                {isExpired ? "Reservation Expired" : `Reserved for ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
              </div>
            </div>

            {!isExpired && (
              <div className="flex items-center justify-between mb-8 px-2">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors duration-500 ${
                      step === num ? 'bg-lime-400 text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 
                      step > num ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-900 text-zinc-600'
                    }`}>
                      {step > num ? <Check className="w-4 h-4" /> : num}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isExpired ? (
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center shadow-2xl">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Time is up</h3>
                <p className="text-zinc-500 font-medium mb-6">These tickets have been released back to the public marketplace.</p>
                <Link href={`/event/${event.id}`} className="bg-lime-400 text-black px-8 py-3.5 rounded-full font-black uppercase tracking-widest hover:bg-lime-300 transition">Find New Tickets</Link>
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative min-h-[400px]">
                
                <AnimatePresence mode="wait">
                  {/* STEP 1: CONFIRM QUANTITY */}
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Configure Tickets</h3>
                      <p className="text-zinc-500 text-sm font-medium mb-8">Select the exact number of tickets you want to secure.</p>
                      
                      {/* 🛠 FIXED: Flex wrap and gap for mobile quantity buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-800 mb-8">
                        <div>
                          <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Total Quantity</span>
                          <p className="text-xs text-lime-400 font-bold uppercase tracking-widest mt-1">{maxAvailable} Available in this batch</p>
                        </div>
                        <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
                          <button 
                            onClick={() => setSelectedQuantity(Math.max(1, currentQuantity - 1))} 
                            className="p-4 hover:bg-zinc-800 text-white transition disabled:opacity-50 flex-1 sm:flex-none flex justify-center"
                            disabled={currentQuantity <= 1}
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="px-6 py-2 font-black text-xl text-white border-x border-zinc-700 text-center flex-1 sm:flex-none">{currentQuantity}</span>
                          <button 
                            onClick={() => setSelectedQuantity(Math.min(maxAvailable, currentQuantity + 1))} 
                            className="p-4 hover:bg-zinc-800 text-white transition disabled:opacity-50 flex-1 sm:flex-none flex justify-center"
                            disabled={currentQuantity >= maxAvailable}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <button onClick={() => setStep(2)} className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-lime-300 transition flex justify-center items-center gap-2">
                        Continue to Details <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 2 - DELIVERY DETAILS */}
                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Delivery Details</h3>
                      <p className="text-zinc-500 text-sm font-medium mb-8">Where should we send your digital tickets?</p>
                      
                      <div className="space-y-5 mb-8">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Full Name *</label>
                          <input 
                            type="text" 
                            value={buyerName} 
                            onChange={(e) => setBuyerName(e.target.value)} 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all placeholder-zinc-700" 
                            placeholder="John Doe" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Email Address *</label>
                          <input 
                            type="email" 
                            value={buyerEmail} 
                            onChange={(e) => setBuyerEmail(e.target.value)} 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all placeholder-zinc-700" 
                            placeholder="john@example.com" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Phone Number *</label>
                          <input 
                            type="tel" 
                            value={buyerPhone} 
                            onChange={(e) => setBuyerPhone(e.target.value)} 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all placeholder-zinc-700" 
                            placeholder="+1 234 567 8900" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Billing Address (Optional)</label>
                          <input 
                            type="text" 
                            value={buyerAddress} 
                            onChange={(e) => setBuyerAddress(e.target.value)} 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all placeholder-zinc-700" 
                            placeholder="123 Main St, City, Country" 
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => setStep(3)} 
                        disabled={!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()} 
                        className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-lime-300 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        Continue to Payment <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 3: CHOOSE GATEWAY */}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Select Gateway</h3>
                      <p className="text-zinc-500 text-sm font-medium mb-8">Choose how you want to secure these tickets.</p>

                      <div className="space-y-4 mb-8">
                        <div 
                          onClick={() => setSelectedGateway('CARD')}
                          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedGateway === 'CARD' ? 'bg-lime-400/5 border-lime-400' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <CreditCard className={`w-6 h-6 ${selectedGateway === 'CARD' ? 'text-lime-400' : 'text-zinc-500'}`} />
                              <h4 className="font-black text-white uppercase tracking-tight text-lg">Instant Card Payment</h4>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedGateway === 'CARD' ? 'border-lime-400' : 'border-zinc-700'}`}>
                              {selectedGateway === 'CARD' && <div className="w-2.5 h-2.5 bg-lime-400 rounded-full" />}
                            </div>
                          </div>
                          <p className="text-sm text-zinc-500 font-medium ml-9">Pay securely with Apple Pay, Google Pay, or Global Credit Cards. No KYC required.</p>
                        </div>

                        <div 
                          onClick={() => setSelectedGateway('ESCROW')}
                          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedGateway === 'ESCROW' ? 'bg-lime-400/5 border-lime-400' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <ShieldCheck className={`w-6 h-6 ${selectedGateway === 'ESCROW' ? 'text-lime-400' : 'text-zinc-500'}`} />
                              <h4 className="font-black text-white uppercase tracking-tight text-lg">Manual Escrow Transfer</h4>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedGateway === 'ESCROW' ? 'border-lime-400' : 'border-zinc-700'}`}>
                              {selectedGateway === 'ESCROW' && <div className="w-2.5 h-2.5 bg-lime-400 rounded-full" />}
                            </div>
                          </div>
                          <p className="text-sm text-zinc-500 font-medium ml-9">Transfer funds to a local secure account. Requires receipt upload & manual admin verification.</p>
                        </div>
                      </div>

                      <button onClick={() => setStep(4)} disabled={!selectedGateway} className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-lime-300 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        Proceed <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 4: EXECUTE PAYMENT */}
                  {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      
                      {order.status === 'ESCROW_REVIEW' && (
                        <div className="m-8 p-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-center">
                          <MessageSquareWarning className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                          <h3 className="text-white font-black uppercase tracking-tight mb-2">Admin Review Ongoing</h3>
                          <p className="text-zinc-400 font-medium text-xs mb-4 max-w-sm mx-auto">
                            The admin has flagged your payment. Please use the Email button on the left to resolve the issue with Escrow immediately.
                          </p>
                        </div>
                      )}

                      {selectedGateway === 'CARD' ? (
                        <div className="p-8 text-center">
                          <div className="w-20 h-20 bg-lime-400/10 text-lime-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-lime-400/20">
                            <CreditCard className="w-10 h-10" />
                          </div>
                          <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Global Payment</h3>
                          <p className="text-zinc-400 font-medium text-sm mb-10 max-w-md mx-auto">
                            You will be securely redirected to our Web3 payment processor. Your tickets will be released instantly upon successful payment.
                          </p>
                          <button onClick={handleCardPayment} disabled={cardLoading} className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-lime-300 transition shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                            {cardLoading ? "Generating Gateway..." : "Pay Securely Now"}
                          </button>
                        </div>
                      ) : (
                        <div>
                          {/* INTERACTIVE ESCROW WAIT GATE */}
                          {!escrowNotified ? (
                            <div className="p-12 text-center bg-zinc-950/50">
                              <div className="w-20 h-20 bg-lime-400/10 text-lime-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-lime-400/20 shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                                <ShieldCheck className="w-10 h-10" />
                              </div>
                              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Initiate Escrow</h3>
                              <p className="text-zinc-400 font-medium text-sm mb-10 max-w-md mx-auto leading-relaxed">
                                To ensure maximum security, manual transfers require authorization from an Escrow Agent. Click below to notify them and receive your secure payment details.
                              </p>
                              <button
                                onClick={() => {
                                  window.location.href = EMAIL_URL;
                                  setEscrowNotified(true);
                                  setEscrowWaitTime(300); // Start 5-minute wait timer
                                }}
                                className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-lime-300 transition shadow-[0_0_20px_rgba(57,255,20,0.2)] flex items-center justify-center gap-3"
                               >
                                <Mail className="w-5 h-5" /> Email Escrow Agent
                              </button>
                            </div>
                          ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                              {/* 5 MINUTE DRAWDOWN TIMER */}
                              {escrowWaitTime !== null && escrowWaitTime > 0 && (
                                <div className="m-8 bg-orange-500/10 border border-orange-500/30 p-6 rounded-2xl text-center">
                                  <Clock className="w-8 h-8 text-orange-400 mx-auto mb-3 animate-pulse" />
                                  <h3 className="text-white font-black uppercase tracking-tight mb-2">Awaiting Escrow Assignment</h3>
                                  <p className="text-zinc-400 font-medium text-xs mb-4 max-w-sm mx-auto">
                                    Please wait up to 5 minutes for the Escrow Agent to verify availability and assign a secure payment account.
                                  </p>
                                  <div className="text-4xl font-mono font-black text-orange-400 tracking-widest mb-4 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                                    {Math.floor(escrowWaitTime / 60).toString().padStart(2, '0')}:{(escrowWaitTime % 60).toString().padStart(2, '0')}
                                  </div>
                                  <button 
                                    onClick={() => setEscrowWaitTime(0)} 
                                    className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-white transition"
                                  >
                                    Skip Wait (Admin Already Updated)
                                  </button>
                                </div>
                              )}

                              {paymentMethods.length > 1 && (
                                <div className="flex overflow-x-auto hide-scrollbar border-b border-zinc-800 bg-zinc-950 p-4 gap-2">
                                  {paymentMethods.map((pm: any, idx: number) => (
                                    <button 
                                      key={idx} onClick={() => setActiveMethodIndex(idx)}
                                      className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors ${activeMethodIndex === idx ? 'bg-zinc-800 text-lime-400' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                                    >
                                      {pm.type}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="p-8 bg-zinc-950 space-y-4">
                                
                                {/* Refresh Button for Admin Updates */}
                                <div className="flex justify-end mb-2">
                                  <button 
                                    onClick={() => {
                                      setIsRefreshing(true);
                                      setRefreshKey(k => k + 1);
                                    }}
                                    disabled={isRefreshing}
                                    className="flex items-center gap-2 text-xs font-black text-lime-400 uppercase tracking-widest hover:text-white transition disabled:opacity-50"
                                   >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Details
                                  </button>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer group" onClick={() => handleCopy(activeMethod?.accountNumber || '', 'number')}>
                                  <div>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Account Number</p>
                                    <p className="font-black text-2xl font-mono text-white tracking-widest">{activeMethod?.accountNumber}</p>
                                  </div>
                                  <button className={`p-3 rounded-xl transition ${copiedText === 'number' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400 group-hover:bg-lime-400'}`}>
                                    {copiedText === 'number' ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer group" onClick={() => handleCopy(activeMethod?.accountName || '', 'bank')}>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Bank</p>
                                    <p className="font-black text-sm text-white uppercase tracking-tight truncate">{activeMethod?.accountName}</p>
                                  </div>
                                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer group" onClick={() => handleCopy(activeMethod?.receiverName || '', 'name')}>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Receiver Name</p>
                                    <p className="font-black text-sm text-white uppercase tracking-tight truncate">{activeMethod?.receiverName}</p>
                                  </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-zinc-800">
                                  <p className="text-[10px] text-lime-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <UploadCloud className="w-4 h-4" /> Required: Upload Receipt
                                   </p>
                                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-2xl cursor-pointer hover:bg-zinc-900 transition">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      {receiptFile ? (
                                        <><FileImage className="w-8 h-8 text-lime-400 mb-2" /><p className="text-sm font-bold text-white max-w-[200px] truncate">{receiptFile.name}</p></>
                                      ) : (
                                        <><UploadCloud className="w-8 h-8 text-zinc-600 mb-2" /><p className="text-sm font-bold text-zinc-400">Click to upload image</p></>
                                      )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                  </label>
                                </div>

                                <button onClick={handleConfirmPayment} disabled={isConfirming || !receiptFile || (escrowWaitTime !== null && escrowWaitTime > 0)} className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm mt-6 hover:bg-lime-300 transition disabled:opacity-50 flex justify-center items-center shadow-xl">
                                  {isConfirming ? <span className="animate-pulse">Uploading & Verifying...</span> : "Submit Manual Payment"}
                                </button>
                              </div>
                            </motion.div>
                           )}
                        </div>
                      )}
                    </motion.div>
                   )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
        }
