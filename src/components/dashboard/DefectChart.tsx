import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { ChartCard } from './ChartCard';
import { DefectRanking } from '@/types/dashboard';

interface DefectChartProps {
  data: DefectRanking[];
  onFilterClick?: (value: string) => void;
  onDetailClick?: () => void;
  selectedDefect?: string;
}

export const DefectChart = ({ data, onFilterClick, onDetailClick, selectedDefect }: DefectChartProps) => {
  const chartData = data.slice(0, 8).map(item => ({
    ...item,
    defeito: item.defeito.length > 25 ? item.defeito.substring(0, 25) + '...' : item.defeito,
    defeitoCompleto: item.defeito // Keep full name for tooltip
  }));

  return (
    <ChartCard
      title="Top 8 Defeitos Mais Comuns"
      description="Ranking dos defeitos que mais aparecem nos registros"
      onDetailClick={onDetailClick}
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
              radius={[4, 4, 0, 0]}
              name="Quantidade de Ocorrências"
              onClick={(data) => onFilterClick && onFilterClick(data.defeitoCompleto)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="hsl(var(--chart-2))"
                  opacity={selectedDefect && selectedDefect !== entry.defeitoCompleto ? 0.3 : 1}
                />
              ))}
              <LabelList dataKey="quantidade" position="top" fontSize={12} fill="hsl(var(--foreground))" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};