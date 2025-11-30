import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, User, MapPin, Wrench, FileText, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

const CustomerSummary = () => {
    const {
        data,
        loading,
        filters,
        setFilters,
        filterOptions
    } = useDashboardData();

    const [date, setDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });

    const [aiSummary, setAiSummary] = useState<string>("");
    const [loadingAi, setLoadingAi] = useState(false);

    // Filter data specifically for this view
    const customerData = useMemo(() => {
        if (!filters.reseller) return [];
        return data.filter(item => item["Revendedor"] === filters.reseller);
    }, [data, filters.reseller]);

    // Calculate Customer KPIs
    const customerKPIs = useMemo(() => {
        if (!customerData.length) return null;

        const totalOS = customerData.length;
        const activeOS = customerData.filter(item => {
            const status = item.Status?.toLowerCase() || "";
            return !status.includes("finalizad") && !status.includes("cancelad");
        }).length;

        // Sort by date to find last visit
        const sortedByDate = [...customerData].sort((a, b) => {
            const dateA = new Date(a["Data Abertura"].split('/').reverse().join('-'));
            const dateB = new Date(b["Data Abertura"].split('/').reverse().join('-'));
            return dateB.getTime() - dateA.getTime();
        });

        // Format date to remove time (dd/mm/yyyy)
        const lastVisit = sortedByDate[0]["Data Abertura"].substring(0, 10);
        const mainAuthorized = sortedByDate[0]["Razão Social Posto"]; // Most recent authorized center

        return {
            totalOS,
            activeOS,
            lastVisit,
            mainAuthorized
        };
    }, [customerData]);

    const handleDateSelect = (newDate: DateRange | undefined) => {
        setDate(newDate);
        if (newDate?.from) {
            setFilters(prev => ({
                ...prev,
                dateRange: {
                    start: newDate.from || null,
                    end: newDate.to || null
                }
            }));
        } else {
            setFilters(prev => ({
                ...prev,
                dateRange: { start: null, end: null }
            }));
        }
    };

    const generateCustomerSummary = async () => {
        if (!filters.reseller || !customerKPIs) return;

        setLoadingAi(true);
        try {
            const prompt = `Gere um resumo executivo para preparação de conversa com o revendedor, curto e breve ${filters.reseller}.
      Dados:
      - Total de OSs: ${customerKPIs.totalOS}
      - OSs Ativas: ${customerKPIs.activeOS}
      - Última Visita: ${customerKPIs.lastVisit}
      - Principal Autorizada: ${customerKPIs.mainAuthorized}
      
      Histórico recente: ${customerData.slice(0, 5).map(os => `${os["Data Abertura"]}: ${os["Defeito Constatado"]} (${os.Status})`).join('; ')}
      
      Foque em: histórico de problemas, recorrência e satisfação potencial. Seja direto e estratégico para o comercial. Seja breve de poucas palavras.
      IMPORTANTE: Não faça recomendações, sugestões ou orientações de como conduzir a reunião. Apenas apresente os fatos e insights.`;

            const { data: functionData, error: functionError } = await supabase.functions.invoke('ai', {
                body: { message: prompt }
            });

            if (functionError) throw new Error(functionError.message);
            setAiSummary(functionData.response);
        } catch (error) {
            console.error("Error generating summary:", error);
            setAiSummary("Erro ao gerar resumo. Tente novamente.");
        } finally {
            setLoadingAi(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resumo do Cliente</h1>
                    <p className="text-muted-foreground">Preparação para visitas e histórico de atendimento</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Select
                        value={filters.reseller}
                        onValueChange={(value) => {
                            setFilters(prev => ({ ...prev, reseller: value }));
                            setAiSummary(""); // Clear summary on customer change
                        }}
                    >
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Selecione um revendedor..." />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-[200px]">
                                {filterOptions.resellers?.map((reseller) => (
                                    <SelectItem key={reseller} value={reseller}>
                                        {reseller}
                                    </SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full md:w-[260px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd/MM/yyyy")} -{" "}
                                            {format(date.to, "dd/MM/yyyy")}
                                        </>
                                    ) : (
                                        format(date.from, "dd/MM/yyyy")
                                    )
                                ) : (
                                    <span>Filtrar por data</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateSelect}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {!filters.reseller ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground border-2 border-dashed rounded-lg">
                    <User className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg">Selecione um revendedor para visualizar o resumo</p>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de OSs</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{customerKPIs?.totalOS}</div>
                                <p className="text-xs text-muted-foreground">Histórico completo</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">OSs Ativas</CardTitle>
                                <Wrench className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{customerKPIs?.activeOS}</div>
                                <p className="text-xs text-muted-foreground">Em aberto ou andamento</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Última Visita</CardTitle>
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{customerKPIs?.lastVisit || "N/A"}</div>
                                <p className="text-xs text-muted-foreground">Data de abertura da última OS</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Principal Autorizada</CardTitle>
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm font-bold truncate" title={customerKPIs?.mainAuthorized}>
                                    {customerKPIs?.mainAuthorized || "N/A"}
                                </div>
                                <p className="text-xs text-muted-foreground">Último atendimento realizado</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* AI Summary */}
                        <Card className="lg:col-span-1 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-primary" />
                                    <CardTitle>Resumo Inteligente</CardTitle>
                                </div>
                                <CardDescription>Análise gerada por IA para preparação de visita</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!aiSummary ? (
                                    <div className="text-center py-8">
                                        <Button onClick={generateCustomerSummary} disabled={loadingAi}>
                                            {loadingAi ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Gerando...
                                                </>
                                            ) : (
                                                "Gerar Resumo do Cliente"
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                                        <ReactMarkdown>
                                            {aiSummary}
                                        </ReactMarkdown>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={generateCustomerSummary}
                                            className="mt-4 w-full"
                                            disabled={loadingAi}
                                        >
                                            Regerar Análise
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* OS History List */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Histórico de Ordens de Serviço</CardTitle>
                                <CardDescription>Lista detalhada de atendimentos do cliente</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-4">
                                        {customerData.map((os, index) => (
                                            <div key={index} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">OS: {os.OS || os["Número OS"]}</span>
                                                        <Badge variant={os.Status === "Finalizado" ? "secondary" : "default"}>
                                                            {os.Status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {Array.from(new Set(os.relatedItems?.map(i => i["Desc Produto"]) || [os["Desc Produto"]])).map((prod, i) => (
                                                            <div key={i} className="truncate border-b last:border-0 pb-1 last:pb-0 mb-1 last:mb-0">
                                                                {prod}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-sm font-medium mt-1">
                                                        {Array.from(new Set(os.relatedItems?.map(i => i["Defeito Constatado"]) || [os["Defeito Constatado"]])).map((def, i) => (
                                                            <div key={i} className="truncate text-xs text-red-500/80">
                                                                Defeito: {def}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right text-sm text-muted-foreground">
                                                    <div className="flex items-center justify-end gap-1 mb-1">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {os["Data Abertura"]}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span className="truncate max-w-[150px]" title={os["Razão Social Posto"]}>
                                                            {os["Razão Social Posto"]}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomerSummary;
