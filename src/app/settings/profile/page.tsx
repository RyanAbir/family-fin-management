"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Mail, 
  Camera, 
  Save, 
  ArrowLeft,
  Shield,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { updateUserProfileData } from "@/lib/db/users";
import { processProfileImageBase64 } from "@/lib/db/storage";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfileSettingsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "optimizing" | "uploading" | "success">("idle");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setPhotoURL(profile.photoURL || "");
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic type validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    setUploadStatus("optimizing");
    
    try {
      // 1. Process to Base64 (Compressed & Optimized)
      const optimizedBase64 = await processProfileImageBase64(file);
      setUploadStatus("uploading");
      
      // 2. Update Firestore immediately with the string (Source of Truth)
      await updateUserProfileData(user.uid, {
        displayName,
        photoURL: optimizedBase64
      });

      // We skip updateProfile(auth.currentUser) for the photoURL because 
      // Base64 strings exceed the character limit of the Auth profile attribute.
      // Our App already prioritizes the Firestore profile, so it works perfectly!

      setPhotoURL(optimizedBase64);
      setUploadStatus("success");
      toast.success("Photo updated successfully!");
      
      // Reset status after a delay
      setTimeout(() => setUploadStatus("idle"), 2000);
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast.error("Failed to process photo.");
      setUploadStatus("idle");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Update Firestore Profile Name
      await updateUserProfileData(user.uid, {
        displayName,
        photoURL: photoURL || undefined
      });

      // Update Firebase Auth Profile Name (ONLY name)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName
        });
      }

      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-2 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Profile Settings</h1>
          <p className="text-slate-500 mt-1">Manage your identity and how your family sees you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Left Column: Avatar & Photo Management */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center relative overflow-hidden group">
            {/* Status Overlay */}
            {uploadStatus !== "idle" && (
              <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
                <p className="text-sm font-bold text-slate-900 tracking-tight">
                  {uploadStatus === "optimizing" && "Compressing Photo..."}
                  {uploadStatus === "uploading" && "Saving Changes..."}
                  {uploadStatus === "success" && "Complete!"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Almost there.</p>
              </div>
            )}

            <div className="relative mx-auto w-32 h-32 mb-6">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl ring-1 ring-slate-100">
                {photoURL ? (
                  <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <UserIcon size={48} />
                  </div>
                )}
              </div>
              
              {/* File Input Trigger */}
              <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white cursor-pointer hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all">
                <Camera size={20} />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
            </div>
            
            <h3 className="font-bold text-slate-900 text-lg">{displayName || "Anonymous User"}</h3>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">
              {profile?.role || "Viewer"}
            </p>
            
            <div className="mt-8">
               <label className="block bg-slate-50 border border-slate-100 p-3 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group-hover:border-slate-200">
                  <span className="text-xs font-bold text-slate-600">Update Profile Photo</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
               </label>
            </div>
          </section>

          <section className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="text-emerald-600 shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-emerald-900 mb-1">Authenticated</p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  You are signed in as **{user.email}**. Changes to your profile will be shared with the entire family.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Name & Info Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Personal Information</h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. John Doe"
                        required
                        className="w-full rounded-2xl border-2 border-slate-100 pl-12 pr-4 py-3.5 text-sm focus:border-indigo-600 focus:outline-none transition-colors font-medium shadow-sm shadow-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 opacity-80">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email (Primary)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        value={user.email || ""}
                        disabled
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 py-3.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 ml-1 italic">Email cannot be changed on this screen.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Update Profile Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
