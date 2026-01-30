"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Icon } from "./Icon";
import { useStore } from "@/store/useStore";
import type { Product } from "@/lib/types";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const { addToList, listItems, updateListItem } = useStore();

  // Check if product is already in list
  const existingItem = product
    ? listItems.find((item) => item.productId === product.id)
    : null;

  useEffect(() => {
    if (existingItem) {
      setQty(existingItem.qty);
      setNote(existingItem.note || "");
    } else {
      setQty(1);
      setNote("");
    }
  }, [existingItem, product]);

  if (!product) return null;

  const handleSubmit = async () => {
    if (existingItem && existingItem.id) {
      await updateListItem(existingItem.id, { qty, note: note || undefined });
    } else {
      await addToList(product.id!, qty, note || undefined);
    }
    onClose();
  };

  const incrementQty = () => setQty((q) => Math.min(q + 1, 99));
  const decrementQty = () => setQty((q) => Math.max(q - 1, 1));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X size={24} />
        </button>

        {/* Product info */}
        <div className="flex flex-col items-center mb-6">
          <div className="text-muted-foreground mb-3">
            <Icon name={product.icon} size={64} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-card-foreground">{product.name}</h2>
          <p className="text-sm text-muted-foreground">{product.unit}</p>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={decrementQty}
            disabled={qty <= 1}
            className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 flex items-center justify-center transition-colors press-effect"
          >
            <Minus size={24} />
          </button>
          <div className="w-20 text-center">
            <span className="text-4xl font-bold text-card-foreground">{qty}</span>
          </div>
          <button
            onClick={incrementQty}
            disabled={qty >= 99}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center transition-colors press-effect"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Note input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            הערה (אופציונלי)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="למשל: טחון, ללא סוכר..."
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 transition-colors press-effect"
        >
          {existingItem ? "עדכן ברשימה" : "הוסף לרשימה"}
        </button>
      </div>
    </div>
  );
}
