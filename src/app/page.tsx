"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Check, ShoppingCart, Users, Zap, Loader2, ArrowLeft, UserPlus, X, UserX, MessageCircle, Smartphone, RefreshCcw, Share2, ChevronDown, Star, Heart, Clock, ListChecks } from 'lucide-react';

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
        <div className="text-center mb-20 relative">
          {/* "Order Now" Circle Badge */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 bg-[#da291c] rounded-full flex flex-col items-center justify-center text-white absolute -top-2 right-4 sm:right-1/4 rotate-12 shadow-xl z-10 animate-bounce">
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
              className="bg-[#ffbc0d] hover:bg-[#ffc72d] text-[#376e4b] text-xl sm:text-2xl font-black py-4 px-10 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 hover:-translate-y-1"
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

        {/* Stats Section */}
        <div className="bg-[#ffbc0d] rounded-3xl p-8 sm:p-10 mb-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 left-10 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute bottom-8 right-20 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative z-10">
            <StatCard number="5K+" label="משתמשים פעילים" />
            <StatCard number="50K+" label="רשימות נשלחו" />
            <StatCard number="100%" label="חינם לנצח" />
            <StatCard number="4.9" label="דירוג משתמשים" icon={<Star size={20} className="fill-white" />} />
          </div>
        </div>

        {/* Invite Section */}
        <div className="bg-linear-to-br from-amber-50 to-orange-50 border-2 border-dashed border-[#ffbc0d] rounded-3xl p-6 sm:p-8 mb-20">
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

        {/* How It Works Section */}
        <div className="mb-20">
          <h2 className="text-4xl sm:text-5xl font-black text-center mb-4" style={{ fontFamily: 'var(--font-mc)' }}>
            איך זה עובד?
          </h2>
          <p className="text-center text-lg font-bold opacity-70 mb-12">
            שלושה צעדים פשוטים ואתם מסודרים
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              icon={<Smartphone size={36} />}
              title="נרשמים בשניות"
              description="רק מספר טלפון ושם - וזהו! לא צריך סיסמאות מסובכות או אימיילים."
            />
            <StepCard 
              number="2"
              icon={<Users size={36} />}
              title="מזמינים את המשפחה"
              description="מוסיפים את בני המשפחה בקליק. כולם רואים את אותה רשימה בזמן אמת."
            />
            <StepCard 
              number="3"
              icon={<MessageCircle size={36} />}
              title="שולחים בוואטסאפ"
              description="לפני שיוצאים לסופר - לחיצה אחת ורשימת הקניות אצלכם בוואטסאפ!"
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-4xl sm:text-5xl font-black text-center mb-4" style={{ fontFamily: 'var(--font-mc)' }}>
            למה דווקא אנחנו?
          </h2>
          <p className="text-center text-lg font-bold opacity-70 mb-12">
            הפיצ&#39;רים שיהפכו לכם את החיים לקלים יותר
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Users size={32} />}
              title="רשימה משותפת"
              description="כל המשפחה על אותה רשימה. מעדכנים בזמן אמת ורואים מה חסר."
              color="green"
            />
            <FeatureCard 
              icon={<Zap size={32} />}
              title="ממשק קיוסק"
              description="עיצוב מתקדם בסגנון קיוסק שמאפשר להוסיף מוצרים בשניות."
              color="yellow"
            />
            <FeatureCard 
              icon={<RefreshCcw size={32} />}
              title="סנכרון חכם"
              description="עובד גם כשאין קליטה, ומסתנכרן אוטומטית כשהאינטרנט חוזר."
              color="green"
            />
            <FeatureCard 
              icon={<Share2 size={32} />}
              title="שיתוף בקליק"
              description="שליחה ישירה לוואטסאפ או העתקה ללוח - מה שנוח לכם."
              color="yellow"
            />
            <FeatureCard 
              icon={<ListChecks size={32} />}
              title="קטגוריות חכמות"
              description="מוצרים מאורגנים לפי מחלקות - כמו בסופר האמיתי."
              color="green"
            />
            <FeatureCard 
              icon={<Clock size={32} />}
              title="היסטוריית רשימות"
              description="כל הרשימות שנשלחו שמורות. קל לחזור ולקנות שוב."
              color="yellow"
            />
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h2 className="text-4xl sm:text-5xl font-black text-center mb-4" style={{ fontFamily: 'var(--font-mc)' }}>
            מה אומרים עלינו?
          </h2>
          <p className="text-center text-lg font-bold opacity-70 mb-12">
            המשתמשים שלנו אוהבים אותנו
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard 
              text="סוף סוף אפליקציה שכל המשפחה מצליחה להשתמש בה! אפילו סבתא הצטרפה לרשימה."
              name="שירה כ."
              role="אמא לשלושה"
            />
            <TestimonialCard 
              text="השיתוף בוואטסאפ זה גאוני. לא צריך עוד להתקשר לשאול מה לקנות."
              name="יוסי מ."
              role="סטודנט"
            />
            <TestimonialCard 
              text="העיצוב פשוט מהמם! נראה כמו אפליקציית פרימיום אבל חינם לגמרי."
              name="רונית ל."
              role="מעצבת"
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-4xl sm:text-5xl font-black text-center mb-4" style={{ fontFamily: 'var(--font-mc)' }}>
            שאלות נפוצות
          </h2>
          <p className="text-center text-lg font-bold opacity-70 mb-12">
            כל מה שרציתם לדעת
          </p>
          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem 
              question="האם האפליקציה באמת חינמית?"
              answer="כן! האפליקציה חינמית לגמרי ותישאר כזו. אין מנויים, אין פרסומות מעצבנות, ואין הפתעות."
            />
            <FAQItem 
              question="איך מזמינים בני משפחה?"
              answer="נכנסים להגדרות, מוסיפים את מספר הטלפון של בן המשפחה, והוא יקבל הזמנה להצטרף לרשימה המשותפת."
            />
            <FAQItem 
              question="האם אפשר להשתמש בלי אינטרנט?"
              answer="בהחלט! יש מצב אופליין שמאפשר לעבוד גם ללא חיבור. כשהאינטרנט חוזר - הכל מסתנכרן אוטומטית."
            />
            <FAQItem 
              question="איך השיתוף בוואטסאפ עובד?"
              answer="לוחצים על כפתור השיתוף, בוחרים וואטסאפ, והרשימה נשלחת מעוצבת יפה עם כל המוצרים והכמויות."
            />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-[#376e4b] text-white rounded-3xl p-10 sm:p-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 right-10 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute bottom-4 left-20 w-40 h-40 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <Heart size={48} className="mx-auto mb-4 text-[#ffbc0d]" />
            <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-mc)' }}>
              מוכנים לקניה הבאה?
            </h2>
            <p className="text-lg sm:text-xl font-bold opacity-80 mb-8 max-w-lg mx-auto">
              הצטרפו לאלפי משפחות שכבר מנהלות את הקניות בצורה חכמה יותר
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[#ffbc0d] hover:bg-[#ffc72d] text-[#376e4b] text-lg sm:text-xl font-black py-5 px-12 rounded-full shadow-lg transition-all active:scale-95 hover:-translate-y-1"
              style={{ fontFamily: 'var(--font-mc)' }}
            >
              הרשמה חינם - בואו נתחיל!
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#376e4b] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ffbc0d] rounded-xl flex items-center justify-center">
                <ShoppingCart size={20} className="text-[#376e4b]" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black" style={{ fontFamily: 'var(--font-mc)' }}>
                רשימת קניות
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm font-bold opacity-80">
              <span>מוצר ישראלי 🇮🇱</span>
              <span>•</span>
              <span>חינם לנצח</span>
              <span>•</span>
              <span>פרטיות מוגנת</span>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm opacity-60">
            <p>© 2026 רשימת קניות. כל הזכויות שמורות.</p>
            <p>נבנה באהבה למשפחות ישראליות</p>
          </div>
        </div>
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

function FeatureCard({ icon, title, description, color = "green" }: { icon: React.ReactNode, title: string, description: string, color?: "green" | "yellow" }) {
  return (
    <div className={`p-6 sm:p-8 rounded-2xl text-center transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg ${
      color === "yellow" ? "bg-[#fff9e6] hover:bg-[#ffbc0d]/20" : "bg-[#f0f7f2] hover:bg-[#376e4b]/10"
    }`}>
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform ${
        color === "yellow" ? "bg-[#ffbc0d] text-[#376e4b]" : "bg-[#376e4b] text-white"
      }`}>
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-black mb-2 text-[#376e4b]">{title}</h3>
      <p className="font-medium opacity-80 leading-relaxed text-sm sm:text-base text-[#376e4b]">{description}</p>
    </div>
  );
}

function StepCard({ number, icon, title, description }: { number: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="relative text-center">
      {/* Step Number Badge */}
      <div className="absolute -top-4 right-1/2 translate-x-1/2 w-10 h-10 bg-[#da291c] rounded-full flex items-center justify-center text-white font-black text-xl z-10 shadow-lg" style={{ fontFamily: 'var(--font-mc)' }}>
        {number}
      </div>
      <div className="bg-[#ffbc0d] rounded-3xl p-8 pt-10 h-full">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md text-[#376e4b]">
          {icon}
        </div>
        <h3 className="text-2xl font-black mb-3 text-[#376e4b]" style={{ fontFamily: 'var(--font-mc)' }}>{title}</h3>
        <p className="font-bold text-[#376e4b]/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ number, label, icon }: { number: string, label: string, icon?: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl font-black text-[#376e4b] flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-mc)' }}>
        {number}
        {icon}
      </div>
      <p className="font-bold text-[#376e4b]/80 mt-1">{label}</p>
    </div>
  );
}

function TestimonialCard({ text, name, role }: { text: string, name: string, role: string }) {
  return (
    <div className="bg-white border-2 border-[#376e4b]/10 rounded-2xl p-6 hover:border-[#ffbc0d] transition-colors">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={18} className="fill-[#ffbc0d] text-[#ffbc0d]" />
        ))}
      </div>
      <p className="text-[#376e4b] font-medium mb-4 leading-relaxed">&quot;{text}&quot;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#376e4b] rounded-full flex items-center justify-center text-white font-black">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-black text-[#376e4b]">{name}</p>
          <p className="text-sm text-[#376e4b]/60 font-medium">{role}</p>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-2 border-[#376e4b]/10 rounded-2xl overflow-hidden hover:border-[#ffbc0d] transition-colors">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-right"
      >
        <span className="font-black text-lg text-[#376e4b]">{question}</span>
        <ChevronDown size={24} className={`text-[#376e4b] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-[#376e4b]/80 font-medium leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
