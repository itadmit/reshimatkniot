"use client";

import { useState, useRef } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { Icon } from "./Icon";
import { useStore } from "@/store/useStore";
import type { ListItemWithProduct } from "@/lib/types";

interface ShoppingListItemProps {
  item: ListItemWithProduct;
}

export function ShoppingListItem({ item }: ShoppingListItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [imageError, setImageError] = useState(false);
  const startXRef = useRef(0);
  const { updateListItem, removeFromList } = useStore();
  
  const hasValidImage = item.product.imageUrl && !imageError;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startXRef.current;
    // Only allow left swipe (RTL - so it's positive diff)
    if (diff > 0) {
      setSwipeX(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = () => {
    if (swipeX > 60) {
      removeFromList(item.id!);
    }
    setSwipeX(0);
  };

  const incrementQty = () => {
    updateListItem(item.id!, { qty: Math.min(item.qty + 1, 99) });
  };

  const decrementQty = () => {
    if (item.qty > 1) {
      updateListItem(item.id!, { qty: item.qty - 1 });
    } else {
      removeFromList(item.id!);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <div
        className="absolute inset-y-0 right-0 bg-destructive flex items-center justify-end px-4 rounded-xl"
        style={{ width: swipeX > 0 ? `${swipeX + 20}px` : 0 }}
      >
        <Trash2 className="text-destructive-foreground" size={24} strokeWidth={2.5} />
      </div>

      {/* Item content */}
      <div
        className="relative bg-secondary border-2 border-border p-3 rounded-xl transition-all"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-3">
          {/* Product icon/image */}
          <div className="shrink-0">
            {hasValidImage ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-full h-full object-contain"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon name={item.product.icon} size={22} strokeWidth={2} />
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-foreground truncate">
              {item.product.name}
            </p>
            {item.note && (
              <p className="text-sm font-medium text-muted-foreground truncate">{item.note}</p>
            )}
          </div>

          {/* Quantity controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={decrementQty}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors press-effect"
            >
              <Minus size={18} strokeWidth={3} />
            </button>
            <span className="w-8 text-center font-black text-lg text-foreground">
              {item.qty}
            </span>
            <button
              onClick={incrementQty}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors press-effect"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>

          {/* Delete button (desktop) */}
          <button
            onClick={() => removeFromList(item.id!)}
            className="hidden sm:flex w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 items-center justify-center transition-colors"
          >
            <Trash2 size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
