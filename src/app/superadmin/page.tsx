"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  Shield, 
  Users, 
  Phone, 
  Calendar, 
  Package, 
  FolderOpen, 
  ListChecks, 
  MessageCircle,
  LogIn,
  Loader2,
  ArrowRight,
  Check,
  X,
  Crown,
  RefreshCcw
} from "lucide-react";

interface Family {
  id: number;
  name: string;
  is_owner: boolean;
  created_at: string;
  categories_count: number;
  products_count: number;
  list_items_count: number;
  members_count: number;
}

interface WhatsAppSettings {
  whatsapp_api_url: string | null;
  whatsapp_instance_id: string | null;
  whatsapp_token: boolean;
  whatsapp_default_phone: string | null;
}

interface User {
  id: number;
  phone: string;
  name: string;
  created_at: string;
  families: Family[] | null;
  whatsapp_settings: WhatsAppSettings | null;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [impersonating, setImpersonating] = useState<number | null>(null);
  const [isImpersonated, setIsImpersonated] = useState(false);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_USER || "0542284283";

  useEffect(() => {
    fetchUsers();
    checkImpersonation();
  }, []);

  const checkImpersonation = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      // Check if there's an original_admin_phone cookie (meaning we're impersonating)
      setIsImpersonated(data.user?.phone !== adminPhone && document.cookie.includes("original_admin_phone"));
    } catch {
      // Ignore
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/superadmin/users");
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("אין הרשאת גישה. רק סופר אדמין יכול לצפות בעמוד זה.");
        } else {
          setError(data.error || "שגיאה בטעינת המשתמשים");
        }
        return;
      }
      
      setUsers(data.users || []);
    } catch {
      setError("שגיאה בטעינת המשתמשים");
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (userId: number) => {
    setImpersonating(userId);
    try {
      const res = await fetch("/api/superadmin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        await refreshAuth();
        router.push("/list");
      } else {
        setError(data.error || "שגיאה בהתחברות");
      }
    } catch {
      setError("שגיאה בהתחברות");
    } finally {
      setImpersonating(null);
    }
  };

  const handleReturnToAdmin = async () => {
    try {
      const res = await fetch("/api/superadmin/return", {
        method: "POST",
      });
      
      if (res.ok) {
        await refreshAuth();
        router.push("/superadmin");
        window.location.reload();
      }
    } catch {
      setError("שגיאה בחזרה לאדמין");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-[#376e4b] mx-auto mb-4" />
          <p className="text-[#376e4b] font-bold text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">גישה נדחתה</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/superadmin/login")}
              className="w-full bg-[#376e4b] text-white font-bold py-3 px-6 rounded-full hover:bg-[#2d5a3d] transition-colors"
            >
              התחבר כסופר אדמין
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full text-gray-500 font-bold py-2 hover:text-[#376e4b] transition-colors"
            >
              חזרה לדף הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner */}
      {isImpersonated && (
        <div className="bg-[#da291c] text-white py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="font-bold">אתה מחובר בשם משתמש אחר</span>
            <button
              onClick={handleReturnToAdmin}
              className="bg-white text-[#da291c] font-bold py-1.5 px-4 rounded-full text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <ArrowRight size={16} />
              חזור לאדמין
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#376e4b] text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#ffbc0d] rounded-xl flex items-center justify-center">
                <Shield size={28} className="text-[#376e4b]" />
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-mc)' }}>
                  סופר אדמין
                </h1>
                <p className="text-white/80 font-bold">ניהול משתמשים ומשפחות</p>
              </div>
            </div>
            <button
              onClick={fetchUsers}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
              title="רענן"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-black text-[#376e4b]">{users.length}</div>
            <div className="text-sm font-bold text-gray-500">משתמשים רשומים</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-[#376e4b]">
              {users.filter(u => u.families && u.families.length > 0).length}
            </div>
            <div className="text-sm font-bold text-gray-500">עם קבוצות</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-[#376e4b]">
              {users.filter(u => u.whatsapp_settings?.whatsapp_token).length}
            </div>
            <div className="text-sm font-bold text-gray-500">חיברו וואטסאפ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-[#376e4b]">
              {users.reduce((acc, u) => acc + (u.families?.reduce((a, f) => a + f.products_count, 0) || 0), 0)}
            </div>
            <div className="text-sm font-bold text-gray-500">מוצרים סה״כ</div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
          <Users size={24} />
          משתמשים ({users.length})
        </h2>
        
        <div className="space-y-4">
          {users.map((u) => (
            <div 
              key={u.id} 
              className="bg-white rounded-2xl shadow-md overflow-hidden"
            >
              {/* User Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#ffbc0d] rounded-full flex items-center justify-center text-[#376e4b] font-black text-lg">
                      {u.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-800">{u.name || "ללא שם"}</span>
                        {u.phone === adminPhone && (
                          <span className="bg-[#da291c] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            אדמין
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {u.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(u.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Quick Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Crown size={16} className="text-[#ffbc0d]" />
                        <span>{u.families?.filter(f => f.is_owner).length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <FolderOpen size={16} />
                        <span>{u.families?.reduce((a, f) => a + f.categories_count, 0) || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Package size={16} />
                        <span>{u.families?.reduce((a, f) => a + f.products_count, 0) || 0}</span>
                      </div>
                      {u.whatsapp_settings?.whatsapp_token ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <X size={18} className="text-gray-300" />
                      )}
                    </div>
                    
                    {/* Impersonate Button */}
                    {u.phone !== user?.phone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImpersonate(u.id);
                        }}
                        disabled={impersonating === u.id}
                        className="bg-[#376e4b] hover:bg-[#2d5a3d] text-white font-bold py-2 px-4 rounded-full text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {impersonating === u.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <LogIn size={16} />
                        )}
                        <span className="hidden sm:inline">התחבר בשמו</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedUser === u.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {/* Families */}
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Users size={16} />
                      קבוצות ({u.families?.length || 0})
                    </h4>
                    {u.families && u.families.length > 0 ? (
                      <div className="grid gap-2">
                        {u.families.map((f) => (
                          <div key={f.id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-[#376e4b]">{f.name}</span>
                              {f.is_owner && (
                                <Crown size={14} className="text-[#ffbc0d]" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users size={14} />
                                {f.members_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <FolderOpen size={14} />
                                {f.categories_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package size={14} />
                                {f.products_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <ListChecks size={14} />
                                {f.list_items_count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">אין קבוצות</p>
                    )}
                  </div>

                  {/* WhatsApp Settings */}
                  <div>
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <MessageCircle size={16} />
                      הגדרות וואטסאפ
                    </h4>
                    {u.whatsapp_settings ? (
                      <div className="bg-white rounded-xl p-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">API URL:</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {u.whatsapp_settings.whatsapp_api_url || "לא הוגדר"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Instance ID:</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {u.whatsapp_settings.whatsapp_instance_id || "לא הוגדר"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Token:</span>
                          {u.whatsapp_settings.whatsapp_token ? (
                            <span className="text-green-500 flex items-center gap-1">
                              <Check size={14} />
                              מוגדר
                            </span>
                          ) : (
                            <span className="text-gray-400">לא מוגדר</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">טלפון ברירת מחדל:</span>
                          <span>{u.whatsapp_settings.whatsapp_default_phone || "לא הוגדר"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">לא הוגדרו הגדרות</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

