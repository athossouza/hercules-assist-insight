import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { StateDistribution } from '@/types/dashboard';

interface StateChartProps {
  data: StateDistribution[];
}

export const StateChart = ({ data }: StateChartProps) => {
  // Show top 15 states
  const chartData = data.slice(0, 15);

  return (
    <ChartCard
      title="Distribuição de OSs por Estado"
      description="Quantidade de Ordens de Serviço originadas em cada estado"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="estado" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar 
              dataKey="quantidade" 
              fill="hsl(var(--chart-4))" 
              radius={[4, 4, 0, 0]}
              name="Quantidade de OSs"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};