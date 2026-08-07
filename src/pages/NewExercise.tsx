import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Dumbbell, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NewExercise = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    muscle_group: "",
    equipment: "",
    difficulty: "intermediate",
    description: "",
  });

  const muscleGroups = [
    "Peito", "Costas", "Perna", "Ombro", "Braço", "Core", "Glúteo"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("exercises")
        .insert([formData]);

      if (error) throw error;

      toast({ title: "Exercício criado com sucesso! 💪" });
      navigate("/exercises");
    } catch (error: any) {
      toast({
        title: "Erro ao criar exercício",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8 font-sans">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/exercises")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Dumbbell className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Novo Exercício</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6 glass-card p-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Exercício</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Supino Inclinado"
              className="bg-secondary border-border focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Grupo Muscular</Label>
              <Select 
                onValueChange={(val) => setFormData({ ...formData, muscle_group: val })}
                required
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroups.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipamento</Label>
              <Input
                id="equipment"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                placeholder="Ex: Barra"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dificuldade</Label>
            <Select 
              value={formData.difficulty}
              onValueChange={(val) => setFormData({ ...formData, difficulty: val })}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição / Instruções</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva como realizar o exercício..."
              className="bg-secondary border-border min-h-[120px]"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-bold h-12 shadow-lg hover:scale-[0.99] transition-transform">
            {loading ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Exercício</>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewExercise;
