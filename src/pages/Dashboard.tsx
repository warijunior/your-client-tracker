import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LogOut, Dumbbell, Users, TrendingUp, Calendar, DollarSign } from "lucide-react";
import StudentCard from "@/components/StudentCard";
import NotificationBell from "@/components/NotificationBell";

interface Student {
  id: string;
  full_name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
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
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    fetchStudents();
    fetchUpcoming();
    fetchPendingPayments();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, full_name, age, weight, height, goal")
      .order("created_at", { ascending: false });
    if (!error && data) setStudents(data);
    setLoading(false);
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold text-foreground">FitCoach Pro</h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5 text-muted-foreground" />
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
                <Button onClick={() => navigate("/students/new")} className="gradient-primary text-primary-foreground">
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
              />
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      {students.length > 0 && (
        <button
          onClick={() => navigate("/students/new")}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-primary glow-primary flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6 text-primary-foreground" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
