import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutos
const LAST_ACTIVITY_KEY = "tm_last_activity";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: Enums<"app_role"> | null;
  displayName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Enums<"app_role"> | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUserMeta = async (userId: string) => {
    const [roleRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
    ]);
    setRole(roleRes.data?.role ?? null);
    setDisplayName(profileRes.data?.display_name ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserMeta(session.user.id), 0);
        } else {
          setRole(null);
          setDisplayName(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Verificar si la última actividad fue hace más de 60 minutos
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (lastActivity) {
          const elapsed = Date.now() - parseInt(lastActivity, 10);
          if (elapsed > INACTIVITY_TIMEOUT_MS) {
            await supabase.auth.signOut();
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            toast.info("Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.");
            setSession(null);
            setUser(null);
            setRole(null);
            setDisplayName(null);
            setLoading(false);
            return;
          }
        }
        setSession(session);
        setUser(session.user);
        fetchUserMeta(session.user.id);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Inactivity auto-logout ---
  const handleInactivityLogout = useCallback(async () => {
    await supabase.auth.signOut();
    toast.info("Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.");
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    inactivityTimer.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT_MS);
  }, [handleInactivityLogout]);

  useEffect(() => {
    if (!user) {
      // No hay usuario autenticado, limpiar timer si existe
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      return;
    }

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    // Iniciar el timer por primera vez
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  const signOut = async () => {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, displayName, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
