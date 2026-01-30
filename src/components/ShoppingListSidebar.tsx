"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { ShoppingListItem } from "./ShoppingListItem";
import { 
  ChevronRight, 
  ChevronLeft, 
  ShoppingCart, 
  Share2, 
  Trash2,
  Receipt,
  Send,
  X,
  Loader2,
  MessageCircle,
  RefreshCw
} from "lucide-react";
import { sendListViaApi } from "@/lib/whatsapp";
import * as db from "@/lib/db";
import type { ListHistoryItem } from "@/lib/types";

interface ShoppingListSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ShoppingListSidebar({ isOpen, onToggle }: ShoppingListSidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { getListItemsGrouped, clearList, listItems, settings, showToast, syncFromServer } = useStore();
  const groupedItems = getListItemsGrouped();
  const totalItems = listItems.length;

  // WhatsApp modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(settings.whatsappDefaultPhone || "");
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleShare = () => {
    setPhoneNumber(settings.whatsappDefaultPhone || "");
    setShowShareModal(true);
  };

  // Save list to history (both local and server)
  const saveToHistory = async (sentTo?: string) => {
    // Prepare items for history
    const historyItems: ListHistoryItem[] = groupedItems.flatMap(group => 
      group.items.map(item => ({
        productName: item.product.name,
        categoryName: item.category.name,
        qty: item.qty,
        note: item.note
      }))
    );

    if (settings.appMode === 'family') {
      // Save to server
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: historyItems,
            totalItems: totalItems,
            sentTo: sentTo
          })
        });
      } catch (error) {
        console.error('Failed to save history to server:', error);
      }
    } else {
      // Save to local DB
      try {
        await db.addListHistory({
          items: historyItems,
          totalItems: totalItems,
          sentTo: sentTo,
          sentAt: new Date()
        });
      } catch (error) {
        console.error('Failed to save history locally:', error);
      }
    }
  };

  const handleSendViaApi = async () => {
    if (!phoneNumber.trim()) {
      showToast("יש להזין מספר טלפון");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendListViaApi(groupedItems, phoneNumber, settings);
      if (result.success) {
        // Save to history
        await saveToHistory(phoneNumber);
        showToast("הרשימה נשלחה בהצלחה! ✓");
        setShowShareModal(false);
      } else {
        showToast(result.message);
      }
    } catch (error) {
      console.error("Send error:", error);
      showToast("שגיאה בשליחה");
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    if (confirm("האם אתה בטוח שברצונך לנקות את הרשימה?")) {
      clearList();
    }
  };

  const handleSync = async () => {
    if (settings.appMode !== 'family') {
      showToast("סנכרון זמין רק במצב משפחה");
      return;
    }
    
    setIsSyncing(true);
    try {
      const success = await syncFromServer();
      if (success) {
        showToast("הרשימה עודכנה ✓");
      } else {
        showToast("שגיאה בסנכרון");
      }
    } catch (error) {
      console.error("Sync error:", error);
      showToast("שגיאה בסנכרון");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Toggle Button (Floating when closed) */}
      <button
        onClick={onToggle}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-primary text-primary-foreground p-3 rounded-r-xl shadow-lg transition-transform duration-300 ${
          isOpen ? "-translate-x-full" : "translate-x-0"
        }`}
        aria-label="פתח רשימת קניות"
      >
        <div className="flex flex-col items-center gap-2">
          <ShoppingCart size={28} strokeWidth={2.5} />
          {totalItems > 0 && (
            <span className="bg-white text-primary text-sm font-black rounded-full w-6 h-6 flex items-center justify-center">
              {totalItems}
            </span>
          )}
          <ChevronRight size={24} strokeWidth={2.5} />
        </div>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-card border-r border-amber-200 dark:border-amber-900/50 transition-all duration-300 z-50 flex flex-col overflow-hidden ${
          isOpen ? "translate-x-0 w-80 sm:w-96" : "-translate-x-full w-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-primary shrink-0 min-w-80 sm:min-w-96">
          <div className="flex items-center gap-3">
            <Receipt className="text-primary-foreground shrink-0" size={28} strokeWidth={2.5} />
            <h2 className="font-black text-xl text-primary-foreground whitespace-nowrap">רשימת קניות</h2>
            {totalItems > 0 && (
              <span className="bg-white text-primary text-sm font-black px-3 py-1 rounded-full shrink-0">
                {totalItems}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync button in header */}
            {settings.appMode === 'family' && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="p-2 bg-[#376e4b] hover:bg-[#2d5a3d] disabled:opacity-50 rounded-lg transition-colors"
                title="סנכרן רשימה"
              >
                <RefreshCw size={20} strokeWidth={2.5} className={`text-white ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-2 hover:bg-black/10 rounded-lg transition-colors text-primary-foreground"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
              <ShoppingCart size={64} className="mb-4 opacity-30" strokeWidth={1.5} />
              <p className="text-xl font-bold">הרשימה ריקה</p>
              <p className="text-base font-medium">הוסף מוצרים מהקטגוריות</p>
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.category.id} className="space-y-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 sticky top-0 bg-card/95 backdrop-blur py-2 z-10">
                  <span className={`w-3 h-3 rounded-full ${group.category.color}`} />
                  {group.category.name}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <ShoppingListItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-border bg-muted/30 space-y-3">
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 bg-[#376e4b] hover:bg-[#2d5a3d] text-white p-4 rounded-xl font-black text-lg transition-colors shadow-md"
            >
              <Share2 size={22} strokeWidth={2.5} />
              שלח בוואטסאפ
            </button>
            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 p-4 rounded-xl font-bold text-lg transition-colors"
            >
              <Trash2 size={22} strokeWidth={2.5} />
              רוקן רשימה
            </button>
          </div>
        )}
      </aside>
      
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* WhatsApp Send Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 shadow-xl w-full sm:max-w-md mx-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                <MessageCircle className="text-[#376e4b]" size={24} />
                שלח לוואטסאפ
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  מספר טלפון
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="05X-XXXXXXX"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#376e4b] text-lg"
                  dir="ltr"
                />
              </div>

              <button
                onClick={handleSendViaApi}
                disabled={isSending || !phoneNumber.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#376e4b] hover:bg-[#2d5a3d] disabled:bg-muted disabled:text-muted-foreground text-white py-4 rounded-xl font-bold text-lg transition-colors"
              >
                {isSending ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Send size={22} />
                    שלח בוואטסאפ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
