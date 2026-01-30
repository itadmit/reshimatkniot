"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import type { Category } from "@/lib/types";

// McDonald's inspired color palette - vibrant but cohesive
const categoryColors = [
  { bg: "bg-amber-400", hover: "hover:bg-amber-500", icon: "text-amber-900", border: "border-amber-500" },
  { bg: "bg-red-500", hover: "hover:bg-red-600", icon: "text-white", border: "border-red-600" },
  { bg: "bg-green-500", hover: "hover:bg-green-600", icon: "text-white", border: "border-green-600" },
  { bg: "bg-orange-500", hover: "hover:bg-orange-600", icon: "text-white", border: "border-orange-600" },
  { bg: "bg-sky-500", hover: "hover:bg-sky-600", icon: "text-white", border: "border-sky-600" },
  { bg: "bg-purple-500", hover: "hover:bg-purple-600", icon: "text-white", border: "border-purple-600" },
  { bg: "bg-pink-500", hover: "hover:bg-pink-600", icon: "text-white", border: "border-pink-600" },
  { bg: "bg-teal-500", hover: "hover:bg-teal-600", icon: "text-white", border: "border-teal-600" },
];

interface CategoryCardProps {
  category: Category;
  colorIndex?: number;
}

export function CategoryCard({ category, colorIndex = 0 }: CategoryCardProps) {
  const color = categoryColors[colorIndex % categoryColors.length];

  return (
    <Link
      href={`/category/${category.id}`}
      className={`group relative flex flex-col items-center justify-center p-5 bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 press-effect border ${color.border} border-opacity-0 hover:border-opacity-100`}
    >
      {/* Colored Icon Container */}
      <div 
        className={`mb-3 p-4 rounded-xl ${color.bg} ${color.hover} transition-all duration-300 group-hover:scale-105`}
      >
        <div className={color.icon}>
          <Icon name={category.icon} size={36} strokeWidth={2} />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold text-foreground text-center leading-tight">
        {category.name}
      </h2>
    </Link>
  );
}
