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
  History,
  LogOut,
  Settings,
  ChevronRight,
  User as UserIcon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "./NotificationBell";

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

function NavContent() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  
  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8">
        <Link 
          href="/" 
          className="flex items-center gap-4 mb-2 group/logo hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-2xl shadow-indigo-200 ring-4 ring-indigo-50 text-xl font-heading group-hover/logo:scale-105 transition-transform">F</div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading leading-tight italic">Family Finance</h1>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] opacity-80">Portfolio v1.1</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 p-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between group px-5 py-3.5 rounded-2xl text-sm font-bold transition-all relative overflow-hidden ${
                isActive 
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3.5 z-10">
                <item.icon size={18} className={isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-600 transition-colors"} />
                <span className="tracking-tight">{item.name}</span>
              </div>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none opacity-50" />
              )}
              {isActive && <ChevronRight size={14} className="text-indigo-400 z-10" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-50 space-y-5 bg-gradient-to-b from-white to-slate-50/50">
        <Link 
          href="/settings/profile"
          className="flex items-center gap-4 p-4 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group/profile cursor-pointer"
        >
           <div className="relative">
              <img 
                src={profile?.photoURL || user?.photoURL || ""} 
                alt={profile?.displayName || user?.displayName || ""} 
                className="w-12 h-12 rounded-full border-2 border-white shadow-xl object-cover ring-2 ring-slate-50 transition-all group-hover/profile:ring-indigo-100"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-white scale-0 group-hover/profile:scale-110 transition-transform shadow-lg">
                <Settings size={12} strokeWidth={3} />
              </div>
           </div>
          <div className="flex-1 min-w-0">
             <p className="text-sm font-black text-slate-900 truncate group-hover/profile:text-indigo-600 transition-colors font-heading">
                {profile?.displayName || user?.displayName}
             </p>
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mt-0.5">
                {profile?.role || "Viewer"}
             </p>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover/profile:text-indigo-400 group-hover/profile:translate-x-1 transition-all" />
        </Link>

        <div className="space-y-1 px-2">
          <Link 
            href="/settings/members"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              pathname === "/settings/members" 
                ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                : "text-slate-400 hover:bg-white hover:text-slate-900"
            }`}
          >
            <Users size={16} className={pathname === "/settings/members" ? "text-indigo-600" : "text-slate-300"} />
            <span>Family Settings</span>
          </Link>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all group/logout"
            title="Logout"
          >
            <LogOut size={16} className="text-slate-300 group-hover/logout:text-rose-500 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="px-6 pb-2">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] text-center italic">Portfolio Security v1.1.0</p>
        </div>
      </div>
    </div>
  );
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

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

  if (loading || !user || pathname === "/login") return null;

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold transition-transform active:scale-95">F</div>
          <span className="font-bold text-slate-900 tracking-tight">Family Finance</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-[1200] w-72 bg-white transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl ${
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
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:border-r lg:border-slate-200 shadow-sm z-[1000]">
        <div className="absolute top-4 right-4 z-[100]">
           <NotificationBell />
        </div>
        <NavContent />
      </aside>
    </>
  );
}
