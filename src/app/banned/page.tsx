"use client";

import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, LogOut, MessageSquare } from "lucide-react";

export default function BannedPage() {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-rose-100 p-10 text-center space-y-8 animate-in zoom-in-95">
        
        <div className="flex justify-center">
           <div className="p-6 rounded-[2.5rem] bg-rose-50 text-rose-600 shadow-xl shadow-rose-100/50">
              <ShieldAlert size={48} />
           </div>
        </div>

        <div className="space-y-2">
           <h1 className="text-3xl font-black text-slate-900 font-heading tracking-tight">Access Restricted</h1>
           <p className="text-slate-500 font-medium leading-relaxed">
              Your account has been deactivated by the Super Admin. You no longer have access to the family's financial dashboard.
           </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-left space-y-4">
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-400">
                 <MessageSquare size={18} />
              </div>
              <div className="flex-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                 <p className="text-sm font-bold text-slate-900">Please contact the family administrator or developer (info.ryanabir@gmail.com) for more information regarding your status.</p>
              </div>
           </div>
        </div>

        <button 
           onClick={logout}
           className="w-full bg-slate-900 text-white rounded-[2rem] py-5 px-8 font-black font-heading tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl hover:shadow-slate-200 hover:bg-black transition-all hover:-translate-y-1 active:scale-95"
        >
           <LogOut size={18} />
           <span>LOG OUT OF {profile?.email}</span>
        </button>

      </div>
    </div>
  );
}
