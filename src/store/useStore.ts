"use client";

import { create } from "zustand";
import type { AppState, Category, Product, ListItem, GroupedListItems, Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import * as db from "@/lib/db";

// Helper to sync with server
const syncToServer = async (action: string, data: Record<string, unknown>): Promise<{ success: boolean; id?: number }> => {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    });
    return res.json();
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false };
  }
};

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  categories: [],
  products: [],
  listItems: [],
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isHydrated: false,
  toastMessage: null,

  // Hydrate from IndexedDB or Server
  hydrate: async () => {
    try {
      // First try to get settings from local DB
      const localSettings = await db.getSettings();
      const appMode = localSettings?.appMode || DEFAULT_SETTINGS.appMode;
      
      if (appMode === 'family') {
        // Fetch from server
        try {
          const res = await fetch('/api/sync');
          if (res.ok) {
            const data = await res.json();
            set({
              categories: data.categories || [],
              products: data.products || [],
              listItems: data.listItems || [],
              settings: { ...DEFAULT_SETTINGS, ...localSettings, ...data.settings },
              isLoading: false,
              isHydrated: true,
            });
            return;
          }
        } catch (error) {
          console.error("Failed to fetch from server, falling back to local:", error);
        }
      }
      
      // Fallback to local IndexedDB
      const [categories, products, listItems, settings] = await Promise.all([
        db.getCategories(),
        db.getProducts(),
        db.getListItems(),
        db.getSettings(),
      ]);

      set({
        categories,
        products,
        listItems,
        settings: settings || DEFAULT_SETTINGS,
        isLoading: false,
        isHydrated: true,
      });
    } catch (error) {
      console.error("Failed to hydrate store:", error);
      set({ isLoading: false, isHydrated: true });
    }
  },
  
  // Sync from server (for family mode)
  syncFromServer: async () => {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        const currentSettings = get().settings;
        set({
          categories: data.categories || [],
          products: data.products || [],
          listItems: data.listItems || [],
          settings: { ...currentSettings, ...data.settings },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to sync from server:", error);
      return false;
    }
  },

  // Categories
  addCategory: async (category) => {
    const isFamilyMode = get().settings.appMode === 'family';
    let id: number;
    
    if (isFamilyMode) {
      const result = await syncToServer('addCategory', category);
      if (!result.success || !result.id) {
        get().showToast('שגיאה בהוספת קטגוריה');
        return 0;
      }
      id = result.id;
    } else {
      id = await db.addCategory(category);
    }
    
    const newCategory = { ...category, id };
    set((state) => ({
      categories: [...state.categories, newCategory].sort((a, b) => a.sortOrder - b.sortOrder),
    }));
    get().showToast(`קטגוריה "${category.name}" נוספה`);
    return id;
  },

  updateCategory: async (id, updates) => {
    const isFamilyMode = get().settings.appMode === 'family';
    const category = get().categories.find((c) => c.id === id);
    
    if (isFamilyMode && category) {
      await syncToServer('updateCategory', { ...category, ...updates, id });
    } else {
      await db.updateCategory(id, updates);
    }
    
    set((state) => ({
      categories: state.categories
        .map((c) => (c.id === id ? { ...c, ...updates } : c))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  },

  deleteCategory: async (id) => {
    const category = get().categories.find((c) => c.id === id);
    const isFamilyMode = get().settings.appMode === 'family';
    
    if (isFamilyMode) {
      await syncToServer('deleteCategory', { id });
    } else {
      await db.deleteCategory(id);
    }
    
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      products: state.products.filter((p) => p.categoryId !== id),
    }));
    if (category) {
      get().showToast(`קטגוריה "${category.name}" נמחקה`);
    }
  },

  // Products
  addProduct: async (product) => {
    const isFamilyMode = get().settings.appMode === 'family';
    let id: number;
    
    if (isFamilyMode) {
      const result = await syncToServer('addProduct', product);
      if (!result.success || !result.id) {
        get().showToast('שגיאה בהוספת מוצר');
        return 0;
      }
      id = result.id;
    } else {
      id = await db.addProduct(product);
    }
    
    const newProduct = { ...product, id };
    set((state) => ({
      products: [...state.products, newProduct],
    }));
    get().showToast(`מוצר "${product.name}" נוסף`);
    return id;
  },

  updateProduct: async (id, updates) => {
    const isFamilyMode = get().settings.appMode === 'family';
    const product = get().products.find((p) => p.id === id);
    
    if (isFamilyMode && product) {
      await syncToServer('updateProduct', { ...product, ...updates, id });
    } else {
      await db.updateProduct(id, updates);
    }
    
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  deleteProduct: async (id) => {
    const product = get().products.find((p) => p.id === id);
    const isFamilyMode = get().settings.appMode === 'family';
    
    if (isFamilyMode) {
      await syncToServer('deleteProduct', { id });
    } else {
      await db.deleteProduct(id);
    }
    
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      listItems: state.listItems.filter((li) => li.productId !== id),
    }));
    if (product) {
      get().showToast(`מוצר "${product.name}" נמחק`);
    }
  },

  // List Items - Optimistic Update for instant UI response
  addToList: async (productId, qty = 1, note) => {
    const isFamilyMode = get().settings.appMode === 'family';
    const product = get().products.find((p) => p.id === productId);
    
    // Check if item already exists
    const existingItem = get().listItems.find((li) => li.productId === productId);

    // Update usage count when adding (not decrementing) - fire and forget
    if (product && qty > 0) {
      const newUsageCount = (product.usageCount || 0) + 1;
      // Update UI immediately
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId
            ? { ...p, usageCount: newUsageCount, lastUsed: new Date() }
            : p
        ),
      }));
      // Sync to server/DB in background
      if (isFamilyMode) {
        syncToServer('updateProduct', { ...product, usageCount: newUsageCount, id: product.id });
      } else {
        db.updateProduct(productId, { usageCount: newUsageCount, lastUsed: new Date() });
      }
    }

    if (existingItem && existingItem.id) {
      // Update existing item
      const newQty = existingItem.qty + qty;
      
      if (newQty <= 0) {
        await get().removeFromList(existingItem.id);
        return;
      }

      // Update UI immediately (optimistic)
      set((state) => ({
        listItems: state.listItems.map((li) =>
          li.id === existingItem!.id
            ? { ...li, qty: newQty, note: note || li.note, updatedAt: new Date() }
            : li
        ),
      }));

      // Sync to server/DB in background
      if (isFamilyMode) {
        syncToServer('updateListItem', { id: existingItem.id, qty: newQty, note: note || existingItem.note, purchased: existingItem.purchased });
      } else {
        db.updateListItem(existingItem.id, { qty: newQty, note: note || existingItem.note });
      }
    } else {
      // Add new item - generate temp ID for instant UI
      const tempId = -Date.now(); // Negative ID for temp items
      const newItem: ListItem = {
        id: tempId,
        productId,
        qty,
        note,
        purchased: false,
        updatedAt: new Date(),
      };
      
      // Update UI immediately with temp ID
      set((state) => ({
        listItems: [...state.listItems, newItem],
      }));
      
      if (product) {
        get().showToast(`${product.name} נוסף לרשימה`);
      }

      // Sync to server/DB in background and update real ID
      if (isFamilyMode) {
        syncToServer('addListItem', { productId, qty, note, purchased: false, updatedAt: new Date() })
          .then((result) => {
            if (result.success && result.id) {
              // Replace temp ID with real ID
              set((state) => ({
                listItems: state.listItems.map((li) =>
                  li.id === tempId ? { ...li, id: result.id } : li
                ),
              }));
            } else {
              // Remove item on failure
              set((state) => ({
                listItems: state.listItems.filter((li) => li.id !== tempId),
              }));
              get().showToast('שגיאה בהוספה לרשימה');
            }
          });
      } else {
        db.addListItem({ productId, qty, note, purchased: false, updatedAt: new Date() })
          .then((realId) => {
            set((state) => ({
              listItems: state.listItems.map((li) =>
                li.id === tempId ? { ...li, id: realId } : li
              ),
            }));
          });
      }
    }
  },

  updateListItem: (id, updates) => {
    const isFamilyMode = get().settings.appMode === 'family';
    const item = get().listItems.find((li) => li.id === id);
    
    // Update UI immediately (optimistic)
    set((state) => ({
      listItems: state.listItems.map((li) =>
        li.id === id ? { ...li, ...updates, updatedAt: new Date() } : li
      ),
    }));

    // Sync in background
    if (isFamilyMode && item) {
      syncToServer('updateListItem', { ...item, ...updates, id });
    } else {
      db.updateListItem(id, updates);
    }
  },

  removeFromList: (id) => {
    const item = get().listItems.find((li) => li.id === id);
    const product = item ? get().products.find((p) => p.id === item.productId) : null;
    const isFamilyMode = get().settings.appMode === 'family';
    
    // Update UI immediately (optimistic)
    set((state) => ({
      listItems: state.listItems.filter((li) => li.id !== id),
    }));
    if (product) {
      get().showToast(`${product.name} הוסר מהרשימה`);
    }

    // Sync in background
    if (isFamilyMode) {
      syncToServer('deleteListItem', { id });
    } else {
      db.deleteListItem(id);
    }
  },

  clearList: () => {
    const isFamilyMode = get().settings.appMode === 'family';
    
    // Update UI immediately
    set({ listItems: [] });
    get().showToast("הרשימה נוקתה");

    // Sync in background
    if (isFamilyMode) {
      syncToServer('clearList', {});
    } else {
      db.clearListItems();
    }
  },

  togglePurchased: (id) => {
    const item = get().listItems.find((li) => li.id === id);
    if (item) {
      const isFamilyMode = get().settings.appMode === 'family';
      
      // Update UI immediately (optimistic)
      set((state) => ({
        listItems: state.listItems.map((li) =>
          li.id === id ? { ...li, purchased: !li.purchased, updatedAt: new Date() } : li
        ),
      }));

      // Sync in background
      if (isFamilyMode) {
        syncToServer('updateListItem', { ...item, purchased: !item.purchased, id });
      } else {
        db.updateListItem(id, { purchased: !item.purchased });
      }
    }
  },

  // Settings
  updateSettings: async (updates) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, ...updates };
    
    // Always save to local DB
    await db.saveSettings(newSettings);
    
    // Also sync to server if in family mode (only darkMode and whatsapp)
    if (currentSettings.appMode === 'family' && (updates.darkMode !== undefined || updates.whatsappDefaultPhone !== undefined)) {
      await syncToServer('updateSettings', { darkMode: newSettings.darkMode, whatsappDefaultPhone: newSettings.whatsappDefaultPhone });
    }
    
    set({ settings: newSettings });

    // Apply dark mode
    if (updates.darkMode !== undefined) {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", updates.darkMode);
      }
    }
    
    // If switching to family mode, sync from server
    if (updates.appMode === 'family' && currentSettings.appMode !== 'family') {
      await get().syncFromServer();
    }
  },

  // Toast
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },

  hideToast: () => {
    set({ toastMessage: null });
  },

  // Export / Import
  exportData: async () => {
    return db.exportAllData();
  },

  importData: async (json) => {
    await db.importAllData(json);
    await get().hydrate();
    get().showToast("הנתונים יובאו בהצלחה");
  },

  // Seed data
  loadSeedData: async () => {
    const isFamilyMode = get().settings.appMode === 'family';
    
    if (isFamilyMode) {
      // Import seed data dynamically
      const { SEED_CATEGORIES, SEED_PRODUCTS } = await import('@/lib/seed');
      
      // Clear existing data on server would need a new endpoint, so we just add
      // Add categories via server
      const categoryIds: number[] = [];
      for (const category of SEED_CATEGORIES) {
        const result = await syncToServer('addCategory', category);
        if (result.success && result.id) {
          categoryIds.push(result.id);
        }
      }
      
      // Add products via server
      for (const { categoryIndex, products } of SEED_PRODUCTS) {
        const categoryId = categoryIds[categoryIndex];
        if (categoryId) {
          for (const product of products) {
            await syncToServer('addProduct', { ...product, categoryId });
          }
        }
      }
      
      // Sync from server to get all data
      await get().syncFromServer();
      get().showToast("נתוני ברירת מחדל נטענו");
    } else {
      // Local mode - use IndexedDB
      await db.loadSeedData();
      await get().hydrate();
      get().showToast("נתוני ברירת מחדל נטענו");
    }
  },

  clearAllData: async () => {
    const isFamilyMode = get().settings.appMode === 'family';
    
    if (isFamilyMode) {
      await syncToServer('clearAllData', {});
    } else {
      await db.clearAllData();
    }
    
    set({
      categories: [],
      products: [],
      listItems: [],
    });
    get().showToast("כל הנתונים נמחקו");
  },

  // Shufersal import
  importShufersalXML: async (xmlContent, categoryId, options) => {
    const result = await db.importShufersalData(xmlContent, categoryId, options);
    await get().hydrate();
    get().showToast(`יובאו ${result.imported} מוצרים (${result.skipped} דולגו)`);
    return result;
  },

  // Selectors
  getProductsByCategory: (categoryId) => {
    return get().products.filter((p) => p.categoryId === categoryId);
  },

  getListItemsGrouped: (): GroupedListItems[] => {
    const { listItems, products, categories } = get();

    // Create a map of products for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Group items by category
    const grouped = new Map<number, GroupedListItems>();

    for (const item of listItems) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      const category = categoryMap.get(product.categoryId);
      if (!category) continue;

      if (!grouped.has(category.id!)) {
        grouped.set(category.id!, {
          category,
          items: [],
        });
      }

      grouped.get(category.id!)!.items.push({
        ...item,
        product,
        category,
      });
    }

    // Sort by category order
    return Array.from(grouped.values()).sort(
      (a, b) => a.category.sortOrder - b.category.sortOrder
    );
  },

  getListItemCount: () => {
    return get().listItems.length;
  },

  searchProducts: (query) => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    return get().products.filter((p) =>
      p.name.toLowerCase().includes(lowerQuery)
    );
  },

  getFrequentProducts: (limit = 8) => {
    const products = get().products;
    // Filter products with usage > 2 and sort by usage count descending
    return products
      .filter((p) => (p.usageCount || 0) >= 3)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  },
}));

// Initialize dark mode on load
if (typeof window !== "undefined") {
  const initDarkMode = () => {
    const settings = useStore.getState().settings;
    document.documentElement.classList.toggle("dark", settings.darkMode);
  };

  // Subscribe to hydration
  useStore.subscribe((state) => {
    if (state.isHydrated) {
      initDarkMode();
    }
  });
}
