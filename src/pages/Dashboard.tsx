import { Loader2, FileText, Clock, Calendar, Shield, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ProductChart } from "@/components/dashboard/ProductChart";
import { DefectChart } from "@/components/dashboard/DefectChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { CityChart } from "@/components/dashboard/CityChart";
import { AuthorizedChart } from "@/components/dashboard/AuthorizedChart";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { ServiceTimeChart } from "@/components/dashboard/ServiceTimeChart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ServiceOrderModal } from "@/components/dashboard/ServiceOrderModal";
import { useState } from "react";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    loading,
    error,
    filters,
    setFilters,
    kpiData,
    productRanking,
    defectRanking,
    monthlyTrends,
    serviceTimeTrends,
    statusDistribution,
    cityDistribution,
    authorizedDistribution,
    filterOptions,
    data: filteredData
  } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          Dashboard Hercules Motores
        </h1>
        <p className="text-lg text-muted-foreground">
          Assistência Técnica - Análise de Ordens de Serviço
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        <KPICard
          title="Total de Ordens de Serviço"
          value={kpiData.totalOrders}
          subtitle="OSs registradas no período"
          icon={FileText}
          variant="primary"
          onDetailClick={() => setIsModalOpen(true)}
        />
        <KPICard
          title="Tempo Médio de Atendimento"
          value={`${kpiData.avgServiceTime} dias`}
          subtitle="Para OSs em garantia"
          icon={Clock}
          variant="secondary"
          onDetailClick={() => setIsModalOpen(true)}
        />
        <KPICard
          title="Tempo Médio de Vida do Produto"
          value={`${kpiData.avgProductLifetime} dias`}
          subtitle="Da fabricação até a OS"
          icon={Calendar}
          variant="accent"
          onDetailClick={() => setIsModalOpen(true)}
        />
        <KPICard
          title="OSs em Garantia"
          value={`${kpiData.warrantyPercentage}%`}
          subtitle="Percentual do total"
          icon={Shield}
          variant="success"
          onDetailClick={() => setIsModalOpen(true)}
        />
      </div>

      {/* Charts Grid */}
      <div className="space-y-6 animate-scale-in">
        {/* Product and Defect Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductChart
            data={productRanking}
            onFilterClick={(value) => setFilters(prev => ({ ...prev, part: prev.part === value ? undefined : value }))}
            onDetailClick={() => setIsModalOpen(true)}
          />
          <DefectChart
            data={defectRanking}
            onFilterClick={(value) => setFilters(prev => ({ ...prev, defect: prev.defect === value ? undefined : value }))}
            onDetailClick={() => setIsModalOpen(true)}
          />
        </div>

        {/* Trends and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            data={monthlyTrends}
            onDetailClick={() => setIsModalOpen(true)}
          />
          <StatusChart
            data={statusDistribution}
            onFilterClick={(value) => setFilters(prev => ({ ...prev, status: prev.status === value ? '' : value }))}
            onDetailClick={() => setIsModalOpen(true)}
          />
        </div>

        {/* Geographic and Authorized Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CityChart
            data={cityDistribution}
            onFilterClick={(value) => setFilters(prev => ({ ...prev, city: prev.city === value ? undefined : value }))}
            onDetailClick={() => setIsModalOpen(true)}
          />
          <AuthorizedChart
            data={authorizedDistribution}
            onFilterClick={(value) => setFilters(prev => ({ ...prev, authorized: prev.authorized === value ? undefined : value }))}
            onDetailClick={() => setIsModalOpen(true)}
          />
        </div>

        {/* Service Time History */}
        <ServiceTimeChart
          data={serviceTimeTrends}
          onDetailClick={() => setIsModalOpen(true)}
        />

        {/* AI Insights */}
        <AIInsights
          kpiData={kpiData}
          productRanking={productRanking}
          defectRanking={defectRanking}
          statusDistribution={statusDistribution}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center pt-8 pb-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Dashboard atualizado em tempo real</span>
        </div>
      </div>

      <ServiceOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={filteredData}
      />
    </div>
  );
};

export default Dashboard;