"use client";

import { useStore } from "@/store/useStore";
import { X } from "lucide-react";

export function Toast() {
  const { toastMessage, hideToast } = useStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div className="toast-enter pointer-events-auto bg-card border border-border shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 max-w-md">
        <span className="text-card-foreground font-medium flex-1">{toastMessage}</span>
        <button
          onClick={hideToast}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

