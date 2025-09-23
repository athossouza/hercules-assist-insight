import { useState } from 'react';
import { Brain, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { KPIData, ProductRanking, DefectRanking, StatusDistribution } from '@/types/dashboard';

interface AIInsightsProps {
  kpiData: KPIData;
  productRanking: ProductRanking[];
  defectRanking: DefectRanking[];
  statusDistribution: StatusDistribution[];
}

export const AIInsights = ({ kpiData, productRanking, defectRanking, statusDistribution }: AIInsightsProps) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data summary for AI analysis
      const dataContext = {
        kpis: kpiData,
        topProducts: productRanking.slice(0, 5),
        topDefects: defectRanking.slice(0, 5),
        statusDistrib: statusDistribution
      };

      const prompt = `Analise os seguintes dados de assistência técnica da Hercules Motores e forneça insights estratégicos:

KPIs:
- Total de OSs: ${kpiData.totalOrders}
- Tempo médio atendimento (garantia): ${kpiData.avgServiceTime} dias
- Tempo médio vida produto: ${kpiData.avgProductLifetime} dias  
- OSs em garantia: ${kpiData.warrantyPercentage}%

Top 5 Produtos com mais OSs:
${productRanking.slice(0, 5).map((p, i) => `${i+1}. ${p.produto}: ${p.quantidade} OSs`).join('\n')}

Top 5 Defeitos mais comuns:
${defectRanking.slice(0, 5).map((d, i) => `${i+1}. ${d.defeito}: ${d.quantidade} ocorrências`).join('\n')}

Distribuição por Status:
${statusDistribution.map(s => `- ${s.status}: ${s.quantidade} (${s.percentage}%)`).join('\n')}

Por favor, forneça:
1. Análise dos pontos críticos
2. Oportunidades de melhoria
3. Recomendações estratégicas
4. Insights sobre qualidade e confiabilidade dos produtos`;

      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai', {
        body: { message: prompt }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erro ao obter análise da IA');
      }

      const aiResponse = functionData?.response;
      if (!aiResponse) {
        throw new Error('Resposta vazia da IA');
      }

      setInsights(aiResponse);
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
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>Análise Inteligente</CardTitle>
        </div>
        <CardDescription>
          Insights estratégicos gerados por IA baseados nos dados do dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights && !loading && (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Clique no botão abaixo para gerar uma análise inteligente dos seus dados
            </p>
            <Button onClick={generateInsights} className="gap-2">
              <Brain className="h-4 w-4" />
              Gerar Insights com IA
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Analisando dados com IA...</p>
            </div>
          </div>
        )}

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {insights && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Insights Estratégicos</h4>
              <Button 
                onClick={generateInsights} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Brain className="h-3 w-3" />
                Atualizar Análise
              </Button>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-foreground bg-muted/50 p-4 rounded-lg">
                {insights}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};