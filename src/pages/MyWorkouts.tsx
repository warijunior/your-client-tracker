import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Dumbbell, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Workout { id: string; title: string; notes: string | null; }
interface Exercise { id: string; name: string; muscle_group: string; gif_url: string | null; description: string | null; }
interface WorkoutExercise {
  id: string; sets: number; reps: string; rest_seconds: number;
  suggested_load: number | null; notes: string | null; order_index: number;
  exercises: Exercise;
}
interface LogEntry { id: string; load: number; reps_done: number | null; notes: string | null; performed_at: string; }

const MyWorkouts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selected, setSelected] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [logsByEx, setLogsByEx] = useState<Record<string, LogEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("students").select("id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!s) { setLoading(false); return; }
      setStudentId(s.id);
      const { data: w } = await supabase.from("workouts").select("id,title,notes").eq("student_id", s.id).eq("active", true).order("created_at", { ascending: false });
      setWorkouts((w as Workout[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const openWorkout = async (w: Workout) => {
    setSelected(w);
    const { data: ex } = await supabase
      .from("workout_exercises")
      .select("*, exercises(id,name,muscle_group,gif_url,description)")
      .eq("workout_id", w.id)
      .order("order_index");
    const items = (ex as WorkoutExercise[]) ?? [];
    setExercises(items);
    if (items.length) {
      const ids = items.map((i) => i.id);
      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("id,workout_exercise_id,load,reps_done,notes,performed_at")
        .in("workout_exercise_id", ids)
        .order("performed_at", { ascending: false });
      const map: Record<string, LogEntry[]> = {};
      (logs ?? []).forEach((l: any) => {
        if (!map[l.workout_exercise_id]) map[l.workout_exercise_id] = [];
        map[l.workout_exercise_id].push(l);
      });
      setLogsByEx(map);
    } else setLogsByEx({});
  };

  const addLog = async (we: WorkoutExercise, load: number, reps_done: number | null, notes: string | null): Promise<void> => {
    if (!user || !studentId) return;
    const { data, error } = await supabase.from("exercise_logs").insert({
      workout_exercise_id: we.id, student_id: studentId, user_id: user.id,
      load, reps_done, notes,
    }).select().single();
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setLogsByEx((prev) => ({ ...prev, [we.id]: [data as LogEntry, ...(prev[we.id] ?? [])] }));
    toast({ title: "Carga registrada! 💪" });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (selected) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => { setSelected(null); setExercises([]); }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Dumbbell className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground truncate">{selected.title}</h1>
          </div>
        </header>
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {selected.notes && <p className="text-sm text-muted-foreground glass-card p-3">{selected.notes}</p>}
          {exercises.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum exercício neste treino ainda.</p>
          ) : exercises.map((we, idx) => (
            <ExerciseBlock key={we.id} we={we} idx={idx} logs={logsByEx[we.id] ?? []} onLog={addLog} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Dumbbell className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Meus treinos</h1>
        </div>
      </header>
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {workouts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum treino ativo. Aguarde seu treinador montar seu treino.</p>
        ) : workouts.map((w) => (
          <button key={w.id} onClick={() => openWorkout(w)} className="w-full glass-card p-4 text-left hover:ring-1 hover:ring-primary/50">
            <p className="font-semibold text-foreground">{w.title}</p>
            {w.notes && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{w.notes}</p>}
          </button>
        ))}
      </div>
    </div>
  );
};

const ExerciseBlock = ({
  we, idx, logs, onLog,
}: {
  we: WorkoutExercise; idx: number; logs: LogEntry[];
  onLog: (we: WorkoutExercise, load: number, reps: number | null, notes: string | null) => Promise<void>;
}) => {
  const [load, setLoad] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");
  const [showHist, setShowHist] = useState(false);

  const last = logs[0];
  const best = logs.reduce<LogEntry | null>((acc, l) => (!acc || l.load > acc.load ? l : acc), null);

  const submit = async () => {
    const n = parseFloat(load);
    if (!n || n <= 0) return;
    await onLog(we, n, reps ? parseInt(reps) : null, notes || null);
    setLoad(""); setReps(""); setNotes("");
  };

  if (!we.exercises) return null;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 rounded-md bg-secondary overflow-hidden shrink-0">
          {we.exercises.gif_url && <img src={we.exercises.gif_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{idx + 1}. {we.exercises.name}</p>
          <p className="text-xs text-muted-foreground">{we.exercises.muscle_group}</p>
          <p className="text-sm text-foreground mt-1">{we.sets} × {we.reps} · {we.rest_seconds}s desc.</p>
          {we.suggested_load != null && <p className="text-xs text-primary">Sugerido: {we.suggested_load} kg</p>}
        </div>
      </div>

      {we.notes && <p className="text-xs text-muted-foreground italic">Obs.: {we.notes}</p>}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-secondary p-2">
          <p className="text-muted-foreground">Última carga</p>
          <p className="font-semibold text-foreground">{last ? `${last.load} kg` : "—"}</p>
        </div>
        <div className="rounded-md bg-secondary p-2">
          <p className="text-muted-foreground">Melhor</p>
          <p className="font-semibold text-primary">{best ? `${best.load} kg` : "—"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Registrar carga deste treino</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" step="0.5" placeholder="Carga (kg)" value={load} onChange={(e) => setLoad(e.target.value)} className="bg-secondary border-border h-9" />
          <Input type="number" placeholder="Reps realizadas" value={reps} onChange={(e) => setReps(e.target.value)} className="bg-secondary border-border h-9" />
        </div>
        <Textarea placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border text-sm min-h-[50px]" />
        <Button onClick={submit} className="w-full gradient-primary text-primary-foreground h-9">Salvar carga</Button>
      </div>

      {logs.length > 0 && (
        <button onClick={() => setShowHist((v) => !v)} className="w-full text-xs text-primary flex items-center justify-center gap-1">
          <TrendingUp className="w-3 h-3" /> {showHist ? "Ocultar" : "Ver"} histórico ({logs.length})
        </button>
      )}
      {showHist && (
        <div className="space-y-1 pt-2 border-t border-border">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{new Date(l.performed_at).toLocaleDateString("pt-BR")}</span>
              <span className="text-foreground font-medium">{l.load} kg{l.reps_done ? ` × ${l.reps_done}` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyWorkouts;
