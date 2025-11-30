import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ChartCard } from './ChartCard';
import { CityDistribution } from '@/types/dashboard';

interface CityChartProps {
  data: CityDistribution[];
  onFilterClick?: (value: string) => void;
  onDetailClick?: () => void;
}

export const CityChart = ({ data, onFilterClick, onDetailClick }: CityChartProps) => {
  // Show top 15 cities
  const chartData = data.slice(0, 15);

  return (
    <ChartCard
      title="Distribuição de OSs por Cidade"
      description="Quantidade de Ordens de Serviço originadas em cada cidade"
      onDetailClick={onDetailClick}
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
              dataKey="cidade"
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
              onClick={(data) => onFilterClick && onFilterClick(data.cidade)}
              cursor="pointer"
            >
              <LabelList dataKey="quantidade" position="top" fontSize={12} fill="hsl(var(--foreground))" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};