import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { AuthorizedDistribution } from '@/types/dashboard';

interface AuthorizedChartProps {
  data: AuthorizedDistribution[];
}

export const AuthorizedChart = ({ data }: AuthorizedChartProps) => {
  // Show top 10 authorized services
  const chartData = data.slice(0, 10).map(item => ({
    ...item,
    autorizada: item.autorizada.length > 20 
      ? item.autorizada.substring(0, 20) + '...' 
      : item.autorizada
  }));

  return (
    <ChartCard
      title="Distribuição de OSs por Autorizada"
      description="Quantidade de Ordens de Serviço por empresa autorizada"
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
              dataKey="autorizada" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={100}
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
              fill="hsl(var(--chart-3))" 
              radius={[4, 4, 0, 0]}
              name="Quantidade de OSs"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};