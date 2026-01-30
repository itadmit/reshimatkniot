"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Phone, Loader2, ArrowLeft } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Try to login with this phone
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/superadmin");
      } else {
        setError(data.error || "אין הרשאת גישה");
      }
    } catch {
      setError("שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#376e4b] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={40} className="text-[#ffbc0d]" />
          </div>
          <h1 className="text-3xl font-black text-[#376e4b]" style={{ fontFamily: 'var(--font-mc)' }}>
            סופר אדמין
          </h1>
          <p className="text-gray-500 font-bold mt-2">
            הזן את מספר הטלפון של האדמין
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="מספר טלפון"
              className="w-full pr-12 pl-4 py-4 border-2 border-gray-200 rounded-xl text-lg font-bold focus:border-[#376e4b] focus:ring-2 focus:ring-[#376e4b]/20 outline-none transition-all"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-center font-bold py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full bg-[#376e4b] hover:bg-[#2d5a3d] text-white font-black text-xl py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span>כניסה</span>
                <ArrowLeft size={20} />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <button
          onClick={() => router.push("/")}
          className="w-full mt-4 text-gray-500 font-bold py-2 hover:text-[#376e4b] transition-colors"
        >
          חזרה לדף הבית
        </button>
      </div>
    </div>
  );
}

