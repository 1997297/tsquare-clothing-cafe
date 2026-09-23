"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase/client";
import { CustomerProfile } from "@/types";
import { getSavedLookIds } from "./saved-store";

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  preferredContact?: "whatsapp" | "phone" | "email";
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: CustomerProfile | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null; requiresVerification?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<CustomerProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_CLIENT_KEY = "tcc_authenticated_client_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Migrate guest saved styles on authentication
  const migrateGuestSavedLooks = useCallback(async (customerId: string) => {
    try {
      const guestLookIds = getSavedLookIds();
      if (guestLookIds.length === 0) return;

      if (isSupabaseConfigured) {
        for (const styleId of guestLookIds) {
          await supabase.from("saved_styles").upsert(
            { customer_id: customerId, style_id: styleId },
            { onConflict: "customer_id,style_id" }
          );
        }
      }
    } catch (err) {
      console.error("Error migrating guest saved looks:", err);
    }
  }, []);

  // Fetch or load profile
  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userMeta?: any) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (data && !error) {
          setProfile({
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            preferredContact: data.preferred_contact,
            avatarUrl: data.avatar_url,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
          return;
        }
      } catch (err) {
        console.error("Failed to fetch profile from Supabase:", err);
      }
    }

    // Fallback or demo profile from metadata / local storage
    try {
      const local = localStorage.getItem(LOCAL_CLIENT_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.id === userId || !isSupabaseConfigured) {
          setProfile(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Build default profile if none exists
    const fallbackProfile: CustomerProfile = {
      id: userId,
      firstName: userMeta?.first_name || "Valued",
      lastName: userMeta?.last_name || "Client",
      email: userEmail || "",
      phone: userMeta?.phone || "",
      preferredContact: userMeta?.preferred_contact || "whatsapp",
      createdAt: new Date().toISOString(),
    };
    setProfile(fallbackProfile);
  }, []);

  // Initial session hydration
  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            await migrateGuestSavedLooks(session.user.id);
          }
        } catch (err) {
          console.error("Supabase auth session initialization error:", err);
        }
      } else {
        // Local prototype session
        try {
          const local = localStorage.getItem(LOCAL_CLIENT_KEY);
          if (local) {
            const parsed = JSON.parse(local);
            setProfile(parsed);
            setUser({
              id: parsed.id,
              email: parsed.email,
              user_metadata: { first_name: parsed.firstName, last_name: parsed.lastName },
              app_metadata: {},
              aud: "authenticated",
              created_at: parsed.createdAt,
            } as SupabaseUser);
          }
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            await fetchProfile(newSession.user.id, newSession.user.email, newSession.user.user_metadata);
            await migrateGuestSavedLooks(newSession.user.id);
          } else {
            setProfile(null);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchProfile, migrateGuestSavedLooks]);

  // Sign In
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error };
      if (data.user) {
        await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
        await migrateGuestSavedLooks(data.user.id);
      }
      return { error: null };
    }

    // Local / Prototype sign in
    const mockUser: CustomerProfile = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      firstName: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
      lastName: "Client",
      email,
      phone: "+234 800 000 0000",
      preferredContact: "whatsapp",
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(mockUser));
      setProfile(mockUser);
      setUser({
        id: mockUser.id,
        email: mockUser.email,
        user_metadata: { first_name: mockUser.firstName, last_name: mockUser.lastName },
        aud: "authenticated",
        created_at: mockUser.createdAt,
      } as unknown as SupabaseUser);
      await migrateGuestSavedLooks(mockUser.id);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Sign Up
  const signUp = async (data: SignUpData): Promise<{ error: Error | null; requiresVerification?: boolean }> => {
    if (isSupabaseConfigured) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            preferred_contact: data.preferredContact || "whatsapp",
          },
        },
      });
      if (error) return { error };

      const requiresVerification = !authData.session;
      if (authData.user && authData.session) {
        await fetchProfile(authData.user.id, authData.user.email, authData.user.user_metadata);
        await migrateGuestSavedLooks(authData.user.id);
      }
      return { error: null, requiresVerification };
    }

    // Prototype registration
    const newClient: CustomerProfile = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      preferredContact: data.preferredContact || "whatsapp",
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(newClient));
      setProfile(newClient);
      setUser({
        id: newClient.id,
        email: newClient.email,
        user_metadata: { first_name: newClient.firstName, last_name: newClient.lastName },
        aud: "authenticated",
        created_at: newClient.createdAt,
      } as unknown as SupabaseUser);
      await migrateGuestSavedLooks(newClient.id);
      return { error: null, requiresVerification: false };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    try {
      localStorage.removeItem(LOCAL_CLIENT_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Reset Password
  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    }
    return { error: null };
  };

  // Update Password
  const updatePassword = async (password: string): Promise<{ error: Error | null }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    }
    return { error: null };
  };

  // Update Profile
  const updateProfile = async (updates: Partial<CustomerProfile>): Promise<{ error: Error | null }> => {
    if (!profile) return { error: new Error("No active profile") };

    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };

    if (isSupabaseConfigured && user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: updated.firstName,
          last_name: updated.lastName,
          phone: updated.phone,
          preferred_contact: updated.preferredContact,
          updated_at: updated.updatedAt,
        })
        .eq("id", user.id);

      if (error) return { error };
    }

    try {
      localStorage.setItem(LOCAL_CLIENT_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setProfile(updated);
    return { error: null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
