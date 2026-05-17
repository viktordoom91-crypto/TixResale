// app/admin/events/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, MapPin, Tag, Image as ImageIcon, Flame, ArrowLeft, Bot, UploadCloud, FileImage } from 'lucide-react';
import Link from 'next/link';

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state for the actual image file
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Form State (imageUrl is now handled automatically)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    city: '',
    basePrice: '',
    isFeatured: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = "";

      // 1. If an image is selected, upload it to Cloudinary first
      if (imageFile) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          throw new Error("Cloudinary environment variables are missing.");
        }

        const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        uploadData.append('upload_preset', uploadPreset);

        const cloudinaryRes = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: uploadData,
        });

        const cloudinaryJson = await cloudinaryRes.json();
        
        if (!cloudinaryRes.ok || !cloudinaryJson.secure_url) {
          throw new Error("Failed to upload image to Cloudinary.");
        }

        finalImageUrl = cloudinaryJson.secure_url;
      }

      // 2. Send the Event Data + the new Cloudinary URL to our Database
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          imageUrl: finalImageUrl // Inject the uploaded image URL here
        }),
      });

      if (res.ok) {
        alert("Event created! Algorithmic Ticket Batches have been instantly generated.");
        router.push('/admin/events'); 
      } else {
        throw new Error("Failed to create event in database.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while publishing the event. Please check your image and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/events" className="flex items-center text-sm font-bold text-gray-500 hover:text-black transition mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
        </Link>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Create Manual Event</h1>
        <p className="text-gray-500 font-medium mt-2 flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-500" />
          The system will automatically assign algorithmic bot sellers to hold ticket batches for this event.
        </p>
      </div>

      {/* The Form */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        
        {/* Title & Description */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Event Title</label>
            <input required type="text" placeholder="e.g., Underground Summer Rave 2026" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description / Venue</label>
            <input required type="text" placeholder="e.g., Main Stage at The Warehouse" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><CalendarDays className="w-4 h-4"/> Date</label>
            <input required type="date" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><MapPin className="w-4 h-4"/> City</label>
            <input required type="text" placeholder="e.g., London" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Tag className="w-4 h-4"/> Base Price (₦)</label>
            <input required type="number" placeholder="e.g., 25000" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all" value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: e.target.value})} />
          </div>
        </div>

        {/* File Upload Section instead of Text URL */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4"/> Event Cover Image
          </label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition hover:border-indigo-400 group overflow-hidden relative">
            
            {/* Show a preview if they selected an image */}
            {imageFile ? (
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Preview" 
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <FileImage className="w-10 h-10 text-indigo-600 drop-shadow-md mb-2" />
                  <p className="text-sm font-black text-indigo-900 drop-shadow-md bg-white/80 px-3 py-1 rounded-full truncate max-w-[80%]">
                    {imageFile.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 text-gray-400 mb-3 group-hover:text-indigo-500 transition" />
                <p className="text-sm font-bold text-gray-600 mb-1">Click to upload image</p>
                <p className="text-xs font-medium text-gray-400">PNG, JPG, WEBP up to 5MB</p>
              </div>
            )}
            
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        </div>

        {/* Featured Toggle */}
        <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 bg-gray-50">
          <div>
            <p className="font-bold text-gray-900 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Mark as Featured</p>
            <p className="text-sm text-gray-500 font-medium">This will pin the event to the top carousel on the homepage.</p>
          </div>
          <button 
            type="button"
            onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${formData.isFeatured ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${formData.isFeatured ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Submit */}
        <button disabled={isSubmitting} type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black text-lg hover:bg-gray-800 transition disabled:opacity-50">
          {isSubmitting ? 'Uploading Image & Generating Event...' : 'Publish Event'}
        </button>

      </form>
    </div>
  );
}