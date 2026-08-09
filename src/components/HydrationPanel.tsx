import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Loader2, Save, Target } from "lucide-react";

interface Props {
  studentId: string;
  /** trainer = define meta e visualiza; student = registra consumo */
  mode: "trainer" | "student";
  userId: string;
}

interface WaterLog {
  id: string;
  log_date: string;
  amount_ml: number;
}

const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const HydrationPanel = ({ studentId, mode, userId }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalMl, setGoalMl] = useState<number>(3000);
  const [goalInput, setGoalInput] = useState("3000");
  const [goalUnit, setGoalUnit] = useState<"ml" | "L">("ml");
  const [hasGoal, setHasGoal] = useState(false);
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [manual, setManual] = useState("");

  const load = useCallback(async () => {
    const [goalRes, logsRes] = await Promise.all([
      supabase.from("hydration_goals").select("*").eq("student_id", studentId).maybeSingle(),
      supabase
        .from("water_logs")
        .select("id, log_date, amount_ml")
        .eq("student_id", studentId)
        .gte("log_date", daysAgoStr(6))
        .order("log_date", { ascending: false }),
    ]);
    if (goalRes.data) {
      setGoalMl(goalRes.data.daily_goal_ml);
      setGoalInput(String(goalRes.data.daily_goal_ml));
      setHasGoal(true);
    }
    setLogs(logsRes.data ?? []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const byDay = new Map<string, number>();
    logs.forEach((l) => byDay.set(l.log_date, (byDay.get(l.log_date) ?? 0) + l.amount_ml));
    return byDay;
  }, [logs]);

  const consumedToday = totals.get(todayStr()) ?? 0;
  const remaining = Math.max(goalMl - consumedToday, 0);
  const percent = goalMl > 0 ? Math.min(Math.round((consumedToday / goalMl) * 100), 100) : 0;

  const saveGoal = async () => {
    const raw = parseFloat(goalInput.replace(",", "."));
    if (!raw || raw <= 0) {
      toast({ title: "Informe uma meta válida", variant: "destructive" });
      return;
    }
    const ml = Math.round(goalUnit === "L" ? raw * 1000 : raw);
    setSaving(true);
    const { error } = await supabase
      .from("hydration_goals")
      .upsert({ student_id: studentId, trainer_id: userId, daily_goal_ml: ml }, { onConflict: "student_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar meta", description: error.message, variant: "destructive" });
      return;
    }
    setGoalMl(ml);
    setGoalInput(String(ml));
    setGoalUnit("ml");
    setHasGoal(true);
    toast({ title: "Meta diária salva 💧" });
  };

  const addWater = async (amount: number) => {
    if (!amount || amount <= 0) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("water_logs")
      .insert({ student_id: studentId, user_id: userId, log_date: todayStr(), amount_ml: Math.round(amount) })
      .select("id, log_date, amount_ml")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao registrar água", description: error.message, variant: "destructive" });
      return;
    }
    setLogs((prev) => [data as WaterLog, ...prev]);
    toast({ title: `+${Math.round(amount)} ml registrados 💧` });
  };

  const history = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const date = daysAgoStr(i);
        return { date, total: totals.get(date) ?? 0 };
      }),
    [totals]
  );

  const labelFor = (date: string, i: number) =>
    i === 0 ? "Hoje" : i === 1 ? "Ontem" : new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Meta / resumo */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Hidratação diária</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-secondary">
            <p className="text-lg font-bold text-foreground">{goalMl.toLocaleString("pt-BR")}</p>
            <p className="text-[11px] text-muted-foreground">meta (ml)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary">
            <p className="text-lg font-bold text-primary">{consumedToday.toLocaleString("pt-BR")}</p>
            <p className="text-[11px] text-muted-foreground">consumido</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary">
            <p className="text-lg font-bold text-foreground">{remaining.toLocaleString("pt-BR")}</p>
            <p className="text-[11px] text-muted-foreground">restante</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Progress value={percent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {consumedToday.toLocaleString("pt-BR")} / {goalMl.toLocaleString("pt-BR")} ml
            </span>
            <span className="text-primary font-semibold">{percent}%</span>
          </div>
        </div>
      </div>

      {/* Treinador: definir meta */}
      {mode === "trainer" && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Meta diária de água</h3>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quantidade</Label>
              <Input
                type="number"
                step="0.1"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder={goalUnit === "ml" ? "Ex: 3000" : "Ex: 3"}
                className="bg-secondary border-border"
              />
            </div>
            <div className="w-24 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Unidade</Label>
              <div className="flex rounded-md overflow-hidden border border-border">
                {(["ml", "L"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setGoalUnit(u)}
                    className={`flex-1 text-xs py-2 transition-colors ${goalUnit === u ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={saveGoal} disabled={saving} className="w-full gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {hasGoal ? "Atualizar meta" : "Definir meta"}
          </Button>
        </div>
      )}

      {/* Aluno: registrar consumo */}
      {mode === "student" && (
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Registrar consumo</h3>
          <div className="grid grid-cols-2 gap-2">
            {[250, 500, 750, 1000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                disabled={saving}
                onClick={() => addWater(amount)}
                className="border-primary/40 text-primary h-11"
              >
                +{amount === 1000 ? "1 L" : `${amount} ml`}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Outra quantidade (ml)</Label>
              <Input
                type="number"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Ex: 350"
                className="bg-secondary border-border"
              />
            </div>
            <Button
              disabled={saving || !manual}
              onClick={async () => {
                await addWater(parseInt(manual, 10));
                setManual("");
              }}
              className="gradient-primary text-primary-foreground h-10"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
            </Button>
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="glass-card p-5 space-y-2">
        <h3 className="font-semibold text-foreground text-sm">Histórico (últimos 7 dias)</h3>
        {history.map((h, i) => {
          const pct = goalMl > 0 ? Math.min(Math.round((h.total / goalMl) * 100), 100) : 0;
          return (
            <div key={h.date} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{labelFor(h.date, i)}</span>
                <span className="text-foreground font-medium">{h.total.toLocaleString("pt-BR")} ml</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HydrationPanel;
