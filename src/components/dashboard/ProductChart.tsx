import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { ChartCard } from './ChartCard';
import { ProductRanking } from '@/types/dashboard';

interface ProductChartProps {
  data: ProductRanking[];
  onFilterClick?: (value: string) => void;
  onDetailClick?: () => void;
  selectedPart?: string;
}

export const ProductChart = ({ data, onFilterClick, onDetailClick, selectedPart }: ProductChartProps) => {
  const chartData = data.map(item => ({
    ...item,
    produto: item.produto.length > 30 ? item.produto.substring(0, 30) + '...' : item.produto,
    fullProduto: item.produto
  }));

  return (
    <ChartCard
      title="Top 10 Peças Trocadas"
      description="Ranking das peças mais substituídas em OSs"
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
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="produto"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
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
              radius={[4, 4, 0, 0]}
              name="Quantidade de OSs"
              onClick={(data) => onFilterClick && onFilterClick(data.fullProduto)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="hsl(var(--chart-1))"
                  opacity={selectedPart && selectedPart !== entry.fullProduto ? 0.3 : 1}
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