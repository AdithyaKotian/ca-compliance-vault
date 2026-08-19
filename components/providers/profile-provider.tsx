"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";

export type UserRole = "admin" | "accountant" | "client";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole | string;
  firm_id: string | null;
  client_id?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (data) {
        setProfile({
          ...data,
          email: data.email || user.email || null,
        } as Profile);
      } else {
        // Fallback profile if record not yet created
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          role: "admin",
          firm_id: "11111111-1111-1111-1111-111111111111",
          email: user.email || null,
          avatar_url: null,
        });
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load profile");
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    refreshProfile,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);

  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }

  return context;
}