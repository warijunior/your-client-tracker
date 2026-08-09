import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, FlaskConical, Pill } from "lucide-react";

interface Props {
  studentId: string;
}

const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

interface Summary {
  goalMl: number | null;
  consumedToday: number;
  week: { date: string; total: number }[];
  supplements: { id: string; name: string; dosage: number | null; unit: string; schedule: string | null }[];
  exam: { required: boolean; guidance: string | null; next_date: string | null; periodicity: string | null } | null;
}

const FollowUpPanel = ({ studentId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Summary | null>(null);

  const load = useCallback(async () => {
    const [goalRes, logsRes, supRes, examRes] = await Promise.all([
      supabase.from("hydration_goals").select("daily_goal_ml").eq("student_id", studentId).maybeSingle(),
      supabase.from("water_logs").select("log_date, amount_ml").eq("student_id", studentId).gte("log_date", daysAgoStr(6)),
      supabase.from("supplements").select("id, name, dosage, unit, schedule").eq("student_id", studentId).order("created_at", { ascending: false }),
      supabase.from("exam_followups").select("required, guidance, next_date, periodicity").eq("student_id", studentId).maybeSingle(),
    ]);

    const byDay = new Map<string, number>();
    (logsRes.data ?? []).forEach((l) => byDay.set(l.log_date, (byDay.get(l.log_date) ?? 0) + l.amount_ml));

    setData({
      goalMl: goalRes.data?.daily_goal_ml ?? null,
      consumedToday: byDay.get(todayStr()) ?? 0,
      week: Array.from({ length: 7 }).map((_, i) => {
        const date = daysAgoStr(i);
        return { date, total: byDay.get(date) ?? 0 };
      }),
      supplements: supRes.data ?? [],
      exam: examRes.data ?? null,
    });
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  const goal = data.goalMl ?? 0;
  const percent = goal > 0 ? Math.min(Math.round((data.consumedToday / goal) * 100), 100) : 0;

  return (
    <div className="space-y-3">
      {/* Hidratação */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Droplets className="w-4 h-4 text-primary" /> Hidratação
        </h3>
        {goal === 0 ? (
          <p className="text-sm text-muted-foreground">Meta diária ainda não definida.</p>
        ) : (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Meta diária</span>
              <span className="text-foreground font-medium">{goal.toLocaleString("pt-BR")} ml</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Consumo de hoje</span>
              <span className="text-primary font-semibold">{data.consumedToday.toLocaleString("pt-BR")} ml ({percent}%)</span>
            </div>
            <Progress value={percent} className="h-2" />
            <div className="grid grid-cols-7 gap-1 pt-1">
              {[...data.week].reverse().map((d) => {
                const p = goal > 0 ? Math.min((d.total / goal) * 100, 100) : 0;
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1">
                    <div className="w-full h-12 bg-secondary rounded-md flex items-end overflow-hidden">
                      <div className="w-full bg-primary/70 rounded-md" style={{ height: `${p}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(`${d.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Suplementação */}
      <div className="glass-card p-4 space-y-2">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Pill className="w-4 h-4 text-primary" /> Suplementação
        </h3>
        {data.supplements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum suplemento cadastrado.</p>
        ) : (
          data.supplements.map((s) => (
            <div key={s.id} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
              <span className="text-foreground font-medium">{s.name}</span>
              <span className="text-muted-foreground">
                {s.dosage ? `${s.dosage} ${s.unit}` : s.unit}
                {s.schedule ? ` • ${s.schedule}` : ""}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Exames */}
      <div className="glass-card p-4 space-y-2">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" /> Exames
        </h3>
        {!data.exam ? (
          <p className="text-sm text-muted-foreground">Nenhum acompanhamento registrado.</p>
        ) : (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Necessidade de acompanhamento</span>
              <span className="text-foreground">{data.exam.required ? "Sim" : "Não"}</span>
            </div>
            {data.exam.periodicity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periodicidade</span>
                <span className="text-foreground">{data.exam.periodicity}</span>
              </div>
            )}
            {data.exam.next_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data prevista</span>
                <span className="text-foreground">{new Date(`${data.exam.next_date}T12:00:00`).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {data.exam.guidance && <p className="text-secondary-foreground whitespace-pre-wrap pt-1">{data.exam.guidance}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpPanel;
