"use client";

import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface IconProps extends LucideProps {
  name: string;
}

// Type for icon components
type IconComponent = React.ComponentType<LucideProps>;

export function Icon({ name, ...props }: IconProps) {
  // Get the icon component from lucide-react
  const icons = LucideIcons as unknown as Record<string, IconComponent>;
  const IconComponent = icons[name];
  
  if (!IconComponent) {
    // Fallback to Package icon if icon not found
    return <LucideIcons.Package {...props} />;
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

