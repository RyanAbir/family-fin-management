"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createFamilyMember } from "@/lib/db/familyMembers";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserPlus, ArrowLeft, Send, Sparkle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    relation: "son" as "son" | "daughter" | "mother",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name || !formData.relation) return;

    setLoading(true);
    try {
      // 1. Create the base inherited member profile
      const memberId = await createFamilyMember({
        name: formData.name,
        relation: formData.relation,
        gender: formData.relation === 'son' ? 'male' : 'female',
        isActive: true,
        linkedUid: user.uid,
        linkedEmail: user.email || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // 2. Link the user account to this new profile
      await updateDoc(doc(db, "userProfiles", user.uid), {
        familyMemberId: memberId,
        relation: formData.relation,
        gender: formData.relation === 'son' ? 'male' : 'female',
        displayName: formData.name, // Sync display name
        updatedAt: serverTimestamp(),
      });

      toast.success("Inherited Membership status granted.");
      router.push("/");
    } catch (err) {
      console.error("Error creating profile:", err);
      toast.error("Failed to set up inherited membership. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        
        <div className="mb-10 flex items-center justify-between">
           <Link href="/onboarding" className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm">
             <ArrowLeft size={20} />
           </Link>
           <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 font-heading tracking-tight leading-none text-indigo-600">Register New Identity</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Setup Your Inherited Identity</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
           <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-2xl shadow-indigo-100/50 space-y-8 animate-in slide-in-from-bottom-5 duration-500">
              
              <div className="flex justify-center -mt-16">
                 <div className="p-5 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200">
                    <UserPlus size={40} />
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Legal Identity (Name) 📜</label>
                    <input 
                       type="text" 
                       required
                       placeholder="Enter your full name..."
                       className="w-full bg-slate-50 border border-transparent rounded-2xl py-4 px-6 text-slate-900 font-bold focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
                       value={formData.name}
                       onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-4 text-center italic">Specify your Relation to the Legacy 🏛️</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       {/* Son Button */}
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, relation: "son" }))}
                          className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 group ${
                             formData.relation === 'son' 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105" 
                                : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                          }`}
                       >
                          <div className={`p-3 rounded-2xl ${formData.relation === 'son' ? 'bg-white/20' : 'bg-slate-50'} transition-all`}>
                             <span className="text-2xl">👦</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Son</span>
                          <span className={`text-[9px] font-bold opacity-60 ${formData.relation === 'son' ? 'text-white' : 'text-slate-400'}`}>Share: 2.0x</span>
                       </button>

                       {/* Daughter Button */}
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, relation: "daughter" }))}
                          className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 group ${
                             formData.relation === 'daughter' 
                                ? "bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-200 scale-105" 
                                : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                          }`}
                       >
                          <div className={`p-3 rounded-2xl ${formData.relation === 'daughter' ? 'bg-white/20' : 'bg-slate-50'} transition-all`}>
                             <span className="text-2xl">👧</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Daughter</span>
                          <span className={`text-[9px] font-bold opacity-60 ${formData.relation === 'daughter' ? 'text-white' : 'text-slate-400'}`}>Share: 1.0x</span>
                       </button>
                       
                       {/* Mother Button */}
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, relation: "mother" }))}
                          className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 group ${
                             formData.relation === 'mother' 
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105" 
                                : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                          }`}
                       >
                          <div className={`p-3 rounded-2xl ${formData.relation === 'mother' ? 'bg-white/20' : 'bg-slate-50'} transition-all`}>
                             <span className="text-2xl">🧕</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Mother</span>
                          <span className={`text-[9px] font-bold opacity-60 ${formData.relation === 'mother' ? 'text-white' : 'text-slate-400'}`}>Share: 1.0x</span>
                       </button>
                    </div>
                 </div>

                 <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 flex gap-4 items-start">
                    <ShieldCheck size={20} className="text-indigo-600 shrink-0 mt-1" />
                    <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-tight">
                       This action will permanently create an Inherited Member record for you in the family legacy books. This status is required for property share distribution.
                    </p>
                 </div>
              </div>

              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-slate-900 group-hover:bg-indigo-600 text-white rounded-[2rem] py-5 px-8 font-black font-heading tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl hover:shadow-indigo-200 hover:bg-indigo-600 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
              >
                 {loading ? <Sparkle className="animate-spin" size={18} /> : <Send size={18} />}
                 <span>FINALIZE MEMBERSHIP</span>
              </button>
           </div>
        </form>

      </div>
    </div>
  );
}
