"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/store/useStore';
import { Wifi, WifiOff, Users, LogIn, LogOut, Loader2 } from 'lucide-react';

export function AppModeToggle() {
  const router = useRouter();
  const { user, isAuthenticated, currentFamily, logout } = useAuth();
  const { settings, updateSettings } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleModeChange = async (mode: 'offline' | 'family') => {
    if (mode === 'family' && !isAuthenticated) {
      // Redirect to login
      router.push('/login');
      return;
    }

    await updateSettings({ appMode: mode });
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      await updateSettings({ appMode: 'offline' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentMode = settings.appMode || 'offline';

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          currentMode === 'family' ? 'bg-[#376e4b]/10 dark:bg-[#376e4b]/20' : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          {currentMode === 'family' ? (
            <Users className="text-[#376e4b]" size={20} />
          ) : (
            <WifiOff className="text-gray-500" size={20} />
          )}
        </div>
        <div>
          <h3 className="font-bold text-foreground">מצב אפליקציה</h3>
          <p className="text-sm text-muted-foreground">
            {currentMode === 'family' ? 'מצב משפחה - סנכרון בזמן אמת' : 'מצב אופליין - נתונים מקומיים'}
          </p>
        </div>
      </div>

      {/* Mode Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleModeChange('offline')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${
            currentMode === 'offline'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80 text-foreground'
          }`}
        >
          <WifiOff size={18} />
          <span>אופליין</span>
        </button>
        <button
          onClick={() => handleModeChange('family')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${
            currentMode === 'family'
              ? 'bg-[#376e4b] text-white'
              : 'bg-secondary hover:bg-secondary/80 text-foreground'
          }`}
        >
          <Users size={18} />
          <span>משפחה</span>
        </button>
      </div>

      {/* User Info (if in family mode) */}
      {currentMode === 'family' && isAuthenticated && (
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentFamily?.name || 'לא בקבוצה'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <LogOut size={18} />
              )}
              <span>התנתק</span>
            </button>
          </div>
        </div>
      )}

      {/* Login Button (if in family mode but not logged in) */}
      {currentMode === 'family' && !isAuthenticated && (
        <div className="pt-3 border-t border-border">
          <button
            onClick={() => router.push('/login')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#376e4b] text-white font-bold rounded-xl hover:bg-[#2d5a3d] transition-colors"
          >
            <LogIn size={18} />
            <span>התחבר למצב משפחה</span>
          </button>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
        {currentMode === 'offline' ? (
          <p>
            <strong>מצב אופליין:</strong> הנתונים נשמרים רק במכשיר הזה. 
            לא נדרשת התחברות, אבל אין סנכרון בין מכשירים.
          </p>
        ) : (
          <p>
            <strong>מצב משפחה:</strong> הנתונים מסונכרנים בזמן אמת עם כל חברי המשפחה. 
            ניתן להוסיף חברים בלשונית "משפחה".
          </p>
        )}
      </div>
    </div>
  );
}

