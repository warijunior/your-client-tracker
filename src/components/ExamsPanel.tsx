import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useFormDraft } from "@/hooks/useFormDraft";
import { FlaskConical, Loader2, Save } from "lucide-react";

interface Props {
  studentId: string;
  mode: "trainer" | "student";
  userId: string;
}

const PERIODICITIES = ["Mensal", "Trimestral", "Semestral", "Anual", "Personalizado"];

const ExamsPanel = ({ studentId, mode, userId }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);

  const [form, setForm] = useFormDraft(`draft-exams-${studentId}`, {
    required: false,
    guidance: "",
    nextDate: "",
    periodicity: "Semestral"
  });

  const load = useCallback(async () => {
    const { data } = await supabase.from("exam_followups").select("*").eq("student_id", studentId).maybeSingle();
    if (data) {
      setForm({
        required: data.required,
        guidance: data.guidance ?? "",
        nextDate: data.next_date ?? "",
        periodicity: data.periodicity ?? "Semestral"
      });
      setExists(true);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("exam_followups").upsert(
      {
        student_id: studentId,
        trainer_id: userId,
        required: form.required,
        guidance: form.guidance || null,
        next_date: form.nextDate || null,
        periodicity: form.periodicity || null,
      },
      { onConflict: "student_id" }
    );
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setExists(true);
    toast({ title: "Acompanhamento salvo 🧪" });
  };

  if (loading) return <Skeleton className="h-40 w-full rounded-xl" />;

  if (mode === "student") {
    return (
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Acompanhamento de exames</h3>
        </div>
        {!exists ? (
          <p className="text-sm text-muted-foreground">Nenhuma orientação registrada pelo seu treinador.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Acompanhamento periódico</span>
              <span className={form.required ? "text-primary font-medium" : "text-foreground"}>{form.required ? "Sim" : "Não"}</span>
            </div>
            {form.periodicity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periodicidade</span>
                <span className="text-foreground">{form.periodicity}</span>
              </div>
            )}
            {form.nextDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data prevista</span>
                <span className="text-foreground">{new Date(`${form.nextDate}T12:00:00`).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {form.guidance && <p className="text-xs text-secondary-foreground whitespace-pre-wrap pt-1">{form.guidance}</p>}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
          Registro apenas para controle e lembrete. Não substitui avaliação médica.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Acompanhamento de exames</h3>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
        <Label className="text-sm text-foreground">Necessidade de exames periódicos</Label>
        <Switch checked={required} onCheckedChange={setRequired} />
      </div>

      {required && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observação / orientação</Label>
            <Textarea
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              placeholder="Registre a orientação de acompanhamento"
              className="bg-secondary border-border min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Data prevista para acompanhamento</Label>
            <Input type="date" value={form.nextDate} onChange={(e) => setForm({ ...form, nextDate: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Periodicidade</Label>
            <div className="flex flex-wrap gap-2">
              {PERIODICITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, periodicity: p })}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.periodicity === p ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button onClick={save} disabled={saving} className="w-full gradient-primary text-primary-foreground">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar acompanhamento
      </Button>
      <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
        Controle e lembrete apenas. O sistema não gera diagnóstico nem interpreta resultados.
      </p>
    </div>
  );
};

export default ExamsPanel;
