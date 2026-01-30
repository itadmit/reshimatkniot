// Database Types

export interface Category {
  id?: number;
  name: string;
  icon: string; // Lucide icon name
  color: string; // CSS color variable
  sortOrder: number;
}

export interface Product {
  id?: number;
  categoryId: number;
  name: string;
  icon: string; // Lucide icon name
  unit: ProductUnit;
  barcode?: string; // ברקוד מוצר
  price?: number; // מחיר
  imageUrl?: string; // תמונת מוצר
  manufacturer?: string; // יצרן
  quantity?: number; // כמות/משקל
  quantityUnit?: string; // יחידת כמות
  usageCount?: number; // מונה שימוש - כמה פעמים המוצר נוסף לרשימה
  lastUsed?: Date; // תאריך שימוש אחרון
}

export type ProductUnit = "יחידות" | "גרם" | 'ק"ג' | "ליטר" | "מ״ל" | "חבילה";

export interface ListItem {
  id?: number;
  productId: number;
  qty: number;
  note?: string;
  purchased: boolean;
  updatedAt: Date;
}

// List History - saved lists sent via WhatsApp
export interface ListHistoryItem {
  productName: string;
  categoryName: string;
  qty: number;
  note?: string;
}

export interface ListHistory {
  id?: number;
  items: ListHistoryItem[];
  totalItems: number;
  sentTo?: string; // Phone number sent to
  sentAt: Date;
  createdByName?: string; // Name of user who created
}

export type AppMode = 'offline' | 'family';

export interface Settings {
  adminPassword: string;
  darkMode: boolean;
  appMode?: AppMode; // מצב אפליקציה - אופליין או משפחה
  // True Story WhatsApp API
  whatsappApiToken?: string;
  whatsappInstanceId?: string;
  whatsappDefaultPhone?: string; // מספר ברירת מחדל לשליחה
}

// View Types - enriched data for display

export interface ListItemWithProduct extends ListItem {
  product: Product;
  category: Category;
}

export interface CategoryWithProducts extends Category {
  products: Product[];
}

export interface GroupedListItems {
  category: Category;
  items: ListItemWithProduct[];
}

// Store Types

export interface AppState {
  // Data
  categories: Category[];
  products: Product[];
  listItems: ListItem[];
  settings: Settings;
  
  // UI State
  isLoading: boolean;
  isHydrated: boolean;
  toastMessage: string | null;
  
  // Actions - Categories
  addCategory: (category: Omit<Category, "id">) => Promise<number>;
  updateCategory: (id: number, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  
  // Actions - Products
  addProduct: (product: Omit<Product, "id">) => Promise<number>;
  updateProduct: (id: number, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  
  // Actions - List Items (optimistic updates - no await needed)
  addToList: (productId: number, qty?: number, note?: string) => void;
  updateListItem: (id: number, updates: Partial<ListItem>) => void;
  removeFromList: (id: number) => void;
  clearList: () => void;
  togglePurchased: (id: number) => void;
  
  // Actions - Settings
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  
  // Actions - UI
  showToast: (message: string) => void;
  hideToast: () => void;
  
  // Actions - Data
  hydrate: () => Promise<void>;
  syncFromServer: () => Promise<boolean>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  loadSeedData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  importShufersalXML: (xmlContent: string, categoryId: number, options?: { skipExisting?: boolean; maxItems?: number }) => Promise<ShufersalImportResult>;
  
  // Computed / Selectors
  getProductsByCategory: (categoryId: number) => Product[];
  getListItemsGrouped: () => GroupedListItems[];
  getListItemCount: () => number;
  searchProducts: (query: string) => Product[];
  getFrequentProducts: (limit?: number) => Product[];
}

// Default values

export const DEFAULT_SETTINGS: Settings = {
  adminPassword: "",
  darkMode: false,
  appMode: "family", // ברירת מחדל - מצב משפחה (לא אופליין)
};

export const PRODUCT_UNITS: ProductUnit[] = [
  "יחידות",
  "גרם",
  'ק"ג',
  "ליטר",
  "מ״ל",
  "חבילה",
];

export const CATEGORY_COLORS = [
  { name: "צהוב", value: "#FFBC0D" },
  { name: "אדום", value: "#EF4444" },
  { name: "ירוק", value: "#22C55E" },
  { name: "כתום", value: "#F97316" },
  { name: "כחול", value: "#38BDF8" },
  { name: "סגול", value: "#A855F7" },
  { name: "ורוד", value: "#EC4899" },
  { name: "טורקיז", value: "#14B8A6" },
];

// Available icons for categories and products
export const CATEGORY_ICONS = [
  "Coffee",
  "Milk",
  "Croissant",
  "Beef",
  "Apple",
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
  "Refrigerator",
];

// Shufersal XML Item structure
export interface ShufersalItem {
  ItemCode: string;
  ItemName: string;
  ItemPrice: string;
  ManufactureName?: string;
  ManufacturerName?: string;
  Quantity?: string;
  UnitOfMeasure?: string;
  UnitQty?: string;
}

export interface ShufersalImportResult {
  imported: number;
  skipped: number;
  errors: number;
}

export const PRODUCT_ICONS = [
  "Coffee",
  "Milk",
  "Croissant",
  "Beef",
  "Apple",
  "Banana",
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
  "Fish",
  "Drumstick",
  "Sandwich",
  "Carrot",
  "Cherry",
  "Grape",
  "Lemon",
  "Cookie",
  "Popcorn",
  "Wheat",
  "Package",
  "ShoppingBag",
  "Droplet",
  "Flame",
  "Leaf",
  "CircleDot",
];
