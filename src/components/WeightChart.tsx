import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Assessment {
  assessed_at: string;
  weight: number | null;
}

const WeightChart = ({ assessments }: { assessments: Assessment[] }) => {
  const data = assessments
    .filter((a) => a.weight !== null)
    .map((a) => ({
      date: new Date(a.assessed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      peso: a.weight,
    }));

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">📈 Evolução de Peso</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 18%)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(240 5% 55%)" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 55%)" }} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(240 15% 8%)",
              border: "1px solid hsl(240 10% 18%)",
              borderRadius: "8px",
              color: "hsl(0 0% 95%)",
            }}
          />
          <Line
            type="monotone"
            dataKey="peso"
            stroke="hsl(145 80% 50%)"
            strokeWidth={2}
            dot={{ fill: "hsl(145 80% 50%)", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;
