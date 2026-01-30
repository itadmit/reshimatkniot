"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, HelpCircle, Package } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { Icon } from "@/components/Icon";
import type { Product } from "@/lib/types";

// Same color palette as CategoryCard
const categoryColors = [
  { bg: "bg-amber-400", text: "text-amber-900" },
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-green-500", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-sky-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
];

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = Number(params.id);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { categories, getProductsByCategory } = useStore();
  const category = categories.find((c) => c.id === categoryId);
  const categoryIndex = categories.findIndex((c) => c.id === categoryId);
  const products = getProductsByCategory(categoryId);
  const color = categoryColors[categoryIndex % categoryColors.length];

  if (!category) {
    return (
      <div className="p-6 text-center py-16">
        <HelpCircle size={64} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-black text-foreground mb-4">
          קטגוריה לא נמצאה
        </h2>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-colors press-effect"
        >
          חזרה לבית
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-3 rounded-xl bg-secondary hover:bg-muted transition-colors press-effect"
        >
          <ArrowRight size={28} strokeWidth={2.5} />
        </button>
        
        <div className={`p-4 rounded-2xl ${color.bg} shadow-md`}>
          <div className={color.text}>
            <Icon name={category.icon} size={36} strokeWidth={2} />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-black text-foreground">{category.name}</h1>
          <p className="text-muted-foreground font-bold">לחץ להוספה מהירה</p>
        </div>
      </header>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-start">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onLongPress={setSelectedProduct}
              colorIndex={categoryIndex}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="p-8 bg-secondary rounded-full inline-block mb-6">
            <Package size={64} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">
            אין מוצרים
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            הקטגוריה ריקה. הוסף מוצרים דרך מסך הניהול.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl hover:bg-primary/90 transition-colors press-effect shadow-md"
          >
            עבור לניהול
          </Link>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
