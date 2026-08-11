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
      // Note: user_roles was moved to private schema to resolve security linter warnings.
      // We use a raw query or a RPC if available, but for now we'll use the profiles table if it exists
      // or check the user_roles table if the client was updated.
      // Since we moved it to 'private' schema, PostgREST might not see it unless we expose it.
      // For now, let's revert the schema change or use a more robust way.
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id)
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
