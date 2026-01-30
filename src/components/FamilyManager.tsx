"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Users, Plus, Trash2, Crown, UserPlus, X, Loader2, Check, Copy } from 'lucide-react';

interface FamilyMember {
  id: number;
  name: string;
  phone: string;
  role: string;
}

interface FamilyData {
  family: { id: number; name: string; role: string };
  members: FamilyMember[];
}

export function FamilyManager() {
  const { user, currentFamily, families, switchFamily } = useAuth();
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchFamilyData = async () => {
    if (!currentFamily) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/family');
      if (res.ok) {
        const data = await res.json();
        setFamilyData(data);
      }
    } catch (error) {
      console.error('Failed to fetch family data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentFamily) {
      fetchFamilyData();
    }
  }, [currentFamily]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/family/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newMemberPhone, name: newMemberName })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess(`${data.member.name} נוסף/ה לקבוצה!`);
        setNewMemberPhone('');
        setNewMemberName('');
        setShowAddMember(false);
        fetchFamilyData();
      }
    } catch (error) {
      setError('שגיאה בהוספת חבר');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!confirm(`להסיר את ${memberName} מהקבוצה?`)) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/family/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        fetchFamilyData();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFamilyName })
      });

      if (res.ok) {
        setNewFamilyName('');
        setShowCreateFamily(false);
        // Refresh auth to get updated families list
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create family:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">יש להתחבר כדי לנהל קבוצות</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Family Header */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Users className="text-amber-600" size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">
                {familyData?.family.name || currentFamily?.name || 'הקבוצה שלי'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {familyData?.members.length || 0} חברים
              </p>
            </div>
          </div>
          
          {familyData?.family.role === 'owner' && (
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              <UserPlus size={18} />
              <span>הוסף חבר</span>
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-[#376e4b]/10 dark:bg-[#376e4b]/20 border border-[#376e4b]/30 dark:border-[#376e4b]/50 text-[#376e4b] dark:text-[#4a9165] px-4 py-2 rounded-xl mb-4 flex items-center gap-2">
            <Check size={18} />
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2">
          {familyData?.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{member.name}</span>
                    {member.role === 'owner' && (
                      <Crown size={14} className="text-amber-500" fill="currentColor" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{member.phone}</span>
                </div>
              </div>

              {familyData?.family.role === 'owner' && member.id !== user.id && (
                <button
                  onClick={() => handleRemoveMember(member.id, member.name)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Switch Family */}
      {families.length > 1 && (
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <h4 className="font-bold text-foreground mb-3">החלף קבוצה</h4>
          <div className="flex flex-wrap gap-2">
            {families.map((family) => (
              <button
                key={family.id}
                onClick={() => switchFamily(family.id)}
                className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                  currentFamily?.id === family.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                {family.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create New Family */}
      <button
        onClick={() => setShowCreateFamily(true)}
        className="w-full bg-secondary hover:bg-secondary/80 text-foreground p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={20} />
        <span>צור קבוצה חדשה</span>
      </button>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-foreground">הוסף חבר לקבוצה</h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">
                  מספר טלפון
                </label>
                <input
                  type="tel"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="050-1234567"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl font-bold focus:border-amber-400 focus:ring-0 outline-none transition-colors bg-background"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">
                  שם (אופציונלי)
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="השם של החבר"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl font-bold focus:border-amber-400 focus:ring-0 outline-none transition-colors bg-background"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                <span>הוסף לקבוצה</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Family Modal */}
      {showCreateFamily && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-foreground">צור קבוצה חדשה</h3>
              <button
                onClick={() => setShowCreateFamily(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">
                  שם הקבוצה
                </label>
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="לדוגמה: רשימת עבודה"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl font-bold focus:border-amber-400 focus:ring-0 outline-none transition-colors bg-background"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                <span>צור קבוצה</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

