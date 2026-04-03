"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAllFamilyMembers, updateFamilyMember } from "@/lib/db/familyMembers";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { FamilyMember } from "@/types";
import { ChevronRight, ArrowLeft, Search, UserCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/SkeletonLoaders";

export default function ClaimProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUnclaimed = async () => {
      try {
        const allMembers = await getAllFamilyMembers();
        // Filter for active and unclaimed members
        setMembers(allMembers.filter(m => m.isActive && !m.linkedUid));
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnclaimed();
  }, []);

  const handleClaim = async (memberId: string) => {
    if (!user) return;
    setClaimingId(memberId);
    try {
      // 1. Update user profile with familyMemberId
      await updateDoc(doc(db, "userProfiles", user.uid), {
        familyMemberId: memberId,
        updatedAt: serverTimestamp()
      });

      // 2. Update family member record with linkedUid
      await updateFamilyMember(memberId, {
        linkedUid: user.uid,
        linkedEmail: user.email || undefined,
        updatedAt: new Date()
      } as any);

      toast.success("Profile claimed successfully!");
      router.push("/");
    } catch (err) {
      console.error("Error claiming profile:", err);
      toast.error("Failed to claim profile. Please try again.");
    } finally {
      setClaimingId(null);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8">
        
        <div className="flex items-center justify-between">
           <Link href="/onboarding" className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm">
             <ArrowLeft size={20} />
           </Link>
           <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 font-heading tracking-tight leading-none">Claim Your Identity</h2>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Select your name from the list</p>
           </div>
        </div>

        <div className="relative group">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Search size={18} />
           </div>
           <input 
              type="text" 
              placeholder="Search for your name..." 
              className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-12 pr-4 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
             [1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-3xl" />)
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleClaim(member.id)}
                disabled={claimingId !== null}
                className="w-full group/item"
              >
                <div className={`p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm transition-all flex items-center justify-between ${
                  claimingId === member.id ? "opacity-50" : "hover:shadow-2xl hover:shadow-indigo-100 hover:border-indigo-100 hover:-translate-y-1"
                }`}>
                  <div className="flex items-center gap-4 text-left">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                        <UserCheck size={20} />
                     </div>
                     <div className="min-w-0">
                        <h4 className="text-lg font-black text-slate-900 font-heading truncate leading-tight">{member.name}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 capitalize">{member.gender || "Member"}</p>
                     </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover/item:text-indigo-400 group-hover/item:translate-x-1 transition-all" />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-20 animate-in fade-in zoom-in-95">
               <p className="text-slate-400 font-black uppercase tracking-widest italic opacity-50">No unclaimed profiles found.</p>
               <Link href="/onboarding/create" className="text-sm text-indigo-600 font-black underline mt-2 block">Create a new one instead?</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
