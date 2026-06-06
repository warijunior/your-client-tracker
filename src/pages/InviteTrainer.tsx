import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShieldCheck, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invite {
  id: string;
  email: string;
  full_name: string | null;
  used_at: string | null;
  created_at: string;
}

const InviteTrainer = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/", { replace: true });
  }, [isAdmin, roleLoading, navigate]);

  const fetchInvites = async () => {
    const { data } = await supabase
      .from("trainer_invites")
      .select("id, email, full_name, used_at, created_at")
      .order("created_at", { ascending: false });
    setInvites(data || []);
  };

  useEffect(() => {
    if (isAdmin) fetchInvites();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("trainer_invites").insert({
      email: email.trim().toLowerCase(),
      full_name: fullName || null,
      invited_by: user.id,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Treinador convidado! 🎯", description: "Peça para ele se cadastrar com este email." });
      setEmail("");
      setFullName("");
      fetchInvites();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remover este convite?")) return;
    const { error } = await supabase.from("trainer_invites").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchInvites();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Convidar Treinador</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-4">
        <div className="glass-card p-4 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            O treinador convidado deve se cadastrar com este email na tela de login. O sistema atribui o papel de treinador automaticamente.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Nome (opcional)</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nome do treinador"
            className="bg-secondary border-border"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Email *</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="treinador@email.com"
            className="bg-secondary border-border"
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold h-12 glow-primary">
          {loading ? "Salvando..." : "Convidar treinador"}
        </Button>

        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Convites</h2>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum convite ainda.</p>
          ) : (
            invites.map((i) => (
              <div key={i.id} className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{i.full_name || i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.email} • {i.used_at ? "✅ Conta criada" : "⏳ Aguardando cadastro"}
                  </p>
                </div>
                {!i.used_at && (
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </form>
    </div>
  );
};

export default InviteTrainer;
