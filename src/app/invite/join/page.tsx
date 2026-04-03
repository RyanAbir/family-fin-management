"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { validateInvitation, useInvitation } from "@/lib/db/invites";
import { UserPlus, CheckCircle, XCircle, LogIn } from "lucide-react";
import { toast } from "sonner";

function InviteJoinContent() {
  const { user, profile, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setError("Missing invitation token.");
        setChecking(false);
        return;
      }

      const result = await validateInvitation(token);
      if (result.valid) {
        setInvitation(result.invite);
      } else {
        setError(result.message || "Invalid or expired invitation.");
      }
      setChecking(false);
    }

    checkToken();
  }, [token]);

  const handleJoin = async () => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }

    setIsProcessing(true);
    try {
      await useInvitation(invitation.id, user.uid);
      toast.success(`Success! You are now a ${invitation.role} of the family.`);
      router.push("/");
    } catch (err) {
      console.error("Error joining:", err);
      toast.error("Failed to join. Please try again.");
      setIsProcessing(false);
    }
  };

  if (checking || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md mx-auto">
        <div className="bg-rose-100 p-4 rounded-full text-rose-600 mb-6 font-bold">
          <XCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Invitation Error</h2>
        <p className="text-slate-500 mb-8">{error}</p>
        <button 
          onClick={() => router.push("/")}
          className="w-full rounded-xl bg-slate-900 px-6 py-3 text-white font-medium hover:bg-slate-800 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 mb-12">
      <div className="bg-white rounded-3xl shadow-2xl border border-indigo-50 p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-6">
          <UserPlus size={40} />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">You're Invited!</h2>
        <p className="text-slate-500 mb-8 text-sm">
          <span className="font-bold text-indigo-600">{invitation.inviterName}</span> has invited you to join the dashboard as a <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold uppercase text-[10px] tracking-wider">{invitation.role}</span>.
        </p>

        {!user ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-medium">Please sign in to accept this invitation</p>
            <button
              onClick={signInWithGoogle}
              className="group relative flex w-full justify-center rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
               <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
               <div className="text-left">
                  <p className="text-xs text-slate-400 font-medium tracking-tight">Joining as</p>
                  <p className="text-sm font-bold text-slate-700">{user.displayName}</p>
               </div>
            </div>
            
            <button
              onClick={handleJoin}
              disabled={isProcessing}
              className="w-full rounded-2xl bg-indigo-600 px-8 py-4 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {isProcessing ? "Adding to Family..." : <><CheckCircle size={20} /> Join the Family</>}
            </button>
            <p className="text-[10px] text-slate-400">Joining will grant you {invitation.role} permissions on the dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InviteJoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteJoinContent />
    </Suspense>
  );
}
