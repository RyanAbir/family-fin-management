"use client";

import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useEffect, useState } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createInvitation } from "@/lib/db/invites";
import { UserProfile } from "@/types";
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Eye, 
  Clock,
  Link as LinkIcon,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { updateUserRole, deleteUserProfile } from "@/lib/db/users";
import { syncAllFamilyShares } from "@/lib/db/sync";
import { UserRole } from "@/types";

export default function MembersSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin, isMember, loading: roleLoading } = useRole();
  const loading = authLoading || roleLoading;
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchMembers = async () => {
    setFetching(true);
    try {
      const q = query(collection(db, "userProfiles"), orderBy("role"), orderBy("displayName"));
      const querySnapshot = await getDocs(q);
      const memberList = querySnapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(m => m.role !== "super_admin" || m.uid === profile?.uid); // 👻 Hide Super Admins, but show yourself to yourself
      setMembers(memberList);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members list.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const handleGenerateInvite = async () => {
    if (!isMember) {
      toast.error("Only members can invite others.");
      return;
    }

    setIsGenerating(true);
    try {
      if (!profile) throw new Error("Profile not loaded");
      const { token } = await createInvitation(profile.uid, profile.displayName, "member");
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/invite/join?token=${token}`;
      setInviteLink(link);
      toast.success("Invitation link generated!");
    } catch (error) {
      toast.error("Failed to generate invitation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (!isAdmin) return;
    
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      fetchMembers(); // Reset selection
      return;
    }

    try {
      await updateUserRole(uid, newRole);
      toast.success(`User role updated to ${newRole}`);
      await fetchMembers();
    } catch (error) {
      toast.error("Failed to update user role.");
      fetchMembers(); // Reset selection
    }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if (!isAdmin) return;
    
    if (!confirm(`⚠️ WARNING: Permanently delete ${name}'s profile? This will log them out and remove their record from the database. Family shares will remain intact.`)) return;
    if (!confirm(`Are you absolutely sure you want to delete ${name}? This action is irreversible.`)) return;

    try {
      await deleteUserProfile(uid);
      toast.success(`${name} has been purged from the system.`);
      await fetchMembers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user profile.");
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6 border-slate-200">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Family Members</h2>
          <p className="text-sm text-slate-500 mt-1">Manage access and invite new members to the dashboard.</p>
        </div>
        {isMember && (
          <button 
            onClick={handleGenerateInvite}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
          >
            <UserPlus size={20} />
            <span>Generate Invite Link</span>
          </button>
        )}
      </header>

      {inviteLink && (
        <section className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 lg:p-8 animate-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
             <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-md">
                <LinkIcon size={24} />
             </div>
             <div className="flex-1">
                <h3 className="text-lg font-bold text-indigo-900 mb-1">New Invitation Created</h3>
                <p className="text-sm text-indigo-700 mb-4 font-medium italic">This link allows one person to join as a Member. Valid for 24 hours.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                   <div className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-mono text-indigo-600 truncate">
                      {inviteLink}
                   </div>
                   <button 
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                   >
                    {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy Link</>}
                   </button>
                </div>
             </div>
          </div>
        </section>
      )}

      <div className="grid gap-6">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              Registered Users
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{members.length} Total</span>
          </div>
          
          {/* Mobile Card Layout */}
          <div className="lg:hidden divide-y divide-slate-100">
            {members.map((m) => {
              const joinedAt = m.createdAt instanceof Date 
                ? m.createdAt 
                : m.createdAt && typeof (m.createdAt as any).toDate === 'function' 
                  ? (m.createdAt as any).toDate() 
                  : new Date();

              return (
                <div key={m.uid} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={m.photoURL || ""} alt={m.displayName} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{m.displayName}</p>
                        <p className="text-[10px] text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</p>
                          {isAdmin && m.uid !== profile?.uid && m.role !== "super_admin" ? (
                            <select
                              defaultValue={m.role}
                              onChange={(e) => handleRoleChange(m.uid, e.target.value as UserRole)}
                              className="bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="banned" className="text-rose-600 font-bold">Banned</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                              m.role === 'super_admin' ? 'bg-indigo-600 text-white' :
                              m.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                              m.role === 'member' ? 'bg-indigo-100 text-indigo-700' :
                              m.role === 'banned' ? 'bg-rose-100 text-rose-700 shadow-sm shadow-rose-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {m.role === 'super_admin' && <ShieldCheck size={10} />}
                              {m.role === 'admin' && <ShieldCheck size={10} />}
                              {m.role === 'member' && <Shield size={10} />}
                              {m.role === 'viewer' && <Eye size={10} />}
                              {m.role === 'banned' && <ShieldAlert size={10} />}
                              {m.role}
                            </span>
                          )}
                    </div>
                    
                    <div className="flex flex-col gap-1 items-end text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium font-heading">
                          <Clock size={12} className="text-slate-400" />
                          {joinedAt.toLocaleDateString()}
                        </div>
                        {isAdmin && m.uid !== profile?.uid && m.role !== 'super_admin' && (
                          <button 
                            onClick={() => handleDeleteUser(m.uid, m.displayName)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
                            title="Delete User Profile"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Layout for Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined At</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const joinedAt = m.createdAt instanceof Date 
                    ? m.createdAt 
                    : m.createdAt && typeof (m.createdAt as any).toDate === 'function' 
                      ? (m.createdAt as any).toDate() 
                      : new Date();

                  return (
                    <tr key={m.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <img src={m.photoURL || ""} alt={m.displayName} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                           <div>
                              <p className="text-sm font-bold text-slate-900">{m.displayName}</p>
                              <p className="text-xs text-slate-500">{m.email}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          {isAdmin && m.uid !== profile?.uid && m.role !== "super_admin" ? (
                            <select
                              defaultValue={m.role}
                              onChange={(e) => handleRoleChange(m.uid, e.target.value as UserRole)}
                              className="bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="banned" className="text-rose-600 font-bold">Banned</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                m.role === 'super_admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' :
                                m.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                                m.role === 'member' ? 'bg-indigo-100 text-indigo-700' :
                                m.role === 'banned' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                                {m.role === 'super_admin' && <ShieldCheck size={12} />}
                                {m.role === 'admin' && <ShieldCheck size={12} />}
                                {m.role === 'member' && <Shield size={12} />}
                                {m.role === 'viewer' && <Eye size={12} />}
                                {m.role === 'banned' && <ShieldAlert size={12} />}
                                {m.role}
                            </span>
                          )}
                       </div>
                    </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Clock size={14} className="text-slate-400" />
                            {joinedAt.toLocaleDateString()}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-3">
                            <span className={`h-2 w-2 rounded-full ring-4 ${m.role === 'banned' ? 'bg-rose-600 ring-rose-50' : 'bg-emerald-500 ring-emerald-50'}`}></span>
                            {isAdmin && m.uid !== profile?.uid && m.role !== 'super_admin' && (
                               <button 
                                 onClick={() => handleDeleteUser(m.uid, m.displayName)}
                                 className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
                                 title="Delete User Profile"
                               >
                                 <Trash2 size={16} />
                               </button>
                            )}
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {!isMember && (
          <section className="bg-amber-50 border border-amber-100 rounded-3xl p-6 text-center mt-8">
             <h4 className="text-sm font-bold text-amber-900 mb-2">Restricted Access</h4>
             <p className="text-xs text-amber-700 max-w-md mx-auto">
                You currently have **Viewer** permissions. You can see everything but cannot make changes or invite others. Contact a family member with an invite link to upgrade your account.
             </p>
          </section>
        )}

        {/* Super Admin Management Tools */}
        {isAdmin && (
           <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="p-6 border-b border-slate-100 bg-indigo-50/30">
               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" size={20} />
                  Inheritance Database Management
               </h3>
               <p className="text-xs text-slate-500 mt-1">Tools to ensure the family ownership records are synchronized and balanced.</p>
             </div>
             <div className="p-8">
               <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                     <p className="text-sm font-bold text-slate-900 flex items-center gap-2 justify-center md:justify-start">
                        <Users size={16} className="text-indigo-500" />
                        Sync All Ownership Shares
                     </p>
                     <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                        This will scan all properties and family members, link any missing shares, and instantly rebalance percentages using the 2:1 Shariah rule (Son=2x, others=1x).
                     </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("This will overwrite existing percentages and fix missing shares for all properties. Continue?")) {
                         toast.promise(syncAllFamilyShares(), {
                           loading: 'Synchronizing lineage and shares...',
                           success: (res) => `Successfully synced ${res.propertyCount} properties!`,
                           error: 'Sync failed.'
                         });
                      }
                    }}
                    className="px-8 py-4 bg-slate-900 text-white rounded-xl text-sm font-black shadow-xl hover:bg-black transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
                  >
                    <LinkIcon size={18} />
                    Sync & Balance All
                  </button>
               </div>
             </div>
           </section>
        )}
      </div>
    </div>
  );
}
