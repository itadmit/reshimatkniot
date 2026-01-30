"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Check, ShoppingCart, Users, Zap, Loader2, ArrowLeft, UserPlus, X, UserX } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading, login, wasKicked, clearKicked, families } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showKickedModal, setShowKickedModal] = useState(false);

  // Show kicked modal if user was removed from family
  useEffect(() => {
    if (wasKicked) {
      setShowKickedModal(true);
    }
  }, [wasKicked]);

  const handleCloseKickedModal = () => {
    setShowKickedModal(false);
    clearKicked();
  };

  // Redirect to list if user is logged in AND has families
  useEffect(() => {
    if (!isLoading && user && !wasKicked && families.length > 0) {
      setIsRedirecting(true);
      router.replace('/list');
    }
  }, [user, isLoading, router, wasKicked, families]);

  // Handle invite quick login - first check if phone has invitations
  const handleInviteLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone.trim()) return;
    
    setInviteLoading(true);
    setInviteError('');
    
    try {
      // First check if this phone has any invitations
      const checkRes = await fetch('/api/auth/check-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: invitePhone })
      });
      
      const checkData = await checkRes.json();
      
      if (!checkData.hasInvite) {
        setInviteError(checkData.error || 'לא נמצאו הזמנות עבור מספר זה');
        return;
      }
      
      // User has invitations - proceed with login
      const result = await login(invitePhone);
      if (result.success) {
        // Save to sessionStorage BEFORE navigation
        sessionStorage.setItem('showWelcomeModal', 'true');
        router.push('/list');
      } else {
        setInviteError(result.error || 'שגיאה בהתחברות');
      }
    } catch {
      setInviteError('שגיאה בהתחברות');
    } finally {
      setInviteLoading(false);
    }
  };

  // Show loading state while checking auth or redirecting
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-[#ffbc0d] mx-auto mb-4" />
          <p className="text-[#376e4b] font-bold text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#376e4b] overflow-x-hidden">
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#ffbc0d] rounded-xl flex items-center justify-center shadow-sm">
            <ShoppingCart size={24} className="text-[#376e4b]" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black hidden sm:block" style={{ fontFamily: 'var(--font-mc)' }}>
            רשימת קניות
          </span>
        </div>
        <button 
          onClick={() => router.push('/login')}
          className="bg-[#376e4b] text-white font-black text-lg px-6 py-3 rounded-full hover:bg-[#2d5a3d] transition-colors"
        >
          התחברות
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          {/* "Order Now" Circle Badge */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 bg-[#da291c] rounded-full flex flex-col items-center justify-center text-white absolute -top-2 right-4 sm:right-1/4 rotate-12 shadow-xl z-10 animate-pulse">
            <span className="text-2xl sm:text-3xl font-black leading-none" style={{ fontFamily: 'var(--font-mc)' }}>List</span>
            <span className="text-2xl sm:text-3xl font-black leading-none" style={{ fontFamily: 'var(--font-mc)' }}>Now</span>
            <div className="flex gap-1 mt-1">
               <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
               <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
               <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
               <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
               <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-6 tracking-tight leading-[0.95]" style={{ fontFamily: 'var(--font-mc)' }}>
            מסדרים<br/>את המקרר<br/><span className="text-[#ffbc0d] text-stroke-green">בקליק!</span>
          </h1>
          
          <p className="text-lg sm:text-xl font-bold mb-8 max-w-lg mx-auto opacity-90">
            האפליקציה החכמה לניהול רשימות קניות משותפות.
            <br/>פשוט, מהיר, וטעים.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/login')}
              className="bg-[#ffbc0d] hover:bg-[#ffc72d] text-[#376e4b] text-xl sm:text-2xl font-black py-4 px-10 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
              style={{ fontFamily: 'var(--font-mc)' }}
            >
              בא לי להתחיל!
            </button>
            <button
              onClick={() => router.push('/list')}
              className="text-[#376e4b] font-bold underline decoration-2 underline-offset-4 hover:opacity-70 transition-opacity"
            >
              המשך במצב אופליין →
            </button>
          </div>
        </div>

        {/* Invite Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-[#ffbc0d] rounded-3xl p-6 sm:p-8 mb-16">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-12 h-12 bg-[#ffbc0d] rounded-full flex items-center justify-center">
              <UserPlus size={24} className="text-[#376e4b]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#376e4b]" style={{ fontFamily: 'var(--font-mc)' }}>
              הוזמנת לקבוצה?
            </h2>
          </div>
          <p className="text-center text-[#376e4b] font-bold mb-6 opacity-80">
            הזן את מספר הטלפון שלך ונעביר אותך במהירות לרשימה המשותפת
          </p>
          <form onSubmit={handleInviteLogin} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="מספר הטלפון שלך"
                className="flex-1 px-5 py-4 border-2 border-[#376e4b]/20 rounded-full text-lg font-bold text-center placeholder:text-gray-400 focus:border-[#ffbc0d] focus:ring-2 focus:ring-[#ffbc0d]/30 outline-none transition-all bg-white"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={inviteLoading || !invitePhone.trim()}
                className="bg-[#376e4b] hover:bg-[#2d5a3d] text-white font-black py-4 px-8 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {inviteLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>כניסה</span>
                    <ArrowLeft size={18} />
                  </>
                )}
              </button>
            </div>
            {inviteError && (
              <p className="text-red-600 text-center font-bold text-sm mt-3 bg-red-50 py-2 rounded-lg">
                {inviteError}
              </p>
            )}
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <FeatureCard 
            icon={<Users size={32} />}
            title="רשימה משותפת"
            description="כל המשפחה על אותה רשימה. מעדכנים בזמן אמת ורואים מה חסר."
          />
          <FeatureCard 
            icon={<Zap size={32} />}
            title="ממשק מהיר"
            description="עיצוב קיוסק מתקדם שמאפשר להוסיף מוצרים בשניות."
          />
          <FeatureCard 
            icon={<Check size={32} />}
            title="סנכרון חכם"
            description="עובד גם כשאין קליטה, ומסתנכרן כשהאינטרנט חוזר."
          />
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-[#376e4b] text-white rounded-3xl p-10 sm:p-12 relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-black mb-6 relative z-10" style={{ fontFamily: 'var(--font-mc)' }}>
            מוכנים לקניה הבאה?
          </h2>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-[#376e4b] hover:bg-gray-100 text-lg sm:text-xl font-black py-4 px-10 rounded-full shadow-lg transition-transform active:scale-95 relative z-10"
          >
            הרשמה חינם
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f5f5] py-6 text-center text-sm font-bold opacity-60">
        <p>© 2026 רשימת קניות. כל הזכויות שמורות.</p>
      </footer>

      {/* Kicked from Family Modal */}
      {showKickedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseKickedModal}
          />
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={handleCloseKickedModal}
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>

            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserX size={40} className="text-red-500" />
            </div>

            {/* Content */}
            <h2 className="text-3xl font-black text-[#376e4b] mb-3" style={{ fontFamily: 'var(--font-mc)' }}>
              אופס!
            </h2>
            <p className="text-lg font-bold text-gray-600 mb-6">
              הוסרת מהקבוצה על ידי מנהל הקבוצה.
              <br />
              אפשר להצטרף לקבוצה אחרת או להתחיל חדשה!
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleCloseKickedModal();
                  router.push('/login');
                }}
                className="w-full bg-[#ffbc0d] hover:bg-[#ffc72d] text-[#376e4b] font-black text-lg py-4 rounded-full transition-all active:scale-95"
                style={{ fontFamily: 'var(--font-mc)' }}
              >
                התחברות מחדש
              </button>
              <button
                onClick={handleCloseKickedModal}
                className="w-full text-gray-500 font-bold py-2 hover:text-[#376e4b] transition-colors"
              >
                המשך לגלוש
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-[#f9f9f9] p-6 sm:p-8 rounded-2xl text-center hover:bg-[#fff9e6] transition-colors duration-300 group">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform text-[#376e4b]">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-black mb-2">{title}</h3>
      <p className="font-medium opacity-80 leading-relaxed text-sm sm:text-base">{description}</p>
    </div>
  );
}
