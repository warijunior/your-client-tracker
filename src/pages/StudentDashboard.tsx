import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, LogOut, CheckCircle2, Calendar, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentRecord {
  id: string;
  full_name: string;
  goal: string | null;
  weight: number | null;
}

interface Checkin {
  id: string;
  check_date: string;
  training_done: boolean;
  weight: number | null;
  notes: string | null;
}

interface Protocol {
  id: string;
  type: string;
  title: string;
  content: string;
  active: boolean;
}

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);

  // Check-in form
  const [trainingDone, setTrainingDone] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [todayCheckin, setTodayCheckin] = useState<Checkin | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    // Fetch student record linked to this user
    const { data: studentData } = await supabase
      .from("students")
      .select("id, full_name, goal, weight")
      .eq("user_id", user!.id)
      .limit(1)
      .single();

    if (studentData) {
      setStudent(studentData);
      await Promise.all([
        fetchCheckins(studentData.id),
        fetchProtocols(studentData.id),
      ]);
    }
    setLoading(false);
  };

  const fetchCheckins = async (studentId: string) => {
    const { data } = await supabase
      .from("checkins")
      .select("*")
      .eq("student_id", studentId)
      .order("check_date", { ascending: false });

    if (data) {
      setCheckins(data);
      const today = new Date().toISOString().split("T")[0];
      const existing = data.find((c) => c.check_date === today);
      if (existing) {
        setTodayCheckin(existing);
        setTrainingDone(existing.training_done);
        setWeight(existing.weight?.toString() || "");
        setNotes(existing.notes || "");
      }
    }
  };

  const fetchProtocols = async (studentId: string) => {
    const { data } = await supabase
      .from("protocols")
      .select("*")
      .eq("student_id", studentId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (data) setProtocols(data);
  };

  const handleCheckin = async () => {
    if (!student || !user) return;
    setSubmitting(true);

    const payload = {
      student_id: student.id,
      user_id: user.id,
      check_date: new Date().toISOString().split("T")[0],
      training_done: trainingDone,
      weight: weight ? parseFloat(weight) : null,
      notes: notes || null,
    };

    if (todayCheckin) {
      const { error } = await supabase
        .from("checkins")
        .update({ training_done: trainingDone, weight: weight ? parseFloat(weight) : null, notes: notes || null })
        .eq("id", todayCheckin.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check-in atualizado! ✅" });
        fetchCheckins(student.id);
      }
    } else {
      const { error } = await supabase.from("checkins").insert(payload);
      if (error) {
        toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check-in registrado! 💪" });
        fetchCheckins(student.id);
      }
    }
    setSubmitting(false);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const checkinDates = new Set(checkins.filter((c) => c.training_done).map((c) => c.check_date));

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Stats
  const now = new Date();
  const currentMonthCheckins = checkins.filter((c) => {
    const d = new Date(c.check_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && c.training_done;
  });
  const currentYearCheckins = checkins.filter((c) => {
    const d = new Date(c.check_date);
    return d.getFullYear() === now.getFullYear() && c.training_done;
  });

  // Streak
  let streak = 0;
  const sortedDates = [...checkinDates].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (sortedDates[i] === expected.toISOString().split("T")[0]) {
      streak++;
    } else break;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Conta não vinculada</h2>
          <p className="text-muted-foreground text-sm">Seu treinador precisa vincular seu email à sua ficha de aluno.</p>
          <Button variant="ghost" onClick={signOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-sm font-bold text-foreground">Olá, {student.full_name.split(" ")[0]}!</h1>
              <p className="text-xs text-muted-foreground">{student.goal ? `Objetivo: ${student.goal}` : "FitCoach Pro"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{streak}</p>
            <p className="text-xs text-muted-foreground">dias seguidos</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{currentMonthCheckins.length}</p>
            <p className="text-xs text-muted-foreground">treinos/mês</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{currentYearCheckins.length}</p>
            <p className="text-xs text-muted-foreground">treinos/ano</p>
          </div>
        </div>

        <Tabs defaultValue="checkin" className="w-full">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="checkin" className="flex-1 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Check-in
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="protocols" className="flex-1 text-xs">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Protocolos
            </TabsTrigger>
          </TabsList>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="mt-4 space-y-4">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground">
                {todayCheckin ? "✅ Check-in de hoje" : "📋 Registrar check-in"}
              </h3>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <Label className="text-sm text-foreground">Treino feito hoje?</Label>
                <Switch checked={trainingDone} onCheckedChange={setTrainingDone} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Peso atual (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ex: 78.5"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Notas do dia</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Como foi o treino? Disposição, dores, observações..."
                  className="bg-secondary border-border min-h-[80px]"
                />
              </div>

              <Button
                onClick={handleCheckin}
                disabled={submitting}
                className="w-full gradient-primary text-primary-foreground font-semibold h-12 glow-primary"
              >
                {submitting ? "Salvando..." : todayCheckin ? "Atualizar check-in" : "Registrar check-in"}
              </Button>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => {
                  const prev = new Date(calendarMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setCalendarMonth(prev);
                }}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-foreground">
                  {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </span>
                <Button variant="ghost" size="icon" onClick={() => {
                  const next = new Date(calendarMonth);
                  next.setMonth(next.getMonth() + 1);
                  setCalendarMonth(next);
                }}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {dayNames.map((d, i) => (
                  <div key={i} className="text-xs text-muted-foreground py-1">{d}</div>
                ))}
                {Array.from({ length: getFirstDayOfMonth(calendarMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(calendarMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const done = checkinDates.has(dateStr);
                  const isToday = dateStr === today;

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        done
                          ? "bg-primary/20 text-primary"
                          : isToday
                          ? "bg-secondary text-foreground ring-1 ring-primary/50"
                          : "text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : day}
                    </div>
                  );
                })}
              </div>

              {/* Monthly summary */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Treinos no mês</span>
                  <span className="font-semibold text-foreground">
                    {checkins.filter((c) => {
                      const d = new Date(c.check_date);
                      return d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear() && c.training_done;
                    }).length} dias
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Protocols Tab */}
          <TabsContent value="protocols" className="mt-4 space-y-3">
            {protocols.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Nenhum protocolo ativo. Seu treinador irá criar para você.
              </p>
            ) : (
              protocols.map((p) => (
                <div key={p.id} className="glass-card p-4 space-y-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.type === "training" ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-500"}`}>
                    {p.type === "training" ? "🏋️ Treino" : "🥗 Dieta"}
                  </span>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{p.content}</p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
