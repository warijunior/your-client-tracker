import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NewStudent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    health_history: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("students").insert({
      trainer_id: user.id,
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      goal: form.goal || null,
      health_history: form.health_history || null,
    });

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Aluno cadastrado! 🎉" });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Novo Aluno</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Nome completo *</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Nome do aluno"
            className="bg-secondary border-border"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Idade</Label>
            <Input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="25"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Peso (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              placeholder="75.0"
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Altura (m)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              placeholder="1.75"
              className="bg-secondary border-border"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Objetivo</Label>
          <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Selecione o objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emagrecimento">🔥 Emagrecimento</SelectItem>
              <SelectItem value="hipertrofia">💪 Hipertrofia</SelectItem>
              <SelectItem value="condicionamento">🏃 Condicionamento</SelectItem>
              <SelectItem value="saude">❤️ Saúde</SelectItem>
              <SelectItem value="reabilitacao">🩺 Reabilitação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Histórico de saúde</Label>
          <Textarea
            value={form.health_history}
            onChange={(e) => setForm({ ...form, health_history: e.target.value })}
            placeholder="Lesões, doenças, medicamentos, restrições..."
            className="bg-secondary border-border min-h-[100px]"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold h-12 glow-primary">
          {loading ? "Salvando..." : "Cadastrar aluno"}
        </Button>
      </form>
    </div>
  );
};

export default NewStudent;
