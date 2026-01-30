import type { Category, Product } from "./types";

// Seed categories
export const SEED_CATEGORIES: Omit<Category, "id">[] = [
  { name: "משקאות חמים", icon: "Coffee", color: "var(--cat-drinks)", sortOrder: 0 },
  { name: "מוצרי חלב", icon: "Milk", color: "var(--cat-dairy)", sortOrder: 1 },
  { name: "לחם ומאפים", icon: "Croissant", color: "var(--cat-bread)", sortOrder: 2 },
  { name: "בשר ועוף", icon: "Beef", color: "var(--cat-meat)", sortOrder: 3 },
  { name: "פירות וירקות", icon: "Apple", color: "var(--cat-fruits)", sortOrder: 4 },
  { name: "חטיפים ומתוקים", icon: "Cookie", color: "var(--cat-snacks)", sortOrder: 5 },
  { name: "ניקיון", icon: "SprayCan", color: "var(--cat-cleaning)", sortOrder: 6 },
  { name: "אחר", icon: "Package", color: "var(--cat-other)", sortOrder: 7 },
];

// Seed products by category index
export const SEED_PRODUCTS: { categoryIndex: number; products: Omit<Product, "id" | "categoryId">[] }[] = [
  {
    // משקאות חמים
    categoryIndex: 0,
    products: [
      { name: "קפה טורקי", icon: "Coffee", unit: "חבילה" },
      { name: "קפה נמס", icon: "Coffee", unit: "יחידות" },
      { name: "תה", icon: "Leaf", unit: "חבילה" },
      { name: "סוכר", icon: "CircleDot", unit: 'ק"ג' },
      { name: "קפסולות קפה", icon: "Coffee", unit: "חבילה" },
      { name: "קקאו", icon: "Coffee", unit: "חבילה" },
    ],
  },
  {
    // מוצרי חלב
    categoryIndex: 1,
    products: [
      { name: "חלב 3%", icon: "Milk", unit: "ליטר" },
      { name: "חלב 1%", icon: "Milk", unit: "ליטר" },
      { name: "גבינה צהובה", icon: "IceCream", unit: "גרם" },
      { name: "גבינה לבנה", icon: "IceCream", unit: "גרם" },
      { name: "יוגורט", icon: "IceCream", unit: "יחידות" },
      { name: "שמנת", icon: "Droplet", unit: "מ״ל" },
      { name: "חמאה", icon: "Package", unit: "יחידות" },
      { name: "ביצים", icon: "Egg", unit: "יחידות" },
      { name: "קוטג׳", icon: "IceCream", unit: "יחידות" },
    ],
  },
  {
    // לחם ומאפים
    categoryIndex: 2,
    products: [
      { name: "לחם אחיד", icon: "Croissant", unit: "יחידות" },
      { name: "לחם מלא", icon: "Croissant", unit: "יחידות" },
      { name: "חלה", icon: "Croissant", unit: "יחידות" },
      { name: "פיתות", icon: "Croissant", unit: "חבילה" },
      { name: "לחמניות", icon: "Croissant", unit: "חבילה" },
      { name: "קרואסון", icon: "Croissant", unit: "יחידות" },
      { name: "בורקס", icon: "Sandwich", unit: "יחידות" },
    ],
  },
  {
    // בשר ועוף
    categoryIndex: 3,
    products: [
      { name: "חזה עוף", icon: "Drumstick", unit: 'ק"ג' },
      { name: "כרעיים", icon: "Drumstick", unit: 'ק"ג' },
      { name: "בשר טחון", icon: "Beef", unit: 'ק"ג' },
      { name: "סטייק", icon: "Beef", unit: 'ק"ג' },
      { name: "נקניקיות", icon: "Beef", unit: "חבילה" },
      { name: "שניצל", icon: "Drumstick", unit: 'ק"ג' },
      { name: "דג סלמון", icon: "Fish", unit: 'ק"ג' },
      { name: "דג אמנון", icon: "Fish", unit: 'ק"ג' },
    ],
  },
  {
    // פירות וירקות
    categoryIndex: 4,
    products: [
      { name: "תפוחים", icon: "Apple", unit: 'ק"ג' },
      { name: "בננות", icon: "Banana", unit: 'ק"ג' },
      { name: "תפוזים", icon: "Cherry", unit: 'ק"ג' },
      { name: "עגבניות", icon: "Cherry", unit: 'ק"ג' },
      { name: "מלפפונים", icon: "Carrot", unit: 'ק"ג' },
      { name: "גזר", icon: "Carrot", unit: 'ק"ג' },
      { name: "בצל", icon: "CircleDot", unit: 'ק"ג' },
      { name: "תפוחי אדמה", icon: "CircleDot", unit: 'ק"ג' },
      { name: "לימון", icon: "Lemon", unit: 'ק"ג' },
      { name: "אבוקדו", icon: "Leaf", unit: "יחידות" },
      { name: "פלפל", icon: "Flame", unit: 'ק"ג' },
      { name: "חסה", icon: "Leaf", unit: "יחידות" },
    ],
  },
  {
    // חטיפים ומתוקים
    categoryIndex: 5,
    products: [
      { name: "שוקולד", icon: "Candy", unit: "יחידות" },
      { name: "עוגיות", icon: "Cookie", unit: "חבילה" },
      { name: "במבה", icon: "Popcorn", unit: "חבילה" },
      { name: "ביסלי", icon: "Popcorn", unit: "חבילה" },
      { name: "צ׳יפס", icon: "Popcorn", unit: "חבילה" },
      { name: "גלידה", icon: "IceCream", unit: "יחידות" },
      { name: "פופקורן", icon: "Popcorn", unit: "חבילה" },
      { name: "ופלים", icon: "Cookie", unit: "חבילה" },
    ],
  },
  {
    // ניקיון
    categoryIndex: 6,
    products: [
      { name: "אבקת כביסה", icon: "SprayCan", unit: "יחידות" },
      { name: "מרכך כביסה", icon: "Droplet", unit: "יחידות" },
      { name: "נייר טואלט", icon: "Package", unit: "חבילה" },
      { name: "סבון כלים", icon: "Droplet", unit: "יחידות" },
      { name: "מגבונים", icon: "Package", unit: "חבילה" },
      { name: "שקיות אשפה", icon: "ShoppingBag", unit: "חבילה" },
      { name: "אקונומיקה", icon: "SprayCan", unit: "יחידות" },
      { name: "ספריי לניקוי", icon: "SprayCan", unit: "יחידות" },
    ],
  },
  {
    // אחר
    categoryIndex: 7,
    products: [
      { name: "שמן זית", icon: "Droplet", unit: "ליטר" },
      { name: "מלח", icon: "CircleDot", unit: 'ק"ג' },
      { name: "פלפל שחור", icon: "CircleDot", unit: "יחידות" },
      { name: "אורז", icon: "Wheat", unit: 'ק"ג' },
      { name: "פסטה", icon: "Wheat", unit: "חבילה" },
      { name: "קטשופ", icon: "Droplet", unit: "יחידות" },
      { name: "מיונז", icon: "Droplet", unit: "יחידות" },
      { name: "חומוס", icon: "CircleDot", unit: "יחידות" },
      { name: "טחינה", icon: "Droplet", unit: "יחידות" },
      { name: "רסק עגבניות", icon: "Cherry", unit: "יחידות" },
    ],
  },
];

