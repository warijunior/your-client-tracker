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
}

const AssessmentForm = ({ studentId, trainerId, onClose, onSaved }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    weight: "", body_fat: "", chest: "", waist: "",
    hips: "", arm: "", thigh: "", notes: "", assessed_at: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("assessments").insert({
      student_id: studentId,
      trainer_id: trainerId,
      weight: form.weight ? parseFloat(form.weight) : null,
      body_fat: form.body_fat ? parseFloat(form.body_fat) : null,
      chest: form.chest ? parseFloat(form.chest) : null,
      waist: form.waist ? parseFloat(form.waist) : null,
      hips: form.hips ? parseFloat(form.hips) : null,
      arm: form.arm ? parseFloat(form.arm) : null,
      thigh: form.thigh ? parseFloat(form.thigh) : null,
      notes: form.notes || null,
      assessed_at: form.assessed_at,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Avaliação salva! ✅" });
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
          <h2 className="text-lg font-bold text-foreground">Nova Avaliação</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Data</Label>
            <Input
              type="date"
              value={form.assessed_at}
              onChange={(e) => setForm({ ...form, assessed_at: e.target.value })}
              className="bg-secondary border-border h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {numField("Peso (kg)", "weight", "75.0")}
            {numField("% Gordura", "body_fat", "15.0")}
            {numField("Peito (cm)", "chest", "100")}
            {numField("Cintura (cm)", "waist", "80")}
            {numField("Quadril (cm)", "hips", "95")}
            {numField("Braço (cm)", "arm", "35")}
            {numField("Coxa (cm)", "thigh", "55")}
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
