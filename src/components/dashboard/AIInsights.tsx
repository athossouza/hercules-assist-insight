import { useState } from 'react';
import { Brain, Loader2, TrendingUp, AlertCircle, Target, Clock, Shield, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { KPIData, ProductRanking, DefectRanking, StatusDistribution } from '@/types/dashboard';

interface InsightCard {
  title: string;
  description: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  priority: 'high' | 'medium' | 'low';
  icon: any;
  color: string;
}

interface AIInsightsProps {
  kpiData: KPIData;
  productRanking: ProductRanking[];
  defectRanking: DefectRanking[];
  statusDistribution: StatusDistribution[];
}

export const AIInsights = ({ kpiData, productRanking, defectRanking, statusDistribution }: AIInsightsProps) => {
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseAIResponse = (response: string): { cards: InsightCard[], summary: string } => {
    // Extract key metrics and insights from AI response
    const productWithMostIssues = productRanking[0];
    const mainDefect = defectRanking[0];
    const warrantyStatus = statusDistribution.find(s => s.status.includes('Garantia')) || statusDistribution[0];
    
    const cards: InsightCard[] = [
      {
        title: 'Produto Crítico',
        description: `${productWithMostIssues?.produto || 'N/A'} lidera em OSs`,
        value: `${productWithMostIssues?.quantidade || 0} OSs`,
        trend: 'up',
        priority: 'high',
        icon: AlertCircle,
        color: 'hsl(var(--destructive))'
      },
      {
        title: 'Defeito Principal', 
        description: 'Falha mais recorrente identificada',
        value: mainDefect?.defeito?.substring(0, 30) + '...' || 'N/A',
        trend: 'up',
        priority: 'high', 
        icon: Wrench,
        color: 'hsl(var(--destructive))'
      },
      {
        title: 'Tempo de Atendimento',
        description: 'Média atual de resolução',
        value: `${kpiData.avgServiceTime} dias`,
        trend: kpiData.avgServiceTime > 15 ? 'up' : 'down',
        priority: kpiData.avgServiceTime > 15 ? 'medium' : 'low',
        icon: Clock,
        color: kpiData.avgServiceTime > 15 ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-2))'
      },
      {
        title: 'Vida do Produto',
        description: 'Tempo médio até primeira falha',
        value: `${kpiData.avgProductLifetime} dias`,
        trend: kpiData.avgProductLifetime < 365 ? 'down' : 'up',
        priority: kpiData.avgProductLifetime < 365 ? 'high' : 'low',
        icon: Target,
        color: kpiData.avgProductLifetime < 365 ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))'
      },
      {
        title: 'Cobertura de Garantia',
        description: 'OSs em período de garantia',
        value: `${kpiData.warrantyPercentage}%`,
        trend: kpiData.warrantyPercentage > 50 ? 'up' : 'down',
        priority: kpiData.warrantyPercentage > 70 ? 'high' : 'medium',
        icon: Shield,
        color: kpiData.warrantyPercentage > 50 ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))'
      },
      {
        title: 'Status Operacional',
        description: 'Distribuição atual de OSs',
        value: `${statusDistribution.length} estados`,
        trend: 'neutral',
        priority: 'low',
        icon: TrendingUp,
        color: 'hsl(var(--chart-1))'
      }
    ];

    // Extract summary from response
    const summaryMatch = response.match(/Resumo Executivo:(.*?)(?=\n\n|\n###|\n##|$)/s);
    const extractedSummary = summaryMatch ? summaryMatch[1].trim() : 
      'Dashboard apresenta oportunidades de melhoria em qualidade e eficiência operacional.';

    return { cards, summary: extractedSummary };
  };

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const prompt = `Gere um Resumo Executivo conciso (máx 2 linhas) sobre os dados da Hercules Motores:

KPIs: ${kpiData.totalOrders} OSs, ${kpiData.avgServiceTime}d atendimento, ${kpiData.avgProductLifetime}d vida produto, ${kpiData.warrantyPercentage}% garantia

Top Produto: ${productRanking[0]?.produto} (${productRanking[0]?.quantidade} OSs)
Top Defeito: ${defectRanking[0]?.defeito} (${defectRanking[0]?.quantidade} casos)

Forneça apenas:
Resumo Executivo: [2 linhas máximo sobre pontos críticos e recomendações]`;

      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai', {
        body: { message: prompt }
      });

      if (functionError) throw new Error(functionError.message || 'Erro ao obter análise da IA');
      
      const aiResponse = functionData?.response;
      if (!aiResponse) throw new Error('Resposta vazia da IA');

      const { cards, summary: aiSummary } = parseAIResponse(aiResponse);
      setInsights(cards);
      setSummary(aiSummary);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Análise Inteligente</CardTitle>
          </div>
          {insights.length > 0 && (
            <Button 
              onClick={generateInsights} 
              variant="outline" 
              size="sm"
              className="gap-2"
              disabled={loading}
            >
              <Brain className="h-3 w-3" />
              Atualizar
            </Button>
          )}
        </div>
        <CardDescription>
          Insights estratégicos baseados nos dados do dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!insights.length && !loading && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Gere uma análise visual inteligente dos seus dados
            </p>
            <Button onClick={generateInsights} className="gap-2">
              <Brain className="h-4 w-4" />
              Gerar Insights Visuais
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Processando dados...</p>
            </div>
          </div>
        )}

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {summary && (
          <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resumo Executivo
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          </div>
        )}

        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${insight.color}20` }}
                      >
                        <insight.icon 
                          className="h-4 w-4" 
                          style={{ color: insight.color }} 
                        />
                      </div>
                      <Badge 
                        variant={insight.priority === 'high' ? 'destructive' : 
                                insight.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.priority === 'high' ? 'Crítico' : 
                         insight.priority === 'medium' ? 'Atenção' : 'OK'}
                      </Badge>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-sm text-foreground mb-1">
                    {insight.title}
                  </h4>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg" style={{ color: insight.color }}>
                      {insight.value}
                    </span>
                    <div className="flex items-center gap-1">
                      <TrendingUp 
                        className={`h-3 w-3 ${
                          insight.trend === 'up' ? 'text-red-500 rotate-0' : 
                          insight.trend === 'down' ? 'text-green-500 rotate-180' :
                          'text-muted-foreground rotate-90'
                        }`} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};