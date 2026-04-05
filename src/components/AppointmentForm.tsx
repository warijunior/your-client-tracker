import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface Props {
  studentId: string;
  trainerId: string;
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string;
}

const AppointmentForm = ({ studentId, trainerId, onClose, onSaved, defaultDate }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    appointment_date: defaultDate || new Date().toISOString().split("T")[0],
    start_time: "08:00",
    end_time: "09:00",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("appointments").insert({
      student_id: studentId,
      trainer_id: trainerId,
      title: form.title,
      description: form.description || null,
      appointment_date: form.appointment_date,
      start_time: form.start_time,
      end_time: form.end_time || null,
    });

    // Create notification for student
    const { data: studentData } = await supabase
      .from("students")
      .select("user_id, full_name")
      .eq("id", studentId)
      .single();

    if (studentData?.user_id) {
      await supabase.from("notifications").insert({
        user_id: studentData.user_id,
        title: "Novo agendamento",
        message: `${form.title} em ${new Date(form.appointment_date).toLocaleDateString("pt-BR")} às ${form.start_time}`,
        type: "appointment",
      });
    }

    if (error) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agendamento criado! 📅" });
      onSaved();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Novo Agendamento</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Título *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Treino funcional" className="bg-secondary border-border" required />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Data *</Label>
            <Input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} className="bg-secondary border-border" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Início *</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="bg-secondary border-border" required />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Fim</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="bg-secondary border-border" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do agendamento..." className="bg-secondary border-border min-h-[60px]" />
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold h-12">
            {loading ? "Salvando..." : "Agendar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
