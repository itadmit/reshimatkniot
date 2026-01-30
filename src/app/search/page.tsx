"use client";

import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { Icon } from "@/components/Icon";
import type { Product } from "@/lib/types";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { searchProducts, products, categories } = useStore();

  const results = query.trim() ? searchProducts(query) : [];

  // Get recent products (last 10 added to list)
  const recentProducts = products.slice(0, 10);

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "";
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-muted transition-colors press-effect"
        >
          <ArrowRight size={24} />
        </button>
        <h1 className="text-xl font-bold text-foreground">חיפוש מוצרים</h1>
      </header>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="הקלד שם מוצר..."
          autoFocus
          className="w-full pr-10 pl-4 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg"
        />
      </div>

      {/* Results */}
      {query.trim() ? (
        <>
          {results.length > 0 ? (
            <>
              <p className="text-muted-foreground mb-4">
                נמצאו {results.length} תוצאות
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onLongPress={setSelectedProduct}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">לא נמצאו מוצרים התואמים לחיפוש</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Show recent/suggested products when no search */}
          {recentProducts.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-4">מוצרים מהירים</h2>
              <div className="space-y-2">
                {recentProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted transition-colors text-right"
                  >
                    <div className="text-muted-foreground">
                      <Icon name={product.icon} size={24} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-card-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{getCategoryName(product.categoryId)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {products.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Package" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">אין מוצרים עדיין. הוסף מוצרים דרך מסך הניהול.</p>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
