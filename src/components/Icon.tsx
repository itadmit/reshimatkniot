"use client";

import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface IconProps extends LucideProps {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  // Get the icon component from lucide-react
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<LucideProps>>)[name];
  
  if (!IconComponent) {
    // Fallback to Package icon if icon not found
    const FallbackIcon = LucideIcons.Package;
    return <FallbackIcon {...props} />;
  }
  
  return <IconComponent {...props} />;
}

// Export available icon names for selection
export const availableIcons = [
  "Coffee",
  "Milk",
  "Croissant",
  "Beef",
  "Apple",
  "Banana",
  "Cookie",
  "SprayCan",
  "Package",
  "Egg",
  "IceCream",
  "Pizza",
  "Soup",
  "Salad",
  "Cake",
  "Candy",
  "Wine",
  "Beer",
  "Snowflake",
  "Flame",
  "Leaf",
  "Fish",
  "Drumstick",
  "Sandwich",
  "Carrot",
  "Cherry",
  "Grape",
  "Lemon",
  "Popcorn",
  "Wheat",
  "ShoppingBag",
  "Droplet",
  "CircleDot",
  "Refrigerator",
  "ShoppingCart",
  "Heart",
  "Star",
  "Home",
  "Settings",
  "Search",
  "Plus",
  "Minus",
  "Check",
  "X",
] as const;

export type IconName = typeof availableIcons[number];

