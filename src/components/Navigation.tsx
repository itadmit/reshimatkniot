"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, Search, History } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  isActive: boolean;
}

function NavItem({ href, icon, label, badge, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all press-effect relative ${
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

interface NavigationProps {
  sidebarOpen?: boolean;
}

export function Navigation({ sidebarOpen = false }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/list", icon: <Home size={24} />, label: "בית" },
    { href: "/search", icon: <Search size={24} />, label: "חיפוש" },
    { href: "/history", icon: <History size={24} />, label: "היסטוריה" },
    { href: "/admin", icon: <Settings size={24} />, label: "ניהול" },
  ];

  return (
    <nav className={`fixed bottom-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 safe-area-inset-bottom transition-all duration-300 ${
      sidebarOpen ? 'left-80 sm:left-96' : 'left-0'
    }`}>
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={
              item.href === "/list" 
                ? pathname === "/list" || pathname.startsWith("/category/")
                : pathname === item.href || pathname.startsWith(item.href + "/")
            }
          />
        ))}
      </div>
    </nav>
  );
}

