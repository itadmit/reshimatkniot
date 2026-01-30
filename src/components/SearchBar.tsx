"use client";

import { Search, X } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Icon } from "./Icon";
import { useStore } from "@/store/useStore";
import type { Product } from "@/lib/types";

interface SearchBarProps {
  onSelectProduct?: (product: Product) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ onSelectProduct, placeholder = "חיפוש מוצר...", autoFocus = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { searchProducts, addToList, categories } = useStore();
  const results = query.trim() ? searchProducts(query) : [];

  const handleSelect = useCallback((product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      addToList(product.id!);
    }
    setQuery("");
    setIsOpen(false);
  }, [onSelectProduct, addToList]);

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || "";
  };

  return (
    <div ref={containerRef} className="relative z-20">
      <div className="relative group">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pr-12 pl-12 py-4 bg-card border border-transparent hover:border-border/50 shadow-sm hover:shadow-md focus:shadow-lg rounded-2xl text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-right border-b border-border/50 last:border-b-0 group"
            >
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                <Icon name={product.icon} size={28} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-card-foreground truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">{getCategoryName(product.categoryId)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-2xl shadow-xl p-8 text-center text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="font-medium">לא נמצאו מוצרים</p>
        </div>
      )}
    </div>
  );
}
