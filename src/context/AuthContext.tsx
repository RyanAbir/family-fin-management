"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  ConfirmationResult
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db, googleProvider, appleProvider, signInWithPhoneNumber, RecaptchaVerifier } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithPhone: (phone: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to profile document in real-time
        const profileRef = doc(db, "userProfiles", firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            let profileData = docSnap.data() as UserProfile;
            
            // Auto-grant super_admin to developer email
            if (firebaseUser.email === "info.ryanabir@gmail.com" && profileData.role !== "super_admin") {
              profileData.role = "super_admin";
            }
            
            setProfile(profileData);

            // Redirection logic for onboarding
            const isOnboarding = pathname.startsWith("/onboarding");
            const isBanned = profileData.role === "banned";
            const isSuperAdmin = profileData.role === "super_admin";
            const needsOnboarding = !profileData.familyMemberId && !isSuperAdmin;

            if (isBanned && !pathname.startsWith("/banned") && pathname !== "/login") {
              router.push("/banned");
              return;
            }

            if (needsOnboarding && !isOnboarding && !isBanned && !pathname.startsWith("/login") && !pathname.startsWith("/invite") && !pathname.startsWith("/banned")) {
              router.push("/onboarding");
            }
          } else {
            // Document doesn't exist yet, creating default...
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Unknown User",
              photoURL: firebaseUser.photoURL || undefined,
              role: firebaseUser.email === "info.ryanabir@gmail.com" ? "super_admin" : "viewer",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            setDoc(profileRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            
            setProfile(newProfile);
          }
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setProfile(null);
        // Redirect to login if not on an auth-exempt page
        if (pathname !== "/login" && !pathname.startsWith("/invite")) {
          router.push("/login");
        }
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [pathname, router]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (error) {
      console.error("Error signing in with Apple:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with Email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      // The profile creation is handled by the onAuthStateChanged listener, 
      // but we might want to set the name immediately.
      // Firebase's onAuthStateChanged will fire, and if it's a newDoc, 
      // it currently uses "Unknown User". We should fix the listener to use the provided name 
      // if we can, or update it here.
      // A better way is to update the profile document right after.
      await setDoc(doc(db, "userProfiles", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email || "",
        displayName: name,
        role: "viewer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error signing up with Email:", error);
      throw error;
    }
  };

  const signInWithPhone = async (phone: string, recaptchaContainerId: string) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: "invisible",
      });
      return await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
    } catch (error) {
      console.error("Error signing in with Phone:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInWithApple,
      signInWithEmail,
      signUpWithEmail,
      signInWithPhone,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
