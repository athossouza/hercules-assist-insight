import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { MonthlyTrend } from '@/types/dashboard';

interface TrendChartProps {
  data: MonthlyTrend[];
}

export const TrendChart = ({ data }: TrendChartProps) => {
  const chartData = data.map(item => ({
    ...item,
    monthFormatted: new Date(item.month + '-01').toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'short' 
    })
  }));

  return (
    <ChartCard
      title="Evolução Mensal de Abertura de Ordens de Serviço"
      description="Tendências, picos e sazonalidade ao longo do tempo"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              dataKey="monthFormatted" 
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
            <Line 
              type="monotone" 
              dataKey="quantidade" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: 'hsl(var(--chart-3))', strokeWidth: 2 }}
              name="Ordens de Serviço"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};