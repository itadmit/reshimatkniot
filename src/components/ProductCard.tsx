"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Minus, Star } from "lucide-react";
import { Icon } from "./Icon";
import { useStore } from "@/store/useStore";
import type { Product } from "@/lib/types";

// Threshold for "frequent" badge
const FREQUENT_THRESHOLD = 3;

interface ProductCardProps {
  product: Product;
  onLongPress?: (product: Product) => void;
  colorIndex?: number;
  compactBadge?: boolean; // Show only star icon without text
}

// Softer colors for product cards
const productColors = [
  "bg-amber-100 text-amber-700",
  "bg-red-100 text-red-600",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-600",
  "bg-sky-100 text-sky-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
];

export function ProductCard({ product, onLongPress, colorIndex = 0, compactBadge = false }: ProductCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { addToList, listItems } = useStore();

  // Check if product is in list
  const listItem = listItems.find((item) => item.productId === product.id);
  const qty = listItem ? listItem.qty : 0;
  const color = productColors[colorIndex % productColors.length];
  
  // Check if we should show image or icon
  const hasValidImage = product.imageUrl && !imageError;
  
  // Check if product is frequently used
  const isFrequent = (product.usageCount || 0) >= FREQUENT_THRESHOLD;

  const handleIncrement = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    addToList(product.id!, 1);
  };

  const handleDecrement = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    addToList(product.id!, -1);
  };

  const handleCardClick = () => {
    if (qty === 0) {
      addToList(product.id!, 1);
    }
  };

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress(product);
    }
  }, [onLongPress, product]);

  const handleTouchStart = () => {
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      handleLongPress();
      setIsPressed(false);
    }, 500);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Compact card for items without image
  if (!hasValidImage) {
    return (
      <div
        className={`relative flex flex-col items-center p-3 bg-card rounded-2xl shadow-sm border-2 transition-all duration-200 select-none ${
          qty > 0 
            ? "border-primary shadow-lg" 
            : "border-transparent hover:shadow-md hover:border-border"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        {/* Frequent badge */}
        {isFrequent && (
          compactBadge ? (
            <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-1 shadow-md z-10">
              <Star size={12} fill="currentColor" />
            </div>
          ) : (
            <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-lg px-2 py-0.5 shadow-md z-10 flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              <span className="text-xs font-bold">תדיר</span>
            </div>
          )
        )}
        
        <div className={`p-3 rounded-xl ${color} mb-2`}>
          <Icon name={product.icon} size={36} strokeWidth={2} />
        </div>
        
        <h3 className="text-base font-bold text-foreground text-center line-clamp-2 w-full leading-tight mb-2">
          {product.name}
        </h3>

        <div className="w-full h-14 mt-auto">
          {qty > 0 ? (
            <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-xl w-full h-full shadow-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <button
                onClick={handleIncrement}
                className="h-full px-4 hover:bg-black/10 active:bg-black/20 transition-colors flex items-center justify-center"
              >
                <Plus size={22} strokeWidth={3} />
              </button>
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold opacity-80 leading-none">כבר בעגלה</span>
                <span className="font-black text-xl leading-none">{qty}</span>
              </div>
              <button
                onClick={handleDecrement}
                className="h-full px-4 hover:bg-black/10 active:bg-black/20 transition-colors flex items-center justify-center"
              >
                <Minus size={22} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button className="w-full h-full flex items-center justify-center gap-2 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground font-bold text-base rounded-xl transition-colors duration-200">
              <Plus size={20} strokeWidth={3} />
              <span>הוסף</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card with image - larger
  return (
    <div
      className={`relative flex flex-col items-center p-3 bg-card rounded-2xl shadow-sm border-2 transition-all duration-200 select-none ${
        qty > 0 
          ? "border-primary shadow-lg" 
          : "border-transparent hover:shadow-md hover:border-border"
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
    >
      {/* Frequent badge */}
      {isFrequent && (
        compactBadge ? (
          <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-1 shadow-md z-10">
            <Star size={12} fill="currentColor" />
          </div>
        ) : (
          <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-lg px-2 py-0.5 shadow-md z-10 flex items-center gap-1">
            <Star size={12} fill="currentColor" />
            <span className="text-xs font-bold">תדיר</span>
          </div>
        )
      )}
      
      <div className="w-28 h-28 flex items-center justify-center mb-2 bg-white rounded-xl p-2">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="max-w-full max-h-full object-contain"
          onError={() => setImageError(true)}
        />
      </div>

      <h3 className="text-base font-bold text-foreground text-center line-clamp-2 w-full leading-tight mb-2">
        {product.name}
      </h3>

      <div className="w-full h-14 mt-auto">
        {qty > 0 ? (
          <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-xl w-full h-full shadow-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <button
              onClick={handleIncrement}
              className="h-full px-4 hover:bg-black/10 active:bg-black/20 transition-colors flex items-center justify-center"
            >
              <Plus size={22} strokeWidth={3} />
            </button>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold opacity-80 leading-none">כבר בעגלה</span>
              <span className="font-black text-xl leading-none">{qty}</span>
            </div>
            <button
              onClick={handleDecrement}
              className="h-full px-4 hover:bg-black/10 active:bg-black/20 transition-colors flex items-center justify-center"
            >
              <Minus size={22} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button className="w-full h-full flex items-center justify-center gap-2 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground font-bold text-base rounded-xl transition-colors duration-200">
            <Plus size={20} strokeWidth={3} />
            <span>הוסף</span>
          </button>
        )}
      </div>
    </div>
  );
}
