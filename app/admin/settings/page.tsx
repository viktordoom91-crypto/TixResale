// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Building2, CreditCard, Save, CheckCircle2, Plus, Trash2, Percent, Clock, Wallet, Bitcoin, Smartphone, Globe, AtSign } from 'lucide-react';

const PAYMENT_TYPES = [
  { id: 'Bank Transfer', label: 'Local Bank Transfer', icon: Building2 },
  { id: 'PayPal', label: 'PayPal', icon: AtSign },
  { id: 'Zelle', label: 'Zelle', icon: Smartphone },
  { id: 'CashApp', label: 'CashApp', icon: Smartphone },
  { id: 'Skrill', label: 'Skrill', icon: Wallet },
  { id: 'Crypto', label: 'Crypto Wallet (USDT/BTC/ETH)', icon: Bitcoin },
  { id: 'Card Gateway', label: 'Global Card Gateway', icon: Globe },
  { id: 'Other', label: 'Other Custom Method', icon: Wallet },
];

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    allowManualPayments: true,
    vatRate: 12.5,
    paymentMethods: []
  });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        setFormData({
          ...data,
          paymentMethods: data.paymentMethods || []
        });
        setLoading(false);
      });
  }, []);

  const handleMethodChange = (index: number, field: string, value: string | number | boolean) => {
    const updatedMethods = [...(formData.paymentMethods || [])];
    updatedMethods[index] = { ...updatedMethods[index], [field]: value };
    setFormData({ ...formData, paymentMethods: updatedMethods });
  };

  const addPaymentMethod = () => {
    setFormData({
      ...formData,
      paymentMethods: [
        ...(formData.paymentMethods || []),
        { 
          type: 'Bank Transfer', 
          accountName: '', 
          accountNumber: '', 
          receiverName: '', 
          instructions: 'Please transfer the exact amount and upload your payment receipt below for Escrow verification.', 
          timerMinutes: 15, 
          isActive: true 
        }
      ]
    });
  };

  const removePaymentMethod = (index: number) => {
    const updatedMethods = (formData.paymentMethods || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, paymentMethods: updatedMethods });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-lime-400 font-black flex justify-center mt-24 uppercase tracking-widest text-xl">Loading Core Systems...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-32">
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">System Settings</h1>
        <p className="text-zinc-500 font-medium mt-2">Manage dynamic payment options, routing, and VAT configurations.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Global Configurations */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tight mb-8 relative z-10">
            <div className="w-10 h-10 bg-lime-400/10 border border-lime-400/20 rounded-full flex items-center justify-center">
              <Percent className="w-5 h-5 text-lime-400" />
            </div>
            Financial Routing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Global VAT Rate (%)</label>
              <input 
                type="number" step="0.01" 
                className="w-full px-4 py-4 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-lime-500 text-white outline-none font-black text-2xl transition-all" 
                value={formData.vatRate || 0} 
                onChange={(e) => setFormData({...formData, vatRate: parseFloat(e.target.value)})} 
              />
            </div>
            
            <div className="flex items-center justify-between p-5 rounded-xl border border-zinc-800 bg-zinc-950 h-full hover:border-lime-500/50 transition-colors">
              <div>
                <p className="font-black text-white uppercase tracking-tight flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-lime-400" /> Checkout Gateway
                </p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Toggle to freeze marketplace</p>
              </div>
              <button type="button" onClick={() => setFormData({...formData, allowManualPayments: !formData.allowManualPayments})} className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${formData.allowManualPayments ? 'bg-lime-400' : 'bg-zinc-700'}`}>
                <div className={`w-6 h-6 bg-black rounded-full shadow-sm transform transition-transform duration-300 ${formData.allowManualPayments ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Payment Methods */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-6 mb-8 relative z-10 gap-4">
            <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tight">
              <div className="w-10 h-10 bg-lime-400/10 border border-lime-400/20 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-lime-400" />
              </div>
              Escrow Accounts
            </h3>
            <button type="button" onClick={addPaymentMethod} className="bg-zinc-950 border border-zinc-800 text-lime-400 hover:bg-lime-400 hover:text-black px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(57,255,20,0.1)]">
              <Plus className="w-4 h-4" /> Add Payment Method
            </button>
          </div>

          <div className="space-y-8 relative z-10">
            {formData.paymentMethods?.map((method: any, index: number) => {
              const TypeIcon = PAYMENT_TYPES.find(pt => pt.id === method.type)?.icon || Wallet;

              return (
                <div key={index} className="p-6 border border-zinc-800 rounded-3xl bg-zinc-950 relative group hover:border-lime-500/30 transition-colors">
                  <button type="button" onClick={() => removePaymentMethod(index)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Payment Type</label>
                      <div className="relative">
                        <TypeIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-lime-400" />
                        <select 
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none font-bold text-sm focus:border-lime-500 appearance-none transition-all cursor-pointer" 
                          value={method.type} 
                          onChange={(e) => handleMethodChange(index, 'type', e.target.value)}
                        >
                          {PAYMENT_TYPES.map(pt => (
                            <option key={pt.id} value={pt.id}>{pt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Internal Ref Name</label>
                      <input type="text" placeholder="e.g. John Doe / Salex LLC" className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none font-bold text-sm focus:border-lime-500 transition-all placeholder-zinc-700" value={method.receiverName} onChange={(e) => handleMethodChange(index, 'receiverName', e.target.value)} />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3 text-lime-400"/> Escrow Timer</label>
                      <div className="relative">
                        <input type="number" className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none font-black text-lg focus:border-lime-500 transition-all" value={method.timerMinutes} onChange={(e) => handleMethodChange(index, 'timerMinutes', parseInt(e.target.value))} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-zinc-600 tracking-widest">Mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Network / Bank Name</label>
                      <input type="text" placeholder="e.g. Chase Bank, Polygon Network, PayPal" className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none font-bold text-sm focus:border-lime-500 transition-all placeholder-zinc-700" value={method.accountName} onChange={(e) => handleMethodChange(index, 'accountName', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-lime-400 uppercase tracking-widest mb-2">Address / Acct No. / Cashtag</label>
                      <input type="text" placeholder="Account Number, Wallet Address, or Email" className="w-full px-4 py-3.5 rounded-xl bg-lime-400/5 border border-lime-400/20 text-lime-400 outline-none font-mono font-bold text-sm focus:border-lime-400 transition-all placeholder-lime-400/30" value={method.accountNumber} onChange={(e) => handleMethodChange(index, 'accountNumber', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Buyer Instructions (Receipt Prompt)</label>
                    <textarea 
                      rows={2} 
                      placeholder="e.g. Please transfer the exact amount and upload a screenshot of your payment receipt."
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 outline-none font-medium text-sm focus:border-lime-500 transition-all placeholder-zinc-700 resize-none" 
                      value={method.instructions} 
                      onChange={(e) => handleMethodChange(index, 'instructions', e.target.value)} 
                    />
                  </div>
                </div>
              );
            })}
            
            {(!formData.paymentMethods || formData.paymentMethods.length === 0) && (
              <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950 text-zinc-500 font-black uppercase tracking-widest text-sm">
                No payment gateways configured.<br/>
                <span className="text-xs text-zinc-600 mt-2 block">Customers will not be able to checkout.</span>
              </div>
            )}
          </div>
        </div>

        {/* Save Button (Sticky) */}
        <div className="sticky bottom-8 z-50 mt-12">
          <button disabled={saving} type="submit" className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-lime-300 transition disabled:opacity-50 flex justify-center items-center gap-3 shadow-[0_0_30px_rgba(57,255,20,0.3)]">
            {saving ? 'Syncing Network...' : saved ? <><CheckCircle2 className="w-5 h-5"/> Configuration Synced</> : <><Save className="w-5 h-5"/> Deploy System Configuration</>}
          </button>
        </div>

      </form>
    </div>
  );
}