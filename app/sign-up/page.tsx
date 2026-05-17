import React from 'react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-gray-900">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">
              Sign up to Salex to continue
            </h2>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-8">
            <button className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-full shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              {/* Simple Google G SVG */}
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-full shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              <svg className="h-5 w-5 mr-2 fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.33-.85 3.73-.72 1.58.11 2.83.74 3.6 1.88-3.13 1.92-2.61 6.04.44 7.28-.7 1.69-1.55 3.3-2.85 3.73zm-2.03-14.8c.84-1.12 1.25-2.48 1.08-3.83-1.2.06-2.58.82-3.41 1.95-.69.93-1.2 2.25-1 3.55 1.34.1 2.51-.55 3.33-1.67z"/></svg>
              Continue with Apple
            </button>
            <button className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-full shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              <svg className="h-5 w-5 mr-2 text-[#1877F2] fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 font-medium tracking-widest uppercase text-xs">Or</span>
            </div>
          </div>

          {/* Standard Form */}
          <form className="space-y-5" action="#" method="POST">
            
            <div>
              <label htmlFor="firstName" className="block text-sm font-bold text-gray-900 mb-1">First name</label>
              <input id="firstName" name="firstName" type="text" required 
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition" 
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-bold text-gray-900 mb-1">Last name</label>
              <input id="lastName" name="lastName" type="text" required 
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition" 
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-1">Email</label>
              <input id="email" name="email" type="email" required 
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition" 
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-1">Password</label>
              <div className="relative">
                <input id="password" name="password" type="password" required 
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition" 
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-1">Phone number</label>
              <div className="flex gap-2">
                <div className="relative w-28">
                  <select id="countryCode" name="countryCode" className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition cursor-pointer">
                    <option>AU (+61)</option>
                    <option>US (+1)</option>
                    <option>UK (+44)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <input id="phone" name="phone" type="tel" required 
                  className="appearance-none flex-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition" 
                />
              </div>
            </div>

            {/* Newsletter Checkbox */}
            <div className="flex items-start mt-6">
              <div className="flex items-center h-5">
                <input id="newsletter" name="newsletter" type="checkbox" 
                  className="focus:ring-pink-500 h-4 w-4 text-pink-600 border-gray-300 rounded cursor-pointer" 
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="newsletter" className="text-gray-600 cursor-pointer">
                  Sign up to our monthly gig guide to discover the top events in your city.
                </label>
              </div>
            </div>

            {/* Terms Agreement */}
            <p className="text-sm text-gray-600 mt-6">
              By continuing, you agree to <a href="#" className="underline hover:text-gray-900">Salex's terms & conditions</a> and <a href="#" className="underline hover:text-gray-900">privacy policy</a>.
            </p>

            {/* Submit Button */}
            <div className="pt-2">
              <button type="submit" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition">
                Create your account
              </button>
            </div>

          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Remembered your account details? <a href="#" className="text-[#ff4e00] hover:underline font-medium">Log in</a>
          </div>

        </div>
      </div>
    </div>
  );
}