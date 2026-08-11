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
  onClose: () => void;
  onSaved: () => void;
  initialData?: any; // To support editing
}

const AssessmentForm = ({ studentId, trainerId, onClose, onSaved, initialData }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    weight: initialData?.weight?.toString() || "", 
    body_fat: initialData?.body_fat?.toString() || "", 
    chest: initialData?.chest?.toString() || "", 
    waist: initialData?.waist?.toString() || "",
    hips: initialData?.hips?.toString() || "", 
    arm: initialData?.arm?.toString() || "", 
    thigh: initialData?.thigh?.toString() || "", 
    notes: initialData?.notes || "", 
    assessed_at: initialData?.assessed_at || new Date().toISOString().split("T")[0],
    evaluation_type: initialData?.evaluation_type || "complete" as "complete" | "simplified",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      student_id: studentId,
      trainer_id: trainerId,
      weight: form.weight ? parseFloat(form.weight) : null,
      body_fat: form.body_fat ? parseFloat(form.body_fat) : null,
      chest: form.evaluation_type === "complete" && form.chest ? parseFloat(form.chest) : (initialData?.chest ?? null),
      waist: form.evaluation_type === "complete" && form.waist ? parseFloat(form.waist) : (initialData?.waist ?? null),
      hips: form.evaluation_type === "complete" && form.hips ? parseFloat(form.hips) : (initialData?.hips ?? null),
      arm: form.evaluation_type === "complete" && form.arm ? parseFloat(form.arm) : (initialData?.arm ?? null),
      thigh: form.evaluation_type === "complete" && form.thigh ? parseFloat(form.thigh) : (initialData?.thigh ?? null),
      notes: form.notes || null,
      assessed_at: form.assessed_at,
      evaluation_type: form.evaluation_type,
    };

    const { error } = initialData?.id 
      ? await supabase.from("assessments").update(payload).eq("id", initialData.id)
      : await supabase.from("assessments").insert(payload);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: initialData?.id ? "Avaliação atualizada! ✅" : "Avaliação salva! ✅" });
      onSaved();
    }
    setLoading(false);
  };

  const numField = (label: string, key: keyof typeof form, placeholder: string) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step="0.1"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="bg-secondary border-border h-9 text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{initialData?.id ? "Editar Avaliação" : "Nova Avaliação"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setForm({ ...form, evaluation_type: "complete" })}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center ${
              form.evaluation_type === "complete"
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary hover:border-primary/50"
            }`}
          >
            <span className="text-lg">📊</span>
            <span className="text-xs font-bold text-foreground">COMPLETA</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Peso + altura + medidas</span>
          </button>
          
          <button
            type="button"
            onClick={() => setForm({ ...form, evaluation_type: "simplified" })}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center ${
              form.evaluation_type === "simplified"
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary hover:border-primary/50"
            }`}
          >
            <span className="text-lg">⚡</span>
            <span className="text-xs font-bold text-foreground">SIMPLIFICADA</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Apenas peso + altura</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Data da avaliação</Label>
            <Input
              type="date"
              value={form.assessed_at}
              onChange={(e) => setForm({ ...form, assessed_at: e.target.value })}
              className="bg-secondary border-border h-9 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 transition-all duration-300">
            {numField("Peso (kg)", "weight", "75.0")}
            {form.evaluation_type === "complete" && (
              <>
                {numField("% Gordura", "body_fat", "15.0")}
                {numField("Peito (cm)", "chest", "100")}
                {numField("Cintura (cm)", "waist", "80")}
                {numField("Quadril (cm)", "hips", "95")}
                {numField("Braço (cm)", "arm", "35")}
                {numField("Coxa (cm)", "thigh", "55")}
              </>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anotações sobre a avaliação..."
              className="bg-secondary border-border text-sm min-h-[60px]"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold h-11">
            {loading ? "Salvando..." : "Salvar avaliação"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AssessmentForm;
