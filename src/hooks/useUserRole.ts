import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "admin" | "trainer" | "student" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setRole((data?.role as UserRole) ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const isStaff = role === "admin" || role === "trainer";
  return { role, loading, isAdmin: role === "admin", isTrainer: role === "trainer", isStudent: role === "student", isStaff };
};
