"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { History, ChevronDown, ChevronUp, Calendar, Phone, User, Package } from "lucide-react";
import * as db from "@/lib/db";
import type { ListHistory } from "@/lib/types";

export default function HistoryPage() {
  const { settings } = useStore();
  const [history, setHistory] = useState<ListHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, [settings.appMode]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      if (settings.appMode === 'family') {
        // Load from server
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          // Transform server data to match local format
          const transformed = data.history.map((h: any) => ({
            id: h.id,
            items: typeof h.items === 'string' ? JSON.parse(h.items) : h.items,
            totalItems: h.total_items,
            sentTo: h.sent_to,
            sentAt: new Date(h.sent_at),
            createdByName: h.created_by_name
          }));
          setHistory(transformed);
        }
      } else {
        // Load from local DB
        const localHistory = await db.getListHistory();
        setHistory(localHistory);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-bold">טוען היסטוריה...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center">
          <History size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">רשימות קודמות</h1>
          <p className="text-sm font-bold text-muted-foreground">
            {history.length > 0 ? `${history.length} רשימות נשמרו` : 'אין רשימות קודמות'}
          </p>
        </div>
      </header>

      {/* History List */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <History size={64} className="text-muted-foreground/30 mb-4" />
          <p className="text-xl font-bold text-muted-foreground mb-2">אין רשימות קודמות</p>
          <p className="text-muted-foreground">כשתשלח רשימה בוואטסאפ, היא תישמר כאן</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Header - clickable to expand */}
              <button
                onClick={() => toggleExpand(item.id!)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package size={20} className="text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {item.totalItems} פריטים
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      <span>{formatDate(item.sentAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.sentTo && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone size={14} />
                      <span dir="ltr">{item.sentTo}</span>
                    </div>
                  )}
                  {item.createdByName && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User size={14} />
                      <span>{item.createdByName}</span>
                    </div>
                  )}
                  {expandedId === item.id ? (
                    <ChevronUp size={20} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={20} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {expandedId === item.id && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="space-y-2">
                    {item.items.map((listItem, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{listItem.productName}</span>
                          <span className="text-sm text-muted-foreground">
                            ({listItem.categoryName})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                            {listItem.qty}
                          </span>
                          {listItem.note && (
                            <span className="text-sm text-muted-foreground italic">
                              {listItem.note}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

