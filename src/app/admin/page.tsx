"use client";

import { useState, useRef } from "react";
import { ArrowRight, Plus, Edit2, Trash2, Download, Upload, Lock, Unlock, X, Database, RefreshCw, FileSpreadsheet, Loader2, MessageCircle, Send, Users, Wifi, WifiOff, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/lib/auth-context";
import { Icon, availableIcons } from "@/components/Icon";
import { FamilyManager } from "@/components/FamilyManager";
import { AppModeToggle } from "@/components/AppModeToggle";
import type { Category, Product, ProductUnit } from "@/lib/types";
import { PRODUCT_UNITS, CATEGORY_COLORS } from "@/lib/types";

type Tab = "categories" | "products" | "family" | "settings";

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
}

interface ProductFormData {
  name: string;
  categoryId: number;
  icon: string;
  unit: ProductUnit;
  imageUrl: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { logout: authLogout, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xmlFileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    categories,
    products,
    settings,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSettings,
    exportData,
    importData,
    loadSeedData,
    clearAllData,
    importShufersalXML,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [isAuthenticated, setIsAuthenticated] = useState(!settings.adminPassword);
  const [passwordInput, setPasswordInput] = useState("");
  
  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: "",
    icon: "Package",
    color: CATEGORY_COLORS[0].value,
  });

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: "",
    categoryId: 0,
    icon: "Package",
    unit: "יחידות",
    imageUrl: "",
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "category" | "product"; id: number } | null>(null);

  // Password setup
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Seed confirmation
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isLoadingSeed, setIsLoadingSeed] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // XML Import
  const [showXmlImport, setShowXmlImport] = useState(false);
  const [xmlMaxItems, setXmlMaxItems] = useState<number>(500);
  const [isImporting, setIsImporting] = useState(false);

  // WhatsApp API Settings
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [whatsAppToken, setWhatsAppToken] = useState(settings.whatsappApiToken || "");
  const [whatsAppInstanceId, setWhatsAppInstanceId] = useState(settings.whatsappInstanceId || "");
  const [whatsAppDefaultPhone, setWhatsAppDefaultPhone] = useState(settings.whatsappDefaultPhone || "");

  // Authentication
  const handleLogin = () => {
    if (passwordInput === settings.adminPassword) {
      setIsAuthenticated(true);
      setPasswordInput("");
    } else {
      showToast("סיסמה שגויה");
    }
  };

  // Category handlers
  const openCategoryForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        icon: category.icon,
        color: category.color,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        icon: "Package",
        color: CATEGORY_COLORS[0].value,
      });
    }
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      showToast("יש להזין שם קטגוריה");
      return;
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id!, categoryForm);
      showToast("קטגוריה עודכנה");
    } else {
      await addCategory({
        ...categoryForm,
        sortOrder: categories.length,
      });
    }
    setShowCategoryForm(false);
  };

  const handleDeleteCategory = async () => {
    if (deleteConfirm?.type === "category") {
      await deleteCategory(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // Product handlers
  const openProductForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        categoryId: product.categoryId,
        icon: product.icon,
        unit: product.unit,
        imageUrl: product.imageUrl || "",
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        categoryId: categories[0]?.id || 0,
        icon: "Package",
        unit: "יחידות",
        imageUrl: "",
      });
    }
    setShowProductForm(true);
  };

  const handleProductSubmit = async () => {
    if (!productForm.name.trim()) {
      showToast("יש להזין שם מוצר");
      return;
    }
    if (!productForm.categoryId) {
      showToast("יש לבחור קטגוריה");
      return;
    }

    const productData = {
      ...productForm,
      imageUrl: productForm.imageUrl.trim() || undefined,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id!, productData);
      showToast("מוצר עודכן");
    } else {
      await addProduct(productData);
    }
    setShowProductForm(false);
  };

  const handleDeleteProduct = async () => {
    if (deleteConfirm?.type === "product") {
      await deleteProduct(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // Export/Import
  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopping-list-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("הנתונים יוצאו בהצלחה");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
    } catch {
      showToast("שגיאה בייבוא הנתונים");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Password management
  const handleSetPassword = async () => {
    await updateSettings({ adminPassword: newPassword });
    setShowPasswordSetup(false);
    setNewPassword("");
    showToast(newPassword ? "סיסמה הוגדרה" : "סיסמה הוסרה");
  };

  // WhatsApp API settings
  const handleSaveWhatsAppSettings = async () => {
    await updateSettings({
      whatsappApiToken: whatsAppToken,
      whatsappInstanceId: whatsAppInstanceId,
      whatsappDefaultPhone: whatsAppDefaultPhone,
    });
    setShowWhatsAppSetup(false);
    showToast("הגדרות WhatsApp נשמרו");
  };

  // התנתקות מהחשבון
  const handleLogout = async () => {
    await authLogout();
    router.push("/");
  };

  const openWhatsAppSetup = () => {
    setWhatsAppToken(settings.whatsappApiToken || "");
    setWhatsAppInstanceId(settings.whatsappInstanceId || "");
    setWhatsAppDefaultPhone(settings.whatsappDefaultPhone || "");
    setShowWhatsAppSetup(true);
  };

  // Seed data handlers
  const handleLoadSeed = async () => {
    setIsLoadingSeed(true);
    try {
      await loadSeedData();
    } finally {
      setIsLoadingSeed(false);
      setShowSeedConfirm(false);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  // XML Import handlers
  const handleXmlImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importShufersalXML(text, 0, { // categoryId is ignored - auto-detected
        skipExisting: true,
        maxItems: xmlMaxItems || undefined,
      });
      showToast(`יובאו ${result.imported} מוצרים! (${result.skipped} קיימים, ${result.errors} שגיאות)`);
      setShowXmlImport(false);
    } catch (error) {
      console.error("XML Import error:", error);
      showToast("שגיאה בייבוא הקובץ");
    } finally {
      setIsImporting(false);
      if (xmlFileInputRef.current) {
        xmlFileInputRef.current.value = "";
      }
    }
  };

  const openXmlImportModal = () => {
    setShowXmlImport(true);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <header className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-muted transition-colors press-effect"
          >
            <ArrowRight size={24} />
          </button>
          <h1 className="text-xl font-bold text-foreground">ניהול</h1>
        </header>

        <div className="text-center py-8">
          <Lock size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-6">הזן סיסמת ניהול</h2>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="סיסמה"
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            כניסה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-muted transition-colors press-effect"
          >
            <ArrowRight size={24} />
          </button>
          <h1 className="text-xl font-bold text-foreground">ניהול</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: "categories" as Tab, label: "קטגוריות" },
          { id: "products" as Tab, label: "מוצרים" },
          { id: "family" as Tab, label: "משפחה" },
          { id: "settings" as Tab, label: "הגדרות" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div>
          <button
            onClick={() => openCategoryForm()}
            className="w-full flex items-center justify-center gap-2 p-4 bg-primary/10 border-2 border-dashed border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/20 transition-colors mb-4"
          >
            <Plus size={20} />
            הוסף קטגוריה
          </button>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
              >
                <div style={{ color: category.color }}>
                  <Icon name={category.icon} size={24} strokeWidth={1.5} />
                </div>
                <span className="flex-1 font-medium">{category.name}</span>
                <button
                  onClick={() => openCategoryForm(category)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: "category", id: category.id! })}
                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">אין קטגוריות עדיין</p>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div>
          <button
            onClick={() => openProductForm()}
            disabled={categories.length === 0}
            className="w-full flex items-center justify-center gap-2 p-4 bg-primary/10 border-2 border-dashed border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/20 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            הוסף מוצר
          </button>

          {categories.length === 0 && (
            <p className="text-center text-muted-foreground py-4">יש להוסיף קטגוריות לפני הוספת מוצרים</p>
          )}

          <div className="space-y-2">
            {products.map((product) => {
              const category = categories.find((c) => c.id === product.categoryId);
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                >
                  {product.imageUrl ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/50 shrink-0">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                      <Icon name={product.icon} size={24} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{category?.name}</p>
                  </div>
                  <button
                    onClick={() => openProductForm(product)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ type: "product", id: product.id! })}
                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          {products.length === 0 && categories.length > 0 && (
            <p className="text-center text-muted-foreground py-8">אין מוצרים עדיין</p>
          )}
        </div>
      )}

      {/* Family Tab */}
      {activeTab === "family" && (
        <FamilyManager />
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* App Mode Toggle */}
          <AppModeToggle />

          {/* Import from Shufersal/Rami Levy Section */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet size={20} />
              ייבוא נתונים אמיתיים
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              ייבא מוצרים מקובץ XML של שופרסל, רמי לוי או רשת אחרת (כולל מחירים וברקודים!)
            </p>
            <button
              onClick={openXmlImportModal}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <Upload size={18} />
              ייבא קובץ XML
            </button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {products.length > 0 && `יש כרגע ${products.length} מוצרים במערכת`}
            </p>
          </div>

          {/* Seed Data Section */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Database size={20} />
              נתוני ברירת מחדל
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              טען רשימת מוצרים בסיסית או נקה את כל הנתונים
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSeedConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                <RefreshCw size={18} />
                טען נתונים
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-destructive text-destructive-foreground font-medium rounded-xl hover:bg-destructive/90 transition-colors"
              >
                <Trash2 size={18} />
                נקה הכל
              </button>
            </div>
          </div>

          {/* WhatsApp API Settings */}
          <div className="bg-[#376e4b]/10 border border-[#376e4b]/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle size={20} className="text-[#376e4b]" />
                <div>
                  <p className="font-medium">WhatsApp API</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.whatsappApiToken ? "מחובר ✓" : "לא מוגדר"}
                  </p>
                </div>
              </div>
              <button
                onClick={openWhatsAppSetup}
                className="px-4 py-2 bg-[#376e4b] text-white rounded-lg hover:bg-[#2d5a3d] transition-colors"
              >
                {settings.whatsappApiToken ? "עדכן" : "הגדר"}
              </button>
            </div>
            {settings.whatsappDefaultPhone && (
              <p className="text-xs text-muted-foreground mt-2">
                מספר ברירת מחדל: {settings.whatsappDefaultPhone}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.adminPassword ? <Lock size={20} /> : <Unlock size={20} />}
                <div>
                  <p className="font-medium">סיסמת ניהול</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.adminPassword ? "מוגדרת" : "לא מוגדרת"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordSetup(true)}
                className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                {settings.adminPassword ? "שנה" : "הגדר"}
              </button>
            </div>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <Download size={20} />
            <div className="text-right">
              <p className="font-medium">ייצא נתונים</p>
              <p className="text-sm text-muted-foreground">שמור גיבוי של כל הנתונים</p>
            </div>
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <Upload size={20} />
            <div className="text-right">
              <p className="font-medium">ייבא נתונים</p>
              <p className="text-sm text-muted-foreground">שחזר מקובץ גיבוי</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          {/* התנתקות */}
          {user && (
            <div className="pt-4 border-t border-border mt-4">
              <div className="bg-card border border-border rounded-xl p-4 mb-3">
                <p className="text-sm text-muted-foreground">מחובר כ:</p>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.phone}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/20 transition-colors font-medium"
              >
                <LogOut size={20} />
                התנתק מהחשבון
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCategoryForm(false)} />
          <div className="relative bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCategoryForm(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold mb-6">
              {editingCategory ? "עריכת קטגוריה" : "קטגוריה חדשה"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="שם הקטגוריה"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">אייקון</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableIcons.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => setCategoryForm({ ...categoryForm, icon: iconName })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        categoryForm.icon === iconName
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                      title={iconName}
                    >
                      <Icon name={iconName} size={20} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">צבע</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setCategoryForm({ ...categoryForm, color: color.value })}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        categoryForm.color === color.value
                          ? "ring-2 ring-offset-2 ring-primary"
                          : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleCategorySubmit}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors mt-4"
              >
                {editingCategory ? "שמור שינויים" : "הוסף קטגוריה"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProductForm(false)} />
          <div className="relative bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProductForm(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold mb-6">
              {editingProduct ? "עריכת מוצר" : "מוצר חדש"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="שם המוצר"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">קטגוריה</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={0}>בחר קטגוריה</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">יחידה</label>
                <select
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value as ProductUnit })}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {PRODUCT_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תמונה (URL)</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  dir="ltr"
                />
                {productForm.imageUrl && (
                  <div className="mt-2 relative">
                    <img
                      src={productForm.imageUrl}
                      alt="תצוגה מקדימה"
                      className="w-20 h-20 object-cover rounded-xl border border-border mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">אייקון (חלופה לתמונה)</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableIcons.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => setProductForm({ ...productForm, icon: iconName })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        productForm.icon === iconName
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                      title={iconName}
                    >
                      <Icon name={iconName} size={20} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProductSubmit}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors mt-4"
              >
                {editingProduct ? "שמור שינויים" : "הוסף מוצר"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-2xl p-6 shadow-xl max-w-sm mx-4 text-center">
            <div className="text-destructive mb-4">
              <Trash2 size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {deleteConfirm.type === "category" ? "מחק קטגוריה?" : "מחק מוצר?"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {deleteConfirm.type === "category"
                ? "כל המוצרים בקטגוריה יימחקו גם כן"
                : "המוצר יוסר לצמיתות"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-muted text-muted-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={deleteConfirm.type === "category" ? handleDeleteCategory : handleDeleteProduct}
                className="flex-1 py-3 bg-destructive text-destructive-foreground font-medium rounded-xl hover:bg-destructive/90 transition-colors"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Setup Modal */}
      {showPasswordSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordSetup(false)} />
          <div className="relative bg-card rounded-2xl p-6 shadow-xl max-w-sm mx-4">
            <h2 className="text-xl font-bold mb-4">הגדר סיסמה</h2>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="סיסמה חדשה (השאר ריק להסרה)"
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordSetup(false)}
                className="flex-1 py-3 bg-muted text-muted-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSetPassword}
                className="flex-1 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Confirmation Modal */}
      {showSeedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isLoadingSeed && setShowSeedConfirm(false)} />
          <div className="relative bg-card rounded-2xl p-6 shadow-xl max-w-sm mx-4 text-center">
            <div className="text-primary mb-4">
              {isLoadingSeed ? (
                <Loader2 size={48} className="mx-auto animate-spin" />
              ) : (
                <Database size={48} className="mx-auto" />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2">
              {isLoadingSeed ? 'טוען נתונים...' : 'טען נתוני ברירת מחדל?'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLoadingSeed 
                ? 'אנא המתן, מוסיף קטגוריות ומוצרים למערכת...' 
                : 'פעולה זו תמחק את כל הנתונים הקיימים ותטען רשימת מוצרים בסיסית'}
            </p>
            {!isLoadingSeed && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSeedConfirm(false)}
                  className="flex-1 py-3 bg-muted text-muted-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleLoadSeed}
                  className="flex-1 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  טען נתונים
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isClearing && setShowClearConfirm(false)} />
          <div className="relative bg-card rounded-2xl p-6 shadow-xl max-w-sm mx-4 text-center">
            <div className="text-destructive mb-4">
              {isClearing ? (
                <Loader2 size={48} className="mx-auto animate-spin" />
              ) : (
                <Trash2 size={48} className="mx-auto" />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2">
              {isClearing ? 'מוחק נתונים...' : 'נקה את כל הנתונים?'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isClearing 
                ? 'אנא המתן...' 
                : 'פעולה זו תמחק את כל הקטגוריות, המוצרים ורשימת הקניות. לא ניתן לשחזר!'}
            </p>
            {!isClearing && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-muted text-muted-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-3 bg-destructive text-destructive-foreground font-medium rounded-xl hover:bg-destructive/90 transition-colors"
                >
                  נקה הכל
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* XML Import Modal */}
      {showXmlImport && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isImporting && setShowXmlImport(false)} />
          <div className="relative bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl">
            <button
              onClick={() => !isImporting && setShowXmlImport(false)}
              disabled={isImporting}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">ייבוא נתונים מסופר</h2>
              <p className="text-sm text-muted-foreground mt-1">
                ייבא מוצרים מקובץ XML של שופרסל / רמי לוי
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  ✨ <strong>חכם!</strong> המערכת תזהה אוטומטית את הקטגוריה לכל מוצר
                  (חלב, בשר, פירות, ניקיון וכו')
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  מקסימום מוצרים לייבוא
                </label>
                <input
                  type="number"
                  value={xmlMaxItems}
                  onChange={(e) => setXmlMaxItems(Number(e.target.value))}
                  disabled={isImporting}
                  placeholder="השאר ריק ליבוא הכל"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  מומלץ להתחיל ב-500 מוצרים ולהוסיף בהדרגה
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  💡 <strong>טיפ:</strong> הורד קבצי XML מאתר שקיפות המחירים של הרשתות או מ-
                  <code className="bg-amber-200/50 dark:bg-amber-800/50 px-1 rounded">prices.shufersal.co.il</code>
                </p>
              </div>

              <button
                onClick={() => xmlFileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    מייבא מוצרים...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    בחר קובץ XML
                  </>
                )}
              </button>

              <input
                ref={xmlFileInputRef}
                type="file"
                accept=".xml,text/xml"
                onChange={handleXmlImport}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp API Setup Modal */}
      {showWhatsAppSetup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowWhatsAppSetup(false)} />
          <div className="relative bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowWhatsAppSetup(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#376e4b]/10 dark:bg-[#376e4b]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-[#376e4b] dark:text-[#4a9165]" />
              </div>
              <h2 className="text-xl font-bold">הגדרות WhatsApp API</h2>
              <p className="text-sm text-muted-foreground mt-1">
                חבר את True Story לשליחת הודעות
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Token / Instance ID</label>
                <input
                  type="text"
                  value={whatsAppToken}
                  onChange={(e) => setWhatsAppToken(e.target.value)}
                  placeholder="הזן את ה-Token מהדשבורד"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#376e4b]/50"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  נמצא ב-Dashboard לאחר חיבור WhatsApp
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Instance ID</label>
                <input
                  type="text"
                  value={whatsAppInstanceId}
                  onChange={(e) => setWhatsAppInstanceId(e.target.value)}
                  placeholder="הזן את Instance ID"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#376e4b]/50"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">מספר טלפון ברירת מחדל</label>
                <input
                  type="tel"
                  value={whatsAppDefaultPhone}
                  onChange={(e) => setWhatsAppDefaultPhone(e.target.value)}
                  placeholder="05X-XXX-XXXX"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#376e4b]/50"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  המספר שאליו תישלח הרשימה בברירת מחדל
                </p>
              </div>

              <div className="bg-[#376e4b]/10 dark:bg-[#376e4b]/20 border border-[#376e4b]/30 dark:border-[#376e4b]/50 rounded-xl p-3">
                <p className="text-sm text-[#376e4b] dark:text-[#4a9165]">
                  💡 <strong>איך להתחבר?</strong>
                  <br />
                  1. היכנס ל-<a href="https://true-story.net" target="_blank" rel="noopener" className="underline">true-story.net</a>
                  <br />
                  2. חבר את WhatsApp שלך
                  <br />
                  3. העתק את ה-Instance ID (הוא גם ה-Token)
                </p>
              </div>

              <button
                onClick={handleSaveWhatsAppSettings}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#376e4b] text-white font-bold rounded-xl hover:bg-[#2d5a3d] transition-colors"
              >
                <Send size={20} />
                שמור הגדרות
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
