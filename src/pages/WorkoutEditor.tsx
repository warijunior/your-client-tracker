import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Dumbbell, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  gif_url: string | null;
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  suggested_load: number | null;
  notes: string | null;
  exercises?: Exercise;
}

interface Workout {
  id: string;
  student_id: string;
  title: string;
  notes: string | null;
  active: boolean;
}

const WorkoutEditor = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [items, setItems] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exSearch, setExSearch] = useState("");

  const loadItems = async () => {
    if (!workoutId) return;
    const { data } = await supabase
      .from("workout_exercises")
      .select("*, exercises(id,name,muscle_group,gif_url)")
      .eq("workout_id", workoutId)
      .order("order_index");
    setItems((data as WorkoutExercise[]) ?? []);
  };

  useEffect(() => {
    if (!workoutId) return;
    (async () => {
      const { data: w } = await supabase.from("workouts").select("*").eq("id", workoutId).single();
      setWorkout(w as Workout);
      await loadItems();
      const { data: ex } = await supabase.from("exercises").select("id,name,muscle_group,gif_url").order("muscle_group").order("name");
      setExercises((ex as Exercise[]) ?? []);
      setLoading(false);
    })();
  }, [workoutId]);

  const filteredEx = useMemo(
    () => exercises.filter((e) => e.name.toLowerCase().includes(exSearch.toLowerCase()) || e.muscle_group.toLowerCase().includes(exSearch.toLowerCase())),
    [exercises, exSearch]
  );

  const addExercise = async (exerciseId: string) => {
    if (!workoutId) return;
    const order = items.length;
    const { error } = await supabase.from("workout_exercises").insert({
      workout_id: workoutId, exercise_id: exerciseId, order_index: order,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setPicker(false);
    setExSearch("");
    loadItems();
  };

  const updateItem = async (id: string, patch: Partial<WorkoutExercise>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await supabase.from("workout_exercises").update(patch).eq("id", id);
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
  };

  const removeItem = async (id: string) => {
    if (!confirm("Remover exercício do treino?")) return;
    const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateWorkout = async (patch: Partial<Workout>) => {
    if (!workout) return;
    setWorkout({ ...workout, ...patch });
    await supabase.from("workouts").update(patch).eq("id", workout.id);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!workout) return <p className="p-8 text-center">Treino não encontrado.</p>;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${workout.student_id}/workouts`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Dumbbell className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground truncate flex-1">{workout.title}</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="glass-card p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Título</Label>
            <Input value={workout.title} onChange={(e) => updateWorkout({ title: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea value={workout.notes ?? ""} onChange={(e) => updateWorkout({ notes: e.target.value })} className="bg-secondary border-border" />
          </div>
        </div>

        {items.map((it, idx) => (
          <div key={it.id} className="glass-card p-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary shrink-0">
                {it.exercises?.gif_url ? <img src={it.exercises.gif_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{idx + 1}. {it.exercises?.name}</p>
                <p className="text-xs text-muted-foreground">{it.exercises?.muscle_group}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Séries</Label>
                <Input type="number" value={it.sets} onChange={(e) => updateItem(it.id, { sets: parseInt(e.target.value) || 0 })} className="bg-secondary border-border h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Reps</Label>
                <Input value={it.reps} onChange={(e) => updateItem(it.id, { reps: e.target.value })} className="bg-secondary border-border h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Descanso (s)</Label>
                <Input type="number" value={it.rest_seconds} onChange={(e) => updateItem(it.id, { rest_seconds: parseInt(e.target.value) || 0 })} className="bg-secondary border-border h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Carga (kg)</Label>
                <Input type="number" step="0.5" value={it.suggested_load ?? ""} onChange={(e) => updateItem(it.id, { suggested_load: e.target.value ? parseFloat(e.target.value) : null })} className="bg-secondary border-border h-9 text-sm" />
              </div>
            </div>
            <Textarea placeholder="Observações para o aluno..." value={it.notes ?? ""} onChange={(e) => updateItem(it.id, { notes: e.target.value })} className="bg-secondary border-border text-sm min-h-[60px]" />
          </div>
        ))}

        <Button onClick={() => setPicker(true)} className="w-full gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Adicionar exercício
        </Button>
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-lg mx-auto p-4 space-y-3">
            <div className="flex items-center justify-between sticky top-0 bg-background py-2">
              <h2 className="font-bold text-foreground">Escolher exercício</h2>
              <Button variant="ghost" size="sm" onClick={() => setPicker(false)}>Fechar</Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={exSearch} onChange={(e) => setExSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              {filteredEx.map((ex) => (
                <button key={ex.id} onClick={() => addExercise(ex.id)} className="w-full glass-card p-2 flex items-center gap-3 text-left hover:ring-1 hover:ring-primary/50">
                  <div className="w-12 h-12 rounded-md bg-secondary overflow-hidden shrink-0">
                    {ex.gif_url ? <img src={ex.gif_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.muscle_group}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutEditor;
