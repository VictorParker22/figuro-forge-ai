
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { cleanupAuthState, getAuthErrorMessage } from "@/utils/authUtils";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile when auth state changes
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing auth state before attempting sign in
      cleanupAuthState();
      
      // Attempt global sign out to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Pre-signIn global sign out error (non-critical):", err);
      }
      
      // Log the attempt for debugging
      console.log("Attempting sign-in with email:", email);
      
      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      console.log("Sign-in response:", error ? "Error" : "Success", error || data);
      
      if (error) {
        const friendlyError = getAuthErrorMessage(error);
        toast({
          title: "Error signing in",
          description: friendlyError,
          variant: "destructive",
        });
        return { error: friendlyError };
      }
      
      toast({
        title: "Signed in successfully",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error("Sign-in exception:", error);
      const friendlyError = getAuthErrorMessage(error);
      toast({
        title: "Error signing in",
        description: friendlyError,
        variant: "destructive",
      });
      return { error: friendlyError };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Clean up existing auth state first
      cleanupAuthState();
      
      // Attempt global sign out to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Pre-signUp global sign out error (non-critical):", err);
      }
      
      console.log("Attempting sign-up with email:", email);
      
      // Make sure we have the correct redirect URL
      const origin = window.location.origin || 'http://localhost:5173';
      const redirectTo = `${origin}/complete-profile`;
      console.log("Using redirect URL:", redirectTo);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { plan: 'free' },
          emailRedirectTo: redirectTo
        }
      });
      
      console.log("Sign-up response:", error ? "Error" : "Success", error || data);
      
      if (error) {
        const friendlyError = getAuthErrorMessage(error);
        toast({
          title: "Error signing up",
          description: friendlyError,
          variant: "destructive",
        });
        return { error: friendlyError, data: null };
      } else {
        const isEmailVerificationRequired = !data.session;
        
        toast({
          title: isEmailVerificationRequired ? "Verification email sent" : "Signup successful",
          description: isEmailVerificationRequired 
            ? "Please check your email (including spam folder) to confirm your account before signing in."
            : "Your account has been created successfully.",
        });
      }
      
      return { error: null, data };
    } catch (error: any) {
      console.error("Sign-up exception:", error);
      const friendlyError = getAuthErrorMessage(error);
      toast({
        title: "Error signing up",
        description: friendlyError,
        variant: "destructive",
      });
      return { error: friendlyError, data: null };
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload to ensure clean state
      window.location.href = '/auth';
      
      toast({
        title: "Signed out successfully",
      });
    } catch (error: any) {
      const friendlyError = getAuthErrorMessage(error);
      toast({
        title: "Error signing out",
        description: friendlyError,
        variant: "destructive",
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Clean up existing auth state first
      cleanupAuthState();
      
      const origin = window.location.origin || 'http://localhost:5173';
      const redirectTo = `${origin}/complete-profile`;
      console.log("Using Google redirect URL:", redirectTo);
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
        }
      });
    } catch (error: any) {
      const friendlyError = getAuthErrorMessage(error);
      toast({
        title: "Error signing in with Google",
        description: friendlyError,
        variant: "destructive",
      });
    }
  };
  
  const resendVerificationEmail = async (email: string) => {
    try {
      console.log("Resending verification email to:", email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      console.log("Resend response:", error ? "Error" : "Success", error || "Email sent");
      
      if (error) {
        const friendlyError = getAuthErrorMessage(error);
        toast({
          title: "Error sending verification email",
          description: friendlyError,
          variant: "destructive",
        });
        return { error: friendlyError };
      }
      
      toast({
        title: "Verification email sent",
        description: "Please check your inbox (including spam folder) for the verification link.",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error("Resend verification exception:", error);
      const friendlyError = getAuthErrorMessage(error);
      toast({
        title: "Error sending verification email",
        description: friendlyError,
        variant: "destructive",
      });
      return { error: friendlyError };
    }
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
