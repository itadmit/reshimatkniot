"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/store/useStore';
import { ShoppingCart, ArrowLeft, Loader2, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const { loadSeedData } = useStore();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInvited, setIsInvited] = useState(false);

  // Check for invite params in URL
  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    const invitedParam = searchParams.get('invited');
    
    if (phoneParam) {
      setPhone(phoneParam);
    }
    if (invitedParam === 'true') {
      setIsInvited(true);
      setMode('register');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(phone);
        if (result.success) {
          // אם מגיע דרך הזמנה - הצג מודל ברוך הבא
          router.push(isInvited ? '/list?welcome=true' : '/list');
        } else if (result.needsRegister) {
          setMode('register');
          setError('');
        } else {
          setError(result.error || 'שגיאה בהתחברות');
        }
      } else {
        if (!name.trim()) {
          setError('נא להזין שם');
          setIsLoading(false);
          return;
        }
        const result = await register(phone, name);
        if (result.success) {
          if (result.wasInvited) {
            // משתמש שהוזמן - לא צריך seed, יש לו כבר קבוצה עם נתונים
            router.push('/list?welcome=true');
          } else {
            // משתמש חדש לגמרי - טען נתוני ברירת מחדל
            await loadSeedData();
            router.push('/list?welcome=true');
          }
        } else {
          setError(result.error || 'שגיאה בהרשמה');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-[#376e4b]">
      {/* Top Illustration Area */}
      <div className="mb-8 relative">
        <div className={`w-24 h-24 ${isInvited ? 'bg-[#376e4b]' : 'bg-[#ffbc0d]'} rounded-2xl flex items-center justify-center shadow-lg mx-auto`}>
           {isInvited ? (
             <UserPlus size={48} className="text-white" strokeWidth={2} />
           ) : (
             <ShoppingCart size={48} className="text-[#376e4b]" strokeWidth={2} />
           )}
        </div>
      </div>

      {/* Main Heading */}
      <h1 className="text-5xl font-black text-center mb-2 tracking-tight" style={{ fontFamily: 'var(--font-mc)' }}>
        {isInvited ? 'הוזמנת!' : (mode === 'login' ? 'מתחילים?' : 'מצטרפים?')}
      </h1>
      
      <p className="text-lg font-bold text-center mb-8 opacity-90">
        {isInvited 
          ? 'רק עוד צעד קטן והרשימה המשותפת שלך מוכנה!' 
          : 'התחברות או הרשמה בקלות ובמהירות :)'
        }
      </p>

      {/* Form Container */}
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Phone Input */}
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="מספר טלפון (חובה)"
              className="w-full px-6 py-4 border border-[#376e4b]/30 rounded-full text-lg font-bold text-center placeholder:text-gray-400 focus:border-[#376e4b] focus:ring-1 focus:ring-[#376e4b] outline-none transition-all bg-white"
              dir="ltr"
              required
            />
          </div>

          {/* Name Input (Register Mode) */}
          {mode === 'register' && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="איך קוראים לך?"
                className="w-full px-6 py-4 border border-[#376e4b]/30 rounded-full text-lg font-bold text-center placeholder:text-gray-400 focus:border-[#376e4b] focus:ring-1 focus:ring-[#376e4b] outline-none transition-all bg-white"
                required
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-center font-bold text-sm bg-red-50 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Main Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#ffbc0d] hover:bg-[#ffc72d] text-[#376e4b] text-xl font-black py-4 rounded-full shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4"
            style={{ fontFamily: 'var(--font-mc)' }}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <span>{mode === 'login' ? 'הרשמה / התחברות' : 'סיום הרשמה'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-[#376e4b] font-bold underline decoration-2 underline-offset-4 hover:opacity-80 transition-opacity"
          >
            {mode === 'login' ? 'אין לך עדיין חשבון? הירשם כאן' : 'יש לך כבר חשבון? התחבר כאן'}
          </button>
        </div>

        {/* Offline Mode Link */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-[#376e4b] font-bold text-sm transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <span>המשך במצב אופליין</span>
            <ArrowLeft size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
