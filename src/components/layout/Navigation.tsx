"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Building2, 
  Users, 
  Percent, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  History 
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Family Members", href: "/family-members", icon: Users },
  { name: "Ownership Shares", href: "/ownership-shares", icon: Percent },
  { name: "Income", href: "/income", icon: TrendingUp },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Member Payouts", href: "/payouts", icon: Wallet },
  { name: "Distribution", href: "/distribution", icon: History },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white p-6">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Family Finance</h1>
        <p className="text-sm text-slate-500">Portfolio Dashboard</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6 border-t border-slate-100 px-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Version 1.0.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">F</div>
          <span className="font-bold text-slate-900 tracking-tight">Family Finance</span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
        >
          <X size={20} />
        </button>
        <NavContent />
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:border-r lg:border-slate-200">
        <NavContent />
      </aside>
    </>
  );
}
