import Dexie, { type EntityTable } from "dexie";
import type { Category, Product, ListItem, Settings, ShufersalItem, ShufersalImportResult, ListHistory } from "./types";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed";

// Database class
class KitchenListDB extends Dexie {
  categories!: EntityTable<Category, "id">;
  products!: EntityTable<Product, "id">;
  listItems!: EntityTable<ListItem, "id">;
  settings!: EntityTable<Settings & { id: number }, "id">;
  listHistory!: EntityTable<ListHistory, "id">;

  constructor() {
    super("KitchenListDB");
    
    this.version(1).stores({
      categories: "++id, name, sortOrder",
      products: "++id, categoryId, name",
      listItems: "++id, productId, purchased, updatedAt",
      settings: "id",
    });
    
    // Version 2: Add barcode index
    this.version(2).stores({
      categories: "++id, name, sortOrder",
      products: "++id, categoryId, name, barcode",
      listItems: "++id, productId, purchased, updatedAt",
      settings: "id",
    });
    
    // Version 3: Add list history
    this.version(3).stores({
      categories: "++id, name, sortOrder",
      products: "++id, categoryId, name, barcode",
      listItems: "++id, productId, purchased, updatedAt",
      settings: "id",
      listHistory: "++id, sentAt",
    });
  }
}

// Singleton instance
export const db = new KitchenListDB();

// Helper functions

export async function getCategories(): Promise<Category[]> {
  return db.categories.orderBy("sortOrder").toArray();
}

export async function getProducts(): Promise<Product[]> {
  return db.products.toArray();
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  return db.products.where("categoryId").equals(categoryId).toArray();
}

export async function getListItems(): Promise<ListItem[]> {
  return db.listItems.orderBy("updatedAt").reverse().toArray();
}

export async function getSettings(): Promise<Settings | undefined> {
  const result = await db.settings.get(1);
  if (result) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...settings } = result;
    return settings;
  }
  return undefined;
}

// List History
export async function getListHistory(): Promise<ListHistory[]> {
  return db.listHistory.orderBy("sentAt").reverse().limit(50).toArray();
}

export async function addListHistory(history: Omit<ListHistory, "id">): Promise<number> {
  return db.listHistory.add(history as ListHistory);
}

export async function clearListHistory(): Promise<void> {
  await db.listHistory.clear();
}

// CRUD - Categories

export async function addCategory(category: Omit<Category, "id">): Promise<number> {
  return db.categories.add(category as Category);
}

export async function updateCategory(id: number, updates: Partial<Category>): Promise<void> {
  await db.categories.update(id, updates);
}

export async function deleteCategory(id: number): Promise<void> {
  // Delete all products in category first
  await db.products.where("categoryId").equals(id).delete();
  await db.categories.delete(id);
}

// CRUD - Products

export async function addProduct(product: Omit<Product, "id">): Promise<number> {
  return db.products.add(product as Product);
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<void> {
  await db.products.update(id, updates);
}

export async function deleteProduct(id: number): Promise<void> {
  // Delete from list items first
  await db.listItems.where("productId").equals(id).delete();
  await db.products.delete(id);
}

// CRUD - List Items

export async function addListItem(item: Omit<ListItem, "id">): Promise<number> {
  return db.listItems.add(item as ListItem);
}

export async function updateListItem(id: number, updates: Partial<ListItem>): Promise<void> {
  await db.listItems.update(id, { ...updates, updatedAt: new Date() });
}

export async function deleteListItem(id: number): Promise<void> {
  await db.listItems.delete(id);
}

export async function clearListItems(): Promise<void> {
  await db.listItems.clear();
}

export async function getListItemByProduct(productId: number): Promise<ListItem | undefined> {
  return db.listItems.where("productId").equals(productId).first();
}

// Settings

export async function saveSettings(settings: Settings): Promise<void> {
  await db.settings.put({ ...settings, id: 1 });
}

// Export / Import

export async function exportAllData(): Promise<string> {
  const categories = await getCategories();
  const products = await getProducts();
  const listItems = await getListItems();
  const settings = await getSettings();
  
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    products,
    listItems,
    settings,
  }, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  
  // Clear existing data
  await db.categories.clear();
  await db.products.clear();
  await db.listItems.clear();
  
  // Import new data
  if (data.categories?.length) {
    await db.categories.bulkAdd(data.categories);
  }
  if (data.products?.length) {
    await db.products.bulkAdd(data.products);
  }
  if (data.listItems?.length) {
    await db.listItems.bulkAdd(data.listItems);
  }
  if (data.settings) {
    await saveSettings(data.settings);
  }
}

// Seed data functions

export async function loadSeedData(): Promise<void> {
  // Clear existing data
  await db.categories.clear();
  await db.products.clear();
  await db.listItems.clear();
  
  // Add seed categories and get their IDs
  const categoryIds: number[] = [];
  for (const category of SEED_CATEGORIES) {
    const id = await db.categories.add(category as Category);
    categoryIds.push(id);
  }
  
  // Add seed products with correct category IDs
  for (const { categoryIndex, products } of SEED_PRODUCTS) {
    const categoryId = categoryIds[categoryIndex];
    for (const product of products) {
      await db.products.add({
        ...product,
        categoryId,
      } as Product);
    }
  }
}

export async function clearAllData(): Promise<void> {
  await db.categories.clear();
  await db.products.clear();
  await db.listItems.clear();
}

// Shufersal XML Import Functions

/**
 * Parse Shufersal XML content and extract items
 */
export function parseShufersalXML(xmlContent: string): ShufersalItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");
  
  const items: ShufersalItem[] = [];
  const itemElements = doc.querySelectorAll("Item");
  
  itemElements.forEach((item) => {
    const getTextContent = (tagName: string): string => {
      const el = item.querySelector(tagName);
      return el?.textContent?.trim() || "";
    };
    
    const shufersalItem: ShufersalItem = {
      ItemCode: getTextContent("ItemCode"),
      ItemName: getTextContent("ItemName"),
      ItemPrice: getTextContent("ItemPrice"),
      ManufactureName: getTextContent("ManufactureName") || getTextContent("ManufacturerName"),
      ManufacturerName: getTextContent("ManufacturerName") || getTextContent("ManufactureName"),
      Quantity: getTextContent("Quantity"),
      UnitOfMeasure: getTextContent("UnitOfMeasure"),
      UnitQty: getTextContent("UnitQty"),
    };
    
    // Only add items with valid name and code
    if (shufersalItem.ItemCode && shufersalItem.ItemName) {
      items.push(shufersalItem);
    }
  });
  
  return items;
}

/**
 * Determine unit type based on UnitQty or UnitOfMeasure
 */
function determineUnit(item: ShufersalItem): Product["unit"] {
  const unitQty = item.UnitQty?.toLowerCase() || "";
  const unitMeasure = item.UnitOfMeasure?.toLowerCase() || "";
  const combined = `${unitQty} ${unitMeasure}`;
  
  if (combined.includes("ליטר") || combined.includes("לטר")) return "ליטר";
  if (combined.includes("מ\"ל") || combined.includes("מיליליטר") || combined.includes("מ'ל")) return "מ״ל";
  if (combined.includes("ק\"ג") || combined.includes("קילו") || combined.includes("קג")) return 'ק"ג';
  if (combined.includes("גרם") || combined.includes("גר'")) return "גרם";
  if (combined.includes("חבילה") || combined.includes("אריזה")) return "חבילה";
  
  return "יחידות";
}

/**
 * Determine icon based on product name
 */
function determineIcon(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("חלב") || lowerName.includes("יוגורט") || lowerName.includes("גבינה") || lowerName.includes("קוטג'")) return "Milk";
  if (lowerName.includes("ביצ")) return "Egg";
  if (lowerName.includes("לחם") || lowerName.includes("פיתה") || lowerName.includes("באגט") || lowerName.includes("חלה")) return "Croissant";
  if (lowerName.includes("בשר") || lowerName.includes("סטייק") || lowerName.includes("כבש") || lowerName.includes("טלה")) return "Beef";
  if (lowerName.includes("עוף") || lowerName.includes("חזה") || lowerName.includes("שוק") || lowerName.includes("כנף")) return "Drumstick";
  if (lowerName.includes("דג") || lowerName.includes("סלמון") || lowerName.includes("טונה") || lowerName.includes("אמנון")) return "Fish";
  if (lowerName.includes("תפוח") && !lowerName.includes("אדמה")) return "Apple";
  if (lowerName.includes("בננה")) return "Banana";
  if (lowerName.includes("גזר")) return "Carrot";
  if (lowerName.includes("עגבני") || lowerName.includes("עגבנייה")) return "Cherry";
  if (lowerName.includes("לימון")) return "Lemon";
  if (lowerName.includes("ענב")) return "Grape";
  if (lowerName.includes("יין")) return "Wine";
  if (lowerName.includes("בירה")) return "Beer";
  if (lowerName.includes("קפה") || lowerName.includes("נס")) return "Coffee";
  if (lowerName.includes("עוגה") || lowerName.includes("עוגיות") || lowerName.includes("קוקיס")) return "Cookie";
  if (lowerName.includes("גלידה") || lowerName.includes("ארטיק")) return "IceCream";
  if (lowerName.includes("פיצה")) return "Pizza";
  if (lowerName.includes("ממרח") || lowerName.includes("רוטב") || lowerName.includes("סלט")) return "Salad";
  if (lowerName.includes("שוקולד") || lowerName.includes("חטיף") || lowerName.includes("במבה") || lowerName.includes("ביסלי")) return "Candy";
  if (lowerName.includes("סבון") || lowerName.includes("שמפו") || lowerName.includes("נקיון") || lowerName.includes("אקונומיקה")) return "SprayCan";
  if (lowerName.includes("קפוא") || lowerName.includes("שלג")) return "Snowflake";
  if (lowerName.includes("תבלין") || lowerName.includes("עשב")) return "Leaf";
  if (lowerName.includes("כריך") || lowerName.includes("סנדוויץ")) return "Sandwich";
  if (lowerName.includes("מים") || lowerName.includes("מינרלית")) return "Droplet";
  
  return "Package";
}

/**
 * Get Open Food Facts image URL by barcode
 */
export function getOpenFoodFactsImageUrl(barcode: string): string {
  // OpenFoodFacts image URL pattern
  return `https://images.openfoodfacts.org/images/products/${barcode.slice(0, 3)}/${barcode.slice(3, 6)}/${barcode.slice(6, 9)}/${barcode.slice(9)}/front_he.400.jpg`;
}

/**
 * Determine category based on product name
 * Returns the category name that matches the product
 */
function determineCategoryName(name: string): string {
  const lowerName = name.toLowerCase();
  
  // משקאות חמים
  if (lowerName.includes("קפה") || lowerName.includes("תה ") || lowerName.includes("נס ") || 
      lowerName.includes("קקאו") || lowerName.includes("קפסולות") || lowerName.includes("סוכר")) {
    return "משקאות חמים";
  }
  
  // מוצרי חלב
  if (lowerName.includes("חלב") || lowerName.includes("יוגורט") || lowerName.includes("גבינה") || 
      lowerName.includes("קוטג") || lowerName.includes("שמנת") || lowerName.includes("חמאה") ||
      lowerName.includes("לבן") || lowerName.includes("ביצ") || lowerName.includes("אשל")) {
    return "מוצרי חלב";
  }
  
  // לחם ומאפים
  if (lowerName.includes("לחם") || lowerName.includes("פיתה") || lowerName.includes("באגט") || 
      lowerName.includes("חלה") || lowerName.includes("לחמניה") || lowerName.includes("קרואסון") ||
      lowerName.includes("בורקס") || lowerName.includes("מאפה") || lowerName.includes("כעך")) {
    return "לחם ומאפים";
  }
  
  // בשר ועוף
  if (lowerName.includes("בשר") || lowerName.includes("עוף") || lowerName.includes("סטייק") || 
      lowerName.includes("חזה") || lowerName.includes("שוק") || lowerName.includes("כנף") ||
      lowerName.includes("שניצל") || lowerName.includes("נקניק") || lowerName.includes("הודו") ||
      lowerName.includes("כבש") || lowerName.includes("טלה") || lowerName.includes("קבב") ||
      lowerName.includes("המבורגר") || lowerName.includes("דג") || lowerName.includes("סלמון") ||
      lowerName.includes("טונה") || lowerName.includes("אמנון") || lowerName.includes("פילה")) {
    return "בשר ועוף";
  }
  
  // פירות וירקות
  if (lowerName.includes("תפוח") || lowerName.includes("בננה") || lowerName.includes("תפוז") ||
      lowerName.includes("עגבני") || lowerName.includes("מלפפון") || lowerName.includes("גזר") ||
      lowerName.includes("בצל") || lowerName.includes("לימון") || lowerName.includes("אבוקדו") ||
      lowerName.includes("פלפל") || lowerName.includes("חסה") || lowerName.includes("כרוב") ||
      lowerName.includes("ענב") || lowerName.includes("אפרסק") || lowerName.includes("שזיף") ||
      lowerName.includes("אגס") || lowerName.includes("קישוא") || lowerName.includes("חציל")) {
    return "פירות וירקות";
  }
  
  // חטיפים ומתוקים
  if (lowerName.includes("שוקולד") || lowerName.includes("עוגיות") || lowerName.includes("במבה") ||
      lowerName.includes("ביסלי") || lowerName.includes("צ'יפס") || lowerName.includes("גלידה") ||
      lowerName.includes("ממתק") || lowerName.includes("סוכריה") || lowerName.includes("חטיף") ||
      lowerName.includes("ופל") || lowerName.includes("עוגה") || lowerName.includes("קוקיס") ||
      lowerName.includes("פופקורן") || lowerName.includes("קרמבו")) {
    return "חטיפים ומתוקים";
  }
  
  // ניקיון
  if (lowerName.includes("סבון") || lowerName.includes("שמפו") || lowerName.includes("נייר טואלט") ||
      lowerName.includes("אקונומיקה") || lowerName.includes("מגבון") || lowerName.includes("שקית אשפה") ||
      lowerName.includes("כביסה") || lowerName.includes("מרכך") || lowerName.includes("אבקה") ||
      lowerName.includes("ניקוי") || lowerName.includes("ספריי") || lowerName.includes("אמבט")) {
    return "ניקיון";
  }
  
  // ברירת מחדל - אחר
  return "אחר";
}

/**
 * Import products from Shufersal XML - auto-categorize products
 */
export async function importShufersalData(
  xmlContent: string,
  _categoryId: number, // ignored - we auto-detect category
  options: {
    skipExisting?: boolean;
    maxItems?: number;
  } = {}
): Promise<ShufersalImportResult> {
  const { skipExisting = true, maxItems } = options;
  const items = parseShufersalXML(xmlContent);
  
  // Get all existing categories
  const categories = await db.categories.toArray();
  const categoryMap = new Map(categories.map(c => [c.name, c.id!]));
  
  const result: ShufersalImportResult = {
    imported: 0,
    skipped: 0,
    errors: 0,
  };
  
  const itemsToProcess = maxItems ? items.slice(0, maxItems) : items;
  
  for (const item of itemsToProcess) {
    try {
      // Check if product with this barcode already exists
      if (skipExisting) {
        const existing = await db.products.where("barcode").equals(item.ItemCode).first();
        if (existing) {
          result.skipped++;
          continue;
        }
      }
      
      // Auto-detect category
      const categoryName = determineCategoryName(item.ItemName);
      let categoryId = categoryMap.get(categoryName);
      
      // If category doesn't exist, try "אחר" or create one
      if (!categoryId) {
        categoryId = categoryMap.get("אחר");
        if (!categoryId) {
          // Create "אחר" category if it doesn't exist
          const newCategoryId = await db.categories.add({
            name: "אחר",
            icon: "Package",
            color: "var(--cat-other)",
            sortOrder: categories.length
          } as Category);
          categoryId = newCategoryId;
          categoryMap.set("אחר", newCategoryId);
        }
      }
      
      const product: Omit<Product, "id"> = {
        categoryId,
        name: item.ItemName,
        icon: determineIcon(item.ItemName),
        unit: determineUnit(item),
        barcode: item.ItemCode,
        price: parseFloat(item.ItemPrice) || undefined,
        manufacturer: item.ManufactureName || item.ManufacturerName,
        quantity: parseFloat(item.Quantity || "0") || undefined,
        quantityUnit: item.UnitOfMeasure,
        // imageUrl will be fetched from OpenFoodFacts when displaying
      };
      
      await db.products.add(product as Product);
      result.imported++;
    } catch (error) {
      console.error("Error importing item:", item.ItemName, error);
      result.errors++;
    }
  }
  
  return result;
}

/**
 * Get product by barcode
 */
export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  return db.products.where("barcode").equals(barcode).first();
}
