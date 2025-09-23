import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { DefectRanking } from '@/types/dashboard';

interface DefectChartProps {
  data: DefectRanking[];
}

export const DefectChart = ({ data }: DefectChartProps) => {
  const chartData = data.slice(0, 8).map(item => ({
    ...item,
    defeito: item.defeito.length > 25 ? item.defeito.substring(0, 25) + '...' : item.defeito,
    defeitoCompleto: item.defeito // Keep full name for tooltip
  }));

  return (
    <ChartCard
      title="Top 8 Defeitos Mais Comuns"
      description="Ranking dos defeitos que mais aparecem nos registros"
    >
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 40,
              bottom: 100,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="defeito"
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string, props: any) => [
                `${value} ocorrências`,
                props.payload?.defeitoCompleto || 'Defeito'
              ]}
            />
            <Bar 
              dataKey="quantidade" 
              fill="hsl(var(--chart-2))" 
              radius={[4, 4, 0, 0]}
              name="Quantidade de Ocorrências"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};