import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LoadPoint {
  performed_at: string;
  load: number;
}

/** Gráfico de evolução de carga por exercício (ordem cronológica). */
export const LoadChart = ({ logs }: { logs: LoadPoint[] }) => {
  const data = [...logs]
    .sort((a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime())
    .map((l) => ({
      date: new Date(l.performed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      carga: Number(l.load),
    }));

  if (data.length < 2) return null;

  return (
    <div className="pt-2">
      <p className="text-xs text-muted-foreground mb-2">Evolução de carga</p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="carga"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LoadChart;
