import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LogOut, Users, TrendingUp, Calendar, DollarSign, UserPlus, BookOpen, Dumbbell, CheckCircle2, BellRing, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { XCLogo } from "@/components/XCLogo";
import StudentCard from "@/components/StudentCard";
import NotificationBell from "@/components/NotificationBell";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  full_name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  avatar_url?: string | null;
}

interface UpcomingAppointment {
  id: string;
  title: string;
  appointment_date: string;
  start_time: string;
  student_name: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [activeWorkouts, setActiveWorkouts] = useState(0);
  const [checkinsToday, setCheckinsToday] = useState(0);
  const [reminding, setReminding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchUpcoming();
    fetchPendingPayments();
    fetchEngagement();
  }, []);

  const fetchEngagement = async () => {
    const today = new Date().toISOString().split("T")[0];
    const [{ count: wCount }, { count: cCount }] = await Promise.all([
      supabase.from("workouts").select("*", { count: "exact", head: true }).eq("active", true),
      supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("check_date", today)
        .eq("training_done", true),
    ]);
    setActiveWorkouts(wCount || 0);
    setCheckinsToday(cCount || 0);
  };

  const remindStudents = async () => {
    setReminding(true);
    const today = new Date().toISOString().split("T")[0];
    const { data: linked } = await supabase
      .from("students")
      .select("id, full_name, user_id")
      .not("user_id", "is", null);

    const { data: done } = await supabase
      .from("checkins")
      .select("student_id")
      .eq("check_date", today);
    const doneSet = new Set((done ?? []).map((c) => c.student_id));

    const targets = (linked ?? []).filter((s) => !doneSet.has(s.id));
    if (targets.length === 0) {
      toast({ title: "Todos já fizeram check-in hoje 🎉" });
      setReminding(false);
      return;
    }

    const { error } = await supabase.from("notifications").insert(
      targets.map((s) => ({
        user_id: s.user_id as string,
        title: "Hora de treinar! 💪",
        message: "Seu treinador lembrou: registre seu treino de hoje no check-in.",
        type: "reminder",
        link: "/",
      }))
    );

    if (error) {
      toast({ title: "Não foi possível enviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Lembrete enviado para ${targets.length} aluno(s)` });
    }
    setReminding(false);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, full_name, age, weight, height, goal, avatar_url, updated_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (!error && data) setStudents(data);
    setLoading(false);
  };

  const deleteStudent = async (studentId: string) => {
    const { error } = await supabase
      .from("students")
      .update({ status: "inactive" })
      .eq("id", studentId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Aluno excluído com sucesso" });
      fetchStudents();
    }
  };

  const fetchUpcoming = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("appointments")
      .select("id, title, appointment_date, start_time, student_id")
      .gte("appointment_date", today)
      .eq("status", "scheduled")
      .order("appointment_date", { ascending: true })
      .limit(3);

    if (data && data.length > 0) {
      // Get student names
      const studentIds = [...new Set(data.map((a) => a.student_id))];
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, full_name")
        .in("id", studentIds);

      const nameMap = new Map(studentsData?.map((s) => [s.id, s.full_name]) || []);
      setUpcomingAppointments(
        data.map((a) => ({
          ...a,
          student_name: nameMap.get(a.student_id) || "—",
        }))
      );
    }
  };

  const fetchPendingPayments = async () => {
    const { count } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingPayments(count || 0);
  };

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black pb-24 theme-neon">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <XCLogo size={28} />
            <h1 className="text-lg font-bold text-white tracking-tight">XC <span className="text-white/50 font-medium">Esportiva</span></h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={() => navigate("/exercises")} title="Biblioteca de exercícios">
              <BookOpen className="w-5 h-5 text-accent" />
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/trainers/invite")} title="Convidar treinador">
                <UserPlus className="w-5 h-5 text-accent" />
              </Button>
            )}
            <Avatar className="w-8 h-8 border border-white/10 ml-1">
              <AvatarFallback className="bg-secondary">
                <User className="w-4 h-4 text-white/50" />
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5 text-white/50" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 space-y-1">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{students.length}</p>
            <p className="text-xs text-muted-foreground">Alunos</p>
          </div>
          <div className="glass-card p-4 space-y-1">
            <Calendar className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{upcomingAppointments.length}</p>
            <p className="text-xs text-muted-foreground">Agendamentos</p>
          </div>
          <div className="glass-card p-4 space-y-1">
            <DollarSign className="w-5 h-5 text-destructive" />
            <p className="text-2xl font-bold text-foreground">{pendingPayments}</p>
            <p className="text-xs text-muted-foreground">Pgtos pendentes</p>
          </div>
        </div>

        {/* Engajamento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 space-y-1">
            <Dumbbell className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{activeWorkouts}</p>
            <p className="text-xs text-muted-foreground">Treinos ativos</p>
          </div>
          <div className="glass-card p-4 space-y-1">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{checkinsToday}</p>
            <p className="text-xs text-muted-foreground">Check-ins hoje</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={remindStudents}
          disabled={reminding}
          className="w-full border-border"
        >
          <BellRing className="w-4 h-4 mr-2 text-primary" />
          {reminding ? "Enviando lembretes..." : "Lembrar alunos de treinar hoje"}
        </Button>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">📅 Próximos agendamentos</h2>
            {upcomingAppointments.map((a) => (
              <div key={a.id} className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.student_name} • {new Date(a.appointment_date).toLocaleDateString("pt-BR")} às {a.start_time.slice(0, 5)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        {/* Student List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Users className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                {search ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              </p>
              {!search && (
                <Button onClick={() => navigate("/students/new")} className="gradient-neon text-white">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar primeiro aluno
                </Button>
              )}
            </div>
          ) : (
            filtered.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onClick={() => navigate(`/students/${student.id}`)}
                onDelete={() => deleteStudent(student.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      {students.length > 0 && (
        <button
          onClick={() => navigate("/students/new")}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-neon glow-accent flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          <Plus className="w-6 h-6 text-primary-foreground" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
