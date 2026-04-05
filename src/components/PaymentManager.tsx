import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, DollarSign, Plus } from "lucide-react";

interface Payment {
  id: string;
  student_id: string;
  amount: number;
  reference_month: string;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  studentId: string;
  studentName: string;
}

const PaymentManager = ({ studentId, studentName }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    fetchPayments();
  }, [studentId]);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("student_id", studentId)
      .order("reference_month", { ascending: false });
    if (data) setPayments(data);
  };

  const createPayment = async () => {
    if (!user || !amount) return;
    setLoading(true);

    const { error } = await supabase.from("payments").insert({
      student_id: studentId,
      trainer_id: user.id,
      amount: parseFloat(amount),
      reference_month: month,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cobrança criada! 💳" });
      setShowForm(false);
      setAmount("");
      fetchPayments();
    }
    setLoading(false);
  };

  const toggleStatus = async (payment: Payment) => {
    const newStatus = payment.status === "paid" ? "pending" : "paid";
    const { error } = await supabase
      .from("payments")
      .update({ status: newStatus, paid_at: newStatus === "paid" ? new Date().toISOString() : null })
      .eq("id", payment.id);

    if (!error) {
      // Notify student
      const { data: studentData } = await supabase
        .from("students")
        .select("user_id")
        .eq("id", studentId)
        .single();

      if (studentData?.user_id && newStatus === "paid") {
        await supabase.from("notifications").insert({
          user_id: studentData.user_id,
          title: "Pagamento confirmado",
          message: `Pagamento de R$ ${payment.amount} referente a ${formatMonth(payment.reference_month)} confirmado!`,
          type: "payment",
        });
      }

      fetchPayments();
      toast({ title: newStatus === "paid" ? "Pagamento confirmado ✅" : "Marcado como pendente" });
    }
  };

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(mo) - 1]}/${y}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" /> Pagamentos
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="border-primary text-primary">
          <Plus className="w-3 h-3 mr-1" /> Nova cobrança
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150.00" className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mês referência</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
          <Button onClick={createPayment} disabled={loading || !amount} className="w-full gradient-primary text-primary-foreground" size="sm">
            {loading ? "Salvando..." : "Criar cobrança"}
          </Button>
        </div>
      )}

      {payments.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
      ) : (
        payments.map((p) => (
          <div key={p.id} className="glass-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">R$ {p.amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{formatMonth(p.reference_month)}</p>
            </div>
            <Button
              size="sm"
              variant={p.status === "paid" ? "default" : "outline"}
              className={p.status === "paid" ? "bg-primary/20 text-primary hover:bg-primary/30" : "border-destructive text-destructive"}
              onClick={() => toggleStatus(p)}
            >
              {p.status === "paid" ? <><Check className="w-3 h-3 mr-1" /> Pago</> : <><X className="w-3 h-3 mr-1" /> Pendente</>}
            </Button>
          </div>
        ))
      )}
    </div>
  );
};

export default PaymentManager;
