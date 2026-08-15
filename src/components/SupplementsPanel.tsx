import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useFormDraft } from "@/hooks/useFormDraft";
import { Loader2, Pill, Plus, Save, Trash2, X } from "lucide-react";

interface Props {
  studentId: string;
  mode: "trainer" | "student";
  userId: string;
}

interface Supplement {
  id: string;
  name: string;
  dosage: number | null;
  unit: string;
  schedule: string | null;
  frequency: string | null;
  notes: string | null;
  start_date: string;
  end_date: string | null;
}

const todayStr = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  name: "",
  dosage: "",
  unit: "g",
  schedule: "",
  frequency: "Diário",
  notes: "",
  start_date: todayStr(),
  end_date: "",
};

const SupplementsPanel = ({ studentId, mode, userId }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Supplement[]>([]);
  const [takenToday, setTakenToday] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useFormDraft(`draft-supplement-${studentId}`, { ...emptyForm });

  const load = useCallback(async () => {
    const [supRes, logRes] = await Promise.all([
      supabase.from("supplements").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
      supabase.from("supplement_logs").select("supplement_id").eq("student_id", studentId).eq("log_date", todayStr()),
    ]);
    setItems((supRes.data as Supplement[]) ?? []);
    setTakenToday(new Set((logRes.data ?? []).map((l) => l.supplement_id)));
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (s: Supplement) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      dosage: s.dosage?.toString() ?? "",
      unit: s.unit,
      schedule: s.schedule ?? "",
      frequency: s.frequency ?? "",
      notes: s.notes ?? "",
      start_date: s.start_date,
      end_date: s.end_date ?? "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Informe o nome do suplemento", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      student_id: studentId,
      trainer_id: userId,
      name: form.name.trim(),
      dosage: form.dosage ? parseFloat(form.dosage.replace(",", ".")) : null,
      unit: form.unit || "g",
      schedule: form.schedule || null,
      frequency: form.frequency || null,
      notes: form.notes || null,
      start_date: form.start_date || todayStr(),
      end_date: form.end_date || null,
    };
    const { error } = editingId
      ? await supabase.from("supplements").update(payload).eq("id", editingId)
      : await supabase.from("supplements").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Suplemento atualizado ✅" : "Suplemento adicionado 💊" });
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    load();
  };

  const remove = async (s: Supplement) => {
    if (!window.confirm(`Remover "${s.name}" do protocolo?`)) return;
    const { error } = await supabase.from("supplements").delete().eq("id", s.id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== s.id));
    toast({ title: "Suplemento removido" });
  };

  const toggleTaken = async (s: Supplement, checked: boolean) => {
    if (checked) {
      const { error } = await supabase
        .from("supplement_logs")
        .insert({ supplement_id: s.id, student_id: studentId, user_id: userId, log_date: todayStr() });
      if (error) {
        toast({ title: "Erro ao marcar", description: error.message, variant: "destructive" });
        return;
      }
      setTakenToday((prev) => new Set(prev).add(s.id));
      toast({ title: `${s.name} marcado como utilizado ✅` });
    } else {
      const { error } = await supabase
        .from("supplement_logs")
        .delete()
        .eq("supplement_id", s.id)
        .eq("log_date", todayStr());
      if (error) {
        toast({ title: "Erro ao desmarcar", description: error.message, variant: "destructive" });
        return;
      }
      setTakenToday((prev) => {
        const next = new Set(prev);
        next.delete(s.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mode === "trainer" && !showForm && (
        <Button onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true); }} className="w-full gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Adicionar suplemento
        </Button>
      )}

      {mode === "trainer" && showForm && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" /> {editingId ? "Editar suplemento" : "Novo suplemento"}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nome do suplemento</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Whey Protein, Creatina" className="bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dosagem</Label>
              <Input type="number" step="0.1" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Ex: 5" className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Unidade</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="g, mg, ml, cápsula" className="bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Horário</Label>
              <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Ex: Após o treino" className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Frequência</Label>
              <Input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="Ex: Diário" className="bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Início</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Término (opcional)</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Orientações de uso" className="bg-secondary border-border min-h-[70px]" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground text-sm">Nenhum suplemento cadastrado.</p>
      ) : (
        items.map((s) => (
          <div key={s.id} className="glass-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-primary" />
                </span>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{s.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {s.dosage ? `${s.dosage} ${s.unit}` : s.unit}
                    {s.schedule ? ` • ${s.schedule}` : ""}
                    {s.frequency ? ` • ${s.frequency}` : ""}
                  </p>
                </div>
              </div>
              {mode === "trainer" && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(s)} aria-label="Editar suplemento">
                    <Save className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => remove(s)} aria-label="Remover suplemento">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
            {s.notes && <p className="text-xs text-secondary-foreground whitespace-pre-wrap">{s.notes}</p>}
            <p className="text-[11px] text-muted-foreground">
              Início: {new Date(`${s.start_date}T12:00:00`).toLocaleDateString("pt-BR")}
              {s.end_date ? ` • Término: ${new Date(`${s.end_date}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}
            </p>
            {mode === "student" && (
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <Checkbox checked={takenToday.has(s.id)} onCheckedChange={(v) => toggleTaken(s, v === true)} />
                <span className="text-xs text-muted-foreground">Utilizado hoje</span>
              </label>
            )}
            {mode === "trainer" && takenToday.has(s.id) && (
              <p className="text-[11px] text-primary">✅ Aluno marcou como utilizado hoje</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SupplementsPanel;
