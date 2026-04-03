"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  LogIn, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Smartphone, 
  ChevronRight, 
  ArrowLeft,
  Key
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmationResult } from "firebase/auth";

type AuthTab = "social" | "email" | "phone";

export default function LoginPage() {
  const { 
    user, 
    signInWithGoogle, 
    signInWithApple, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithPhone, 
    loading 
  } = useAuth();
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("social");
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSocialSignIn = async (method: "google" | "apple") => {
    setIsSigningIn(true);
    try {
      if (method === "google") await signInWithGoogle();
      else await signInWithApple();
    } catch (err: any) {
      toast.error(err.message || `Failed to sign in with ${method}`);
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    try {
      if (isRegistering) {
        await signUpWithEmail(email, password, displayName);
        toast.success("Account created successfully!");
      } else {
        await signInWithEmail(email, password);
        toast.success("Logged in successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
      setIsSigningIn(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    try {
      // Ensure phone starts with +
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+880${phoneNumber}`;
      const result = await signInWithPhone(formattedPhone, "recaptcha-container");
      setConfirmationResult(result);
      toast.success("OTP sent to your phone!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setIsSigningIn(true);
    try {
      await confirmationResult.confirm(verificationCode);
      toast.success("Phone verified!");
    } catch (err: any) {
      toast.error("Invalid OTP code. Please try again.");
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 font-sans">
      {/* Invisible container for Phone Auth reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8 pb-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 mb-4 transform hover:scale-105 transition-transform">
            <Building2 size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Family Fin
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">
            The Enterprise Dashboard
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-8 gap-1 mb-4">
          {(["social", "email", "phone"] as AuthTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setConfirmationResult(null); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-tighter rounded-xl transition-all ${
                activeTab === tab 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8 pt-2">
          {activeTab === "social" && (
            <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
              <button
                onClick={() => handleSocialSignIn("google")}
                disabled={isSigningIn}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                onClick={() => handleSocialSignIn("apple")}
                disabled={isSigningIn}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-black px-4 py-4 text-sm font-bold text-white hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.062 13.925c.021 3.14 2.73 4.192 2.768 4.211-.024.08-.432 1.485-1.434 2.946-.867 1.261-1.767 2.518-3.181 2.545-1.385.025-1.832-.821-3.418-.821-1.587 0-2.083.796-3.414.846-1.332.049-2.355-1.359-3.228-2.62-1.785-2.58-3.15-7.291-1.31-10.49 1.411-2.454 4.09-2.33 4.094-3.32.025-1.284 3.731-1.313 5.156-.039 1.1-.09 2.519.826 3.156 1.642.571.732 1.056 1.834 1.104 3.12zm-3.004-9.3c.712-1.364 2.144-2.284 3.465-2.26.115 1.082-.361 2.226-1.127 3.255s-2.023 2.148-3.147 2.148c-.097-1.134.331-2.197 1.109-3.143z"/>
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>
          )}

          {activeTab === "email" && (
            <form onSubmit={handleEmailAuth} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                {isRegistering && (
                  <div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full rounded-2xl border-2 border-slate-100 px-4 py-3.5 text-sm focus:border-indigo-600 focus:outline-none transition-colors"
                    />
                  </div>
                )}
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-2xl border-2 border-slate-100 px-4 py-3.5 text-sm focus:border-indigo-600 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-2xl border-2 border-slate-100 px-4 py-3.5 text-sm focus:border-indigo-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSigningIn ? "Processing..." : isRegistering ? "Create Account" : "Sign In"}
              </button>

              <p className="text-center text-xs text-slate-500 font-medium">
                {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  {isRegistering ? "Log in here" : "Sign up here"}
                </button>
              </p>
            </form>
          )}

          {activeTab === "phone" && (
            <div className="animate-in fade-in duration-300">
              {!confirmationResult ? (
                <form onSubmit={handlePhoneSignIn} className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      +880
                    </span>
                    <input
                      type="tel"
                      placeholder="1700000000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="w-full rounded-2xl border-2 border-slate-100 pl-14 pr-4 py-3.5 text-sm focus:border-indigo-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-xl shadow-slate-100 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSigningIn ? "Sending..." : "Send Verification Code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium text-slate-600">Enter code sent to</p>
                    <p className="text-sm font-bold text-slate-900">+880 {phoneNumber}</p>
                    <button 
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      className="text-[10px] uppercase font-bold text-indigo-600 mt-2 hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="flex justify-center gap-2">
                    <div className="relative w-full">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder="6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                        required
                        className="w-full rounded-2xl border-2 border-slate-100 pl-12 pr-4 py-3.5 text-center text-lg font-black tracking-[0.5em] focus:border-indigo-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSigningIn ? "Verifying..." : "Confirm & Sign In"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
           <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1.5">
                 <Globe size={14} />
                 <span>Global Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <Smartphone size={14} />
                 <span>Mobile Verified</span>
              </div>
           </div>
        </div>
      </div>
      
      <p className="mt-8 text-center text-xs text-slate-400 font-medium">
        Secure encryption active. © 2026 Family Fin Project.
      </p>
    </div>
  );
}
