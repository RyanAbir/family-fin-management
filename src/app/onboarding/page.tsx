"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus, LogOut, Sparkle } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  if (profile?.familyMemberId) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Intro Section */}
        <div className="flex flex-col justify-center p-8 lg:p-12 space-y-6">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <Sparkle size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 font-heading tracking-tight leading-tight">
              Welcome to your <br /><span className="text-indigo-600 italic">Financial Legacy.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              To keep your family's records secure and accurate, we need to link your login to your member identity. 
            </p>
          </div>
          
          <button 
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-rose-600 transition-colors"
          >
            <LogOut size={16} />
            Sign out of {profile?.email}
          </button>
        </div>

        {/* Action Cards */}
        <div className="space-y-6 flex flex-col justify-center">
          
          <Link href="/onboarding/claim" className="group">
            <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 hover:border-indigo-100 transition-all flex items-start gap-6">
              <div className="p-4 rounded-3xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <UserCheck size={28} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-heading tracking-tight">Claim My Profile</h3>
                <p className="text-sm text-slate-400 font-medium">I'm already in the family member list. Let me select my name.</p>
              </div>
            </div>
          </Link>

          <Link href="/onboarding/create" className="group">
            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-500/10 transition-all flex items-start gap-6">
              <div className="p-4 rounded-3xl bg-white/10 text-white group-hover:bg-white group-hover:text-slate-900 transition-colors">
                <UserPlus size={28} />
              </div>
              <div className="flex-1 space-y-1 text-white">
                <h3 className="text-xl font-black font-heading tracking-tight">Create New Profile</h3>
                <p className="text-sm text-slate-500 font-medium">I'm new here. Create an inherited member record for me automatically.</p>
              </div>
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}
