import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "./ChartCard";

interface ServiceTimeChartProps {
    data: { period: string; avgTime: number }[];
    onDetailClick?: () => void;
}

export const ServiceTimeChart = ({ data, onDetailClick }: ServiceTimeChartProps) => {
    return (
        <ChartCard
            title="Evolução do Tempo Médio de Atendimento"
            description="Acompanhamento histórico (em dias)"
            onDetailClick={onDetailClick}
            className="col-span-1 lg:col-span-2"
        >
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="period"
                            className="text-xs text-muted-foreground"
                            tick={{ fill: 'currentColor' }}
                            tickMargin={10}
                        />
                        <YAxis
                            className="text-xs text-muted-foreground"
                            tick={{ fill: 'currentColor' }}
                            tickFormatter={(value) => `${value}d`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value: number) => [`${value} dias`, 'Tempo Médio']}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="avgTime"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#2563eb' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
};
