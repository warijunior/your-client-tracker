import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Activity, FileText, Plus, Calendar, Camera, DollarSign, MessageCircle } from "lucide-react";
import AssessmentForm from "@/components/AssessmentForm";
import ProtocolForm from "@/components/ProtocolForm";
import WeightChart from "@/components/WeightChart";
import AppointmentForm from "@/components/AppointmentForm";
import PhotoGallery from "@/components/PhotoGallery";
import PaymentManager from "@/components/PaymentManager";
import ChatWindow from "@/components/ChatWindow";

interface Student {
  id: string;
  full_name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  health_history: string | null;
  notes: string | null;
  user_id: string | null;
}

interface Assessment {
  id: string;
  weight: number | null;
  body_fat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arm: number | null;
  thigh: number | null;
  notes: string | null;
  assessed_at: string;
}

interface Protocol {
  id: string;
  type: string;
  title: string;
  content: string;
  active: boolean;
  created_at: string;
}

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  status: string;
}

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [protocolType, setProtocolType] = useState<"diet" | "training">("training");

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchAssessments();
      fetchProtocols();
      fetchAppointments();
    }
  }, [id]);

  const fetchStudent = async () => {
    const { data } = await supabase.from("students").select("*").eq("id", id!).single();
    if (data) setStudent(data);
  };

  const fetchAssessments = async () => {
    const { data } = await supabase.from("assessments").select("*").eq("student_id", id!).order("assessed_at", { ascending: true });
    if (data) setAssessments(data);
  };

  const fetchProtocols = async () => {
    const { data } = await supabase.from("protocols").select("*").eq("student_id", id!).order("created_at", { ascending: false });
    if (data) setProtocols(data);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("student_id", id!)
      .gte("appointment_date", new Date().toISOString().split("T")[0])
      .order("appointment_date", { ascending: true });
    if (data) setAppointments(data);
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show chat full screen
  if (showChat && student.user_id) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ChatWindow
          recipientId={student.user_id}
          recipientName={student.full_name}
          onBack={() => setShowChat(false)}
        />
      </div>
    );
  }

  const goalLabels: Record<string, string> = {
    emagrecimento: "🔥 Emagrecimento",
    hipertrofia: "💪 Hipertrofia",
    condicionamento: "🏃 Condicionamento",
    saude: "❤️ Saúde",
    reabilitacao: "🩺 Reabilitação",
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground truncate">{student.full_name}</h1>
          </div>
          {student.user_id && (
            <Button variant="ghost" size="icon" onClick={() => setShowChat(true)}>
              <MessageCircle className="w-5 h-5 text-primary" />
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{student.full_name}</h2>
              {student.goal && (
                <span className="text-sm text-primary">{goalLabels[student.goal] || student.goal}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {student.age && (
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-lg font-bold text-foreground">{student.age}</p>
                <p className="text-xs text-muted-foreground">anos</p>
              </div>
            )}
            {student.weight && (
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-lg font-bold text-foreground">{student.weight}</p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
            )}
            {student.height && (
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-lg font-bold text-foreground">{student.height}m</p>
                <p className="text-xs text-muted-foreground">altura</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="evolution" className="w-full">
          <TabsList className="w-full bg-secondary grid grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="evolution" className="text-xs">
              <Activity className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Evolução</span>
            </TabsTrigger>
            <TabsTrigger value="assessments" className="text-xs">
              <FileText className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Avaliações</span>
            </TabsTrigger>
            <TabsTrigger value="protocols" className="text-xs">
              <FileText className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Protocolos</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs">
              <Calendar className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs">
              <Camera className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">
              <DollarSign className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Pgto</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evolution" className="mt-4">
            {assessments.length > 1 ? (
              <WeightChart assessments={assessments} />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Adicione pelo menos 2 avaliações para ver o gráfico.
              </div>
            )}
          </TabsContent>

          <TabsContent value="assessments" className="mt-4 space-y-3">
            <Button onClick={() => setShowAssessmentForm(true)} className="w-full gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Nova avaliação
            </Button>
            {assessments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma avaliação registrada.</p>
            ) : (
              [...assessments].reverse().map((a) => (
                <div key={a.id} className="glass-card p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{new Date(a.assessed_at).toLocaleDateString("pt-BR")}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {a.weight && <div><span className="text-muted-foreground">Peso:</span> <span className="text-foreground font-medium">{a.weight}kg</span></div>}
                    {a.body_fat && <div><span className="text-muted-foreground">%G:</span> <span className="text-foreground font-medium">{a.body_fat}%</span></div>}
                    {a.chest && <div><span className="text-muted-foreground">Peito:</span> <span className="text-foreground font-medium">{a.chest}cm</span></div>}
                    {a.waist && <div><span className="text-muted-foreground">Cintura:</span> <span className="text-foreground font-medium">{a.waist}cm</span></div>}
                    {a.hips && <div><span className="text-muted-foreground">Quadril:</span> <span className="text-foreground font-medium">{a.hips}cm</span></div>}
                    {a.arm && <div><span className="text-muted-foreground">Braço:</span> <span className="text-foreground font-medium">{a.arm}cm</span></div>}
                    {a.thigh && <div><span className="text-muted-foreground">Coxa:</span> <span className="text-foreground font-medium">{a.thigh}cm</span></div>}
                  </div>
                  {a.notes && <p className="text-xs text-muted-foreground mt-2">{a.notes}</p>}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="protocols" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Button onClick={() => { setProtocolType("training"); setShowProtocolForm(true); }} className="flex-1 gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> Treino
              </Button>
              <Button onClick={() => { setProtocolType("diet"); setShowProtocolForm(true); }} variant="outline" className="flex-1 border-primary text-primary">
                <Plus className="w-4 h-4 mr-1" /> Dieta
              </Button>
            </div>
            {protocols.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum protocolo criado.</p>
            ) : (
              protocols.map((p) => (
                <div key={p.id} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.type === "training" ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-500"}`}>
                        {p.type === "training" ? "🏋️ Treino" : "🥗 Dieta"}
                      </span>
                      {p.active && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{p.content}</p>
                </div>
              ))
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-4 space-y-3">
            <Button onClick={() => setShowAppointmentForm(true)} className="w-full gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Novo agendamento
            </Button>
            {appointments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum agendamento futuro.</p>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="glass-card p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "scheduled" ? "bg-primary/10 text-primary" : a.status === "completed" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
                      {a.status === "scheduled" ? "Agendado" : a.status === "completed" ? "Concluído" : "Cancelado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📅 {new Date(a.appointment_date).toLocaleDateString("pt-BR")} • ⏰ {a.start_time.slice(0, 5)}{a.end_time ? ` - ${a.end_time.slice(0, 5)}` : ""}
                  </p>
                  {a.description && <p className="text-xs text-secondary-foreground">{a.description}</p>}
                </div>
              ))
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-4">
            <PhotoGallery studentId={id!} canUpload={true} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-4">
            <PaymentManager studentId={id!} studentName={student.full_name} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showAssessmentForm && (
        <AssessmentForm studentId={id!} trainerId={user!.id} onClose={() => setShowAssessmentForm(false)} onSaved={() => { setShowAssessmentForm(false); fetchAssessments(); }} />
      )}
      {showProtocolForm && (
        <ProtocolForm studentId={id!} trainerId={user!.id} type={protocolType} onClose={() => setShowProtocolForm(false)} onSaved={() => { setShowProtocolForm(false); fetchProtocols(); }} />
      )}
      {showAppointmentForm && (
        <AppointmentForm studentId={id!} trainerId={user!.id} onClose={() => setShowAppointmentForm(false)} onSaved={() => { setShowAppointmentForm(false); fetchAppointments(); }} />
      )}
    </div>
  );
};

export default StudentProfile;
