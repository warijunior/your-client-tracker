import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Mail } from "lucide-react";
import { XCLogo } from "@/components/XCLogo";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session || event === "PASSWORD_RECOVERY") {
        setLinkValid(true);
        setReady(true);
      }
    });

    const finish = (valid: boolean) => {
      if (cancelled) return;
      setLinkValid(valid);
      setReady(true);
      // limpa tokens da URL para evitar reuso acidental
      window.history.replaceState({}, "", window.location.pathname);
    };

    const resolve = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const query = url.searchParams;

      const errorCode = hash.get("error") || hash.get("error_code") || query.get("error") || query.get("error_code");
      if (errorCode) return finish(false);

      // 1) Link implícito: #access_token=...&refresh_token=...&type=recovery
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        return finish(!error);
      }

      // 2) Link com token_hash (templates novos) → verifyOtp
      const tokenHash = query.get("token_hash") || hash.get("token_hash") || query.get("token") || hash.get("token");
      const type = (query.get("type") || hash.get("type") || "recovery") as "recovery";
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        return finish(!error);
      }

      // 3) Link PKCE: ?code=...
      const code = query.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return finish(!error);
      }

      // 4) Sessão já estabelecida pelo cliente (detectSessionInUrl)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return finish(true);

      if (!cancelled) setReady(true);
    };

    resolve();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não coincidem", description: "Confirme a nova senha corretamente.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Senha alterada com sucesso!", description: "Faça login com a nova senha." });
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast({ title: "Não foi possível alterar a senha", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(resendEmail.trim())) {
      toast({ title: "E-mail inválido", description: "Digite um e-mail válido.", variant: "destructive" });
      return;
    }
    await supabase.auth.resetPasswordForEmail(resendEmail.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    toast({
      title: "Verifique seu e-mail",
      description: "Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black theme-neon">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <XCLogo variant="badge" size={64} className="mx-auto" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Redefinir <span className="text-gradient">senha</span></h1>
        </div>

        {!ready ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : linkValid ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm text-muted-foreground">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-secondary border-border"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3 text-muted-foreground"
                  aria-label={show ? "Ocultar senha" : "Exibir senha"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm text-muted-foreground">Confirmar nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-secondary border-border"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground font-semibold h-12 glow-primary">
              {saving ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <div className="rounded-lg bg-secondary/50 border border-border p-3 text-xs text-muted-foreground">
              Este link é inválido, expirou ou já foi utilizado. Informe seu e-mail para receber um novo link.
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10 bg-secondary border-border"
                required
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold h-12 glow-primary">
              Enviar novo link
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <button onClick={() => navigate("/auth")} className="text-primary font-medium hover:underline">
            Voltar para o login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
