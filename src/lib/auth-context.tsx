"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import type { CustomerProfile } from "@/types";
import { isDemoMode, isSupabaseConfigured, supabase } from "./supabase/client";

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
const DEMO_CLIENT_KEY = "tcc_explicit_demo_client_v1";
const unavailableError = () => new Error("Account services are temporarily unavailable. Please try again later.");

function safeAuthError(error: { message?: string; status?: number } | null): Error | null {
  if (!error) return null;
  const message = (error.message ?? "").toLowerCase();
  if (message.includes("invalid login")) return new Error("The email or password is incorrect.");
  if (message.includes("email not confirmed")) return new Error("Please verify your email before signing in.");
  if (message.includes("already registered")) return new Error("An account already exists for this email.");
  if (message.includes("password")) return new Error("The password could not be accepted. Check the requirements and try again.");
  if (error.status === 429) return new Error("Too many attempts. Please wait a moment and try again.");
  return new Error("We could not complete that account request. Please try again.");
}

function mapProfile(row: Record<string, any>): CustomerProfile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    preferredContact: row.preferred_contact,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function demoUser(profile: CustomerProfile): SupabaseUser {
  return {
    id: profile.id,
    email: profile.email,
    user_metadata: { first_name: profile.firstName, last_name: profile.lastName },
    app_metadata: {},
    aud: "authenticated",
    created_at: profile.createdAt,
  } as SupabaseUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileRequestRef = useRef<{ userId: string; request: Promise<void> } | null>(null);

  const fetchProfile = useCallback((userId: string) => {
    if (!isSupabaseConfigured) return;
    if (profileRequestRef.current?.userId === userId) return profileRequestRef.current.request;

    const request = (async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error || !data) {
        console.error("Profile query failed", error);
        setProfile(null);
        return;
      }
      setProfile(mapProfile(data));
    })().finally(() => {
      if (profileRequestRef.current?.userId === userId) profileRequestRef.current = null;
    });

    profileRequestRef.current = { userId, request };
    return request;
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          console.error("Session initialization failed", error);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session?.user) void fetchProfile(data.session.user.id);
        }
      } else if (isDemoMode) {
        try {
          const stored = localStorage.getItem(DEMO_CLIENT_KEY);
          if (stored) {
            const nextProfile = JSON.parse(stored) as CustomerProfile;
            setProfile(nextProfile);
            setUser(demoUser(nextProfile));
          }
        } catch {
          localStorage.removeItem(DEMO_CLIENT_KEY);
        }
      }
      if (active) setIsLoading(false);
    };

    void initialize();

    if (!isSupabaseConfigured) return () => void (active = false);
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const createDemoAccount = (input: SignUpData | { email: string }) => {
    const emailName = input.email.split("@")[0] || "Client";
    const hasDetails = "firstName" in input;
    const nextProfile: CustomerProfile = {
      id: crypto.randomUUID(),
      firstName: hasDetails ? input.firstName : emailName[0].toUpperCase() + emailName.slice(1),
      lastName: hasDetails ? input.lastName : "Client",
      email: input.email,
      phone: hasDetails ? input.phone : "",
      preferredContact: hasDetails ? input.preferredContact ?? "whatsapp" : "whatsapp",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(DEMO_CLIENT_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setUser(demoUser(nextProfile));
  };

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: safeAuthError(error) };
    }
    if (!isDemoMode) return { error: unavailableError() };
    createDemoAccount({ email });
    return { error: null };
  };

  const signUp = async (input: SignUpData) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
            phone: input.phone,
            preferred_contact: input.preferredContact ?? "whatsapp",
          },
        },
      });
      return { error: safeAuthError(error), requiresVerification: !error && !data.session };
    }
    if (!isDemoMode) return { error: unavailableError(), requiresVerification: false };
    createDemoAccount(input);
    return { error: null, requiresVerification: false };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Sign-out failed", error);
    }
    if (isDemoMode) localStorage.removeItem(DEMO_CLIENT_KEY);
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) return { error: unavailableError() };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    return { error: safeAuthError(error) };
  };

  const updatePassword = async (password: string) => {
    if (!isSupabaseConfigured) return { error: unavailableError() };
    if (!session) return { error: new Error("This recovery link is invalid or has expired.") };
    const { error } = await supabase.auth.updateUser({ password });
    return { error: safeAuthError(error) };
  };

  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!profile || !user) return { error: new Error("Sign in to update your profile.") };
    const updated: CustomerProfile = { ...profile, ...updates, updatedAt: new Date().toISOString() };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          first_name: updated.firstName,
          last_name: updated.lastName,
          phone: updated.phone,
          preferred_contact: updated.preferredContact,
          avatar_url: updated.avatarUrl ?? null,
          updated_at: updated.updatedAt,
        })
        .eq("id", user.id)
        .select("*")
        .single();
      if (error || !data) return { error: new Error("We could not update your profile. Please try again.") };
      setProfile(mapProfile(data));
    } else if (isDemoMode) {
      localStorage.setItem(DEMO_CLIENT_KEY, JSON.stringify(updated));
    } else {
      return { error: unavailableError() };
    }
    if (!isSupabaseConfigured) setProfile(updated);
    return { error: null };
  };

  const refreshProfile = async () => {
    if (user && isSupabaseConfigured) await fetchProfile(user.id);
  };

  const value: AuthContextType = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
