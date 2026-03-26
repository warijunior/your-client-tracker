import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  studentId: string;
  trainerId: string;
  type: "diet" | "training";
  onClose: () => void;
  onSaved: () => void;
}

const ProtocolForm = ({ studentId, trainerId, type, onClose, onSaved }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("protocols").insert({
      student_id: studentId,
      trainer_id: trainerId,
      type,
      title,
      content,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${type === "training" ? "Treino" : "Dieta"} salvo! ✅` });
      onSaved();
    }
    setLoading(false);
  };

  const placeholder = type === "training"
    ? `Exemplo:
Treino A - Peito e Tríceps
1. Supino reto - 4x12
2. Supino inclinado - 3x10
3. Crucifixo - 3x12
4. Tríceps corda - 3x15
5. Tríceps francês - 3x12`
    : `Exemplo:
Café da manhã: 3 ovos + 2 fatias pão integral + 1 fruta
Lanche: Whey + banana
Almoço: 200g frango + arroz + salada
Lanche: Mix de castanhas + iogurte
Jantar: 200g peixe + batata doce + legumes`;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {type === "training" ? "🏋️ Novo Treino" : "🥗 Nova Dieta"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "training" ? "Ex: Treino A - Peito e Tríceps" : "Ex: Dieta Cutting 2000kcal"}
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="bg-secondary border-border min-h-[200px] text-sm"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold h-11">
            {loading ? "Salvando..." : "Salvar protocolo"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProtocolForm;
