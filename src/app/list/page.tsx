"use client";

import { useStore } from "@/store/useStore";
import { useAuth } from "@/lib/auth-context";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { Moon, Sun, Package, Star, ShoppingCart, ChevronLeft, ChevronRight, X, Users, Sparkles, ListChecks, Send } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ListPage() {
  const { categories, settings, updateSettings, getFrequentProducts } = useStore();
  const { currentFamily, user } = useAuth();
  const searchParams = useSearchParams();
  const frequentProducts = getFrequentProducts(12);
  
  // Welcome modal state (for invited users)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Check for welcome param - save to sessionStorage if found
  useEffect(() => {
    const param = searchParams.get('welcome');
    if (param === 'true') {
      sessionStorage.setItem('showWelcomeModal', 'true');
      window.history.replaceState({}, '', '/list');
    }
  }, [searchParams]);
  
  // Show modal when family is loaded and sessionStorage flag exists
  useEffect(() => {
    const shouldShow = sessionStorage.getItem('showWelcomeModal');
    if (currentFamily && shouldShow === 'true') {
      setShowWelcomeModal(true);
      sessionStorage.removeItem('showWelcomeModal');
    }
  }, [currentFamily]);
  
  // Slider state
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [frequentProducts]);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.8;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header with gradient background - full width */}
      <div className={`shrink-0 w-full ${!settings.darkMode ? 'bg-linear-to-b from-amber-100/80 to-transparent' : ''}`}>
        <header className="flex items-center gap-3 py-3 px-4 max-w-7xl mx-auto w-full">
          {/* Logo - right side */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 bg-[#ffbc0d] rounded-xl flex items-center justify-center shadow-md">
               <ShoppingCart size={24} strokeWidth={2.5} className="text-[#376e4b]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight text-[#376e4b]" style={{ fontFamily: 'var(--font-mc)' }}>רשימת קניות</h1>
              <p className="text-sm font-bold text-[#376e4b]/70">
                {user ? `${user.name}, מה חסר לנו?` : 'מה חסר לנו?'}
              </p>
            </div>
          </div>
          
          {/* Search in center */}
          <div className="flex-1 max-w-2xl mx-auto">
            <SearchBar placeholder="חפש מוצר..." />
          </div>
          
          {/* Family badge - left side, before dark mode */}
          {currentFamily && (
            <div className="hidden md:flex items-center gap-2 bg-[#376e4b] px-3 py-1.5 rounded-full shadow-sm shrink-0">
              <Users size={14} className="text-white" />
              <span className="text-sm font-black text-white">{currentFamily.name}</span>
            </div>
          )}
          
          {/* Dark mode button - far left */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground transition-all duration-200 shrink-0"
            aria-label={settings.darkMode ? "מצב יום" : "מצב לילה"}
          >
            {settings.darkMode ? <Sun size={22} strokeWidth={2.5} /> : <Moon size={22} strokeWidth={2.5} />}
          </button>
        </header>
      </div>

      {/* Main content - scrollable only if needed */}
      <div className="flex-1 overflow-auto space-y-4 pt-4 px-4 max-w-7xl mx-auto w-full">
        {/* Frequent Products Section - Slider */}
        {frequentProducts.length > 0 && (
          <section className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-amber-500" size={20} fill="currentColor" />
              <h2 className="text-lg font-black text-foreground">תדירים</h2>
            </div>
            
            {/* Slider Container */}
            <div className="relative group">
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => scroll('left')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="הקודם"
                >
                  <ChevronRight size={24} strokeWidth={3} />
                </button>
              )}
              
              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={() => scroll('right')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label="הבא"
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
              )}
              
              {/* Products Slider */}
              <div 
                ref={sliderRef}
                onScroll={checkScroll}
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {frequentProducts.map((product) => (
                  <div key={product.id} className="shrink-0 w-[calc((100%-60px)/6)] min-w-[140px]">
                    <ProductCard
                      product={product}
                      colorIndex={0}
                      compactBadge
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <section>
            <h2 className="text-lg font-black text-foreground mb-2">קטגוריות</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} colorIndex={index} />
              ))}
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="p-6 bg-secondary rounded-full">
              <Package size={48} className="text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-foreground">
                אין קטגוריות
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                התפריט ריק. הוסף קטגוריות דרך הניהול.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Welcome to Family Modal */}
      {showWelcomeModal && currentFamily && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-white/80 backdrop-blur-sm"
            onClick={() => setShowWelcomeModal(false)}
          />
          <div className="relative bg-[#ffbc0d] rounded-3xl p-8 shadow-2xl max-w-md w-full text-center animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 left-4 p-2 rounded-full bg-[#376e4b]/10 hover:bg-[#376e4b]/20 transition-colors"
            >
              <X size={20} className="text-[#376e4b]" />
            </button>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#376e4b] text-white px-4 py-2 rounded-full mb-6">
              <Users size={18} />
              <span className="font-black">{currentFamily.name}</span>
            </div>

            {/* Main heading */}
            <h2 className="text-4xl font-black text-[#376e4b] mb-2" style={{ fontFamily: 'var(--font-mc)' }}>
              שלום, {user?.name || 'חבר'}!
            </h2>
            <p className="text-lg font-bold text-[#376e4b]/80 mb-8">
              הצטרפת לרשימה המשותפת בהצלחה 🎉
            </p>

            {/* Steps */}
            <div className="space-y-4 text-right mb-8">
              <div className="flex items-center gap-4 bg-white rounded-2xl p-4">
                <div className="w-10 h-10 bg-[#da291c] text-white rounded-full flex items-center justify-center font-black text-lg shrink-0">
                  1
                </div>
                <div>
                  <p className="font-black text-[#376e4b]">בחר מוצרים</p>
                  <p className="text-sm text-[#376e4b]/70 font-bold">לחץ על מוצר כדי להוסיף לרשימה</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white rounded-2xl p-4">
                <div className="w-10 h-10 bg-[#da291c] text-white rounded-full flex items-center justify-center font-black text-lg shrink-0">
                  2
                </div>
                <div>
                  <p className="font-black text-[#376e4b]">סמן מה קנית</p>
                  <p className="text-sm text-[#376e4b]/70 font-bold">הרשימה מתעדכנת לכולם</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white rounded-2xl p-4">
                <div className="w-10 h-10 bg-[#da291c] text-white rounded-full flex items-center justify-center font-black text-lg shrink-0">
                  3
                </div>
                <div>
                  <p className="font-black text-[#376e4b]">שתף בוואטסאפ</p>
                  <p className="text-sm text-[#376e4b]/70 font-bold">שלח את הרשימה בקליק</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full bg-[#376e4b] hover:bg-[#1d3d27] text-white font-black text-xl py-4 rounded-full transition-all active:scale-95 shadow-lg"
              style={{ fontFamily: 'var(--font-mc)' }}
            >
              יאללה, בואו נתחיל!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
