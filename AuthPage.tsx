
import React, { useState } from 'react';
import { useApp } from '../App';
import { UserRole } from '../types';

const AUTH_BG = "https://www.virtual-japan.com/wp-content/uploads/2021/03/kawazu-sakura-cherry-blossom-festival-1.jpg";

const AuthPage: React.FC = () => {
  const { state, login, signup } = useApp();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [houseNumber, setHouseNumber] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const formattedHouse = houseNumber.trim().toUpperCase();

    if (activeTab === 'login') {
      const result = login(formattedHouse, password);
      if (!result.success) {
        setError(result.message || 'Login failed');
      }
    } else {
      const existingUser = state.users.find(u => u.houseNumber === formattedHouse);
      if (existingUser) {
        setError('This House is already registered. Please login.');
        return;
      }
      if (phone.length !== 11) {
        setError('Phone number must be 11 digits.');
        return;
      }
      if (password.length < 3) {
        setError('Please set a secure PIN (min 3 chars).');
        return;
      }
      signup(formattedHouse, phone, UserRole.RESIDENT, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-900">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
        style={{ backgroundImage: `url(${AUTH_BG})` }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      <div className="w-full max-w-[420px] z-10">
        {/* Glassmorphic Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/50 relative">
          
          {/* Header Area */}
          <div className="pt-12 pb-8 px-8 text-center relative">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl mx-auto mb-4 shadow-lg shadow-pink-500/30 flex items-center justify-center text-white">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-1">
              Society Hub
            </h1>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">
              Community Living Redefined
            </p>
          </div>

          {/* Segmented Tabs */}
          <div className="px-8 mb-8">
            <div className="bg-white/50 p-1.5 rounded-2xl flex relative shadow-inner">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setPassword(''); }}
                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${activeTab === 'login' ? 'text-indigo-600 shadow-lg bg-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); setPassword(''); }}
                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${activeTab === 'register' ? 'text-pink-600 shadow-lg bg-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Join
              </button>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
            
            <div className="space-y-4">
              {/* House ID Field */}
              <div className="group">
                <label className="block ml-4 mb-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">
                  {activeTab === 'login' ? 'House ID / Admin ID' : 'Your House Number'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value.toUpperCase())}
                    placeholder={activeTab === 'login' ? "e.g. A-101 or SA01" : "e.g. A-101"}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-gray-900 transition-all placeholder-gray-400 text-sm shadow-sm"
                  />
                </div>
              </div>

              {/* Password/PIN Field */}
              <div className="group">
                <label className="block ml-4 mb-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">
                  {activeTab === 'login' ? 'Password / PIN' : 'Create Login PIN'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-gray-900 transition-all placeholder-gray-400 text-sm shadow-sm"
                  />
                </div>
                {activeTab === 'login' && (
                  <div className="flex justify-end mt-1 pr-2">
                    <button type="button" onClick={() => setShowForgotInfo(true)} className="text-[10px] text-gray-500 hover:text-indigo-600 font-bold uppercase tracking-wider transition-colors">
                      Forgot PIN?
                    </button>
                  </div>
                )}
              </div>

              {/* Phone Field (Register Only) */}
              {activeTab === 'register' && (
                <div className="group animate-in slide-in-from-top-4 fade-in duration-300">
                  <label className="block ml-4 mb-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest group-focus-within:text-pink-600 transition-colors">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="03XXXXXXXXX"
                      className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-100 outline-none font-bold text-gray-900 transition-all placeholder-gray-400 text-sm shadow-sm"
                    />
                  </div>
                  <div className="flex justify-end mt-1 px-2">
                    <span className={`text-[9px] font-bold transition-colors ${phone.length === 11 ? 'text-green-600' : 'text-gray-400'}`}>{phone.length}/11 Digits</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm p-4 rounded-2xl border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-[10px] font-bold text-red-600 uppercase leading-relaxed tracking-wide pt-0.5">{error}</p>
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="submit"
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transform transition-all hover:scale-[1.02] active:scale-95 text-xs ${
                activeTab === 'login' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:shadow-indigo-500/30' 
                  : 'bg-gradient-to-r from-pink-600 to-rose-500 text-white hover:shadow-pink-500/30'
              }`}
            >
              {activeTab === 'login' ? 'Authenticate' : 'Create Account'}
            </button>
          </form>

        </div>
        
        <p className="text-center text-white/80 text-[9px] font-bold uppercase tracking-[0.3em] mt-8 drop-shadow-md">
          Secure Community Management System
        </p>
      </div>

      {/* Forgot PIN Info Modal */}
      {showForgotInfo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600 shadow-lg shadow-amber-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-4">Password Recovery</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-8 px-2">
                For security reasons, this system does not use email for resets.
                <br/><br/>
                Please visit the <strong>Society Admin Office</strong> or contact the Super Admin to request a PIN reset. They will reset it to the default code.
              </p>
              <button 
                onClick={() => setShowForgotInfo(false)}
                className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold uppercase text-xs hover:bg-gray-200 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
