'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserRole, UserProfileShell } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfileShell | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileShell | null>(null);
  const [role, setRole] = useState<UserRole>('consumer');
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const fetchedProfile: UserProfileShell = {
          id: data.id,
          email: data.email,
          role: data.role as UserRole,
          fullName: data.full_name || undefined,
          phoneNumber: data.phone_number || undefined,
          createdAt: data.created_at,
        };
        setProfile(fetchedProfile);
        setRole(data.role as UserRole);
      }
    } catch {
      // Gracefully handle uninitialized database
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user && mounted) {
          setUser(data.user);
          const metaRole = (data.user.user_metadata?.role as UserRole) || 'consumer';
          setRole(metaRole);
          await fetchProfile(data.user.id);
        }
      } catch {
        // Fallback when offline / unconfigured
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const metaRole = (session.user.user_metadata?.role as UserRole) || 'consumer';
        setRole(metaRole);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setRole('consumer');
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    selectedRole: UserRole
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole('consumer');
    return { error };
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
