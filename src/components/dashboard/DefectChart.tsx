import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { DefectRanking } from '@/types/dashboard';

interface DefectChartProps {
  data: DefectRanking[];
}

export const DefectChart = ({ data }: DefectChartProps) => {
  const chartData = data.map(item => ({
    ...item,
    defeito: item.defeito.length > 40 ? item.defeito.substring(0, 40) + '...' : item.defeito
  }));

  return (
    <ChartCard
      title="Top 10 Defeitos Mais Comuns"
      description="Ranking dos defeitos que mais aparecem nos registros"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80,
            }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
            />
            <YAxis 
              type="category"
              dataKey="defeito" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              width={150}
            />
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
              fill="hsl(var(--chart-2))" 
              radius={[0, 4, 4, 0]}
              name="Quantidade de Ocorrências"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};