import { useState, useEffect, useMemo } from 'react';
import {
  ServiceOrder,
  KPIData,
  ProductRanking,
  DefectRanking,
  MonthlyTrend,
  StatusDistribution,
  CityDistribution,
  AuthorizedDistribution,
  DashboardFilters
} from '@/types/dashboard';

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null;

  // Handle format: "05/05/2025  16:59:43"
  const cleanDateStr = dateStr.split('  ')[0]; // Remove time part
  const [day, month, year] = cleanDateStr.split('/');

  if (!day || !month || !year) return null;

  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

const calculateDaysDifference = (startDate: Date | null, endDate: Date | null): number => {
  if (!startDate || !endDate) return 0;
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const useDashboardData = () => {
  const [data, setData] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { start: null, end: null },
    productFamily: '',
    status: '',
    state: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/ATwebReport.csv');
        const csvText = await response.text();

        // Parse CSV
        const lines = csvText.split('\n');
        const headers = lines[0].split(';').map(header => header.replace('﻿', '').trim());

        const parsedData: ServiceOrder[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(';');
          const row: any = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          parsedData.push(row as ServiceOrder);
        }

        // Deduplicate data based on "Número OS" (or "OS")
        // We aggregate all items into the 'relatedItems' property of the main entry
        const uniqueMap = new Map<string, ServiceOrder>();
        const itemsMap = new Map<string, ServiceOrder[]>();

        parsedData.forEach(item => {
          const id = item["Número OS"] || item["OS"];
          if (id) {
            // Store all items for this ID
            if (!itemsMap.has(id)) {
              itemsMap.set(id, []);
            }
            itemsMap.get(id)?.push(item);

            // Keep the last item as the main one (for status, dates, etc.)
            uniqueMap.set(id, item);
          }
        });

        // Attach related items to the main object
        const uniqueData = Array.from(uniqueMap.values()).map(item => {
          const id = item["Número OS"] || item["OS"];
          return {
            ...item,
            relatedItems: itemsMap.get(id) || [item]
          };
        });

        setData(uniqueData);
      } catch (err) {
        setError('Erro ao carregar dados: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Date filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const itemDate = parseDate(item["Data Abertura"]);
        if (!itemDate) return false;

        if (filters.dateRange.start && itemDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && itemDate > filters.dateRange.end) return false;
      }

      // Product family filter
      if (filters.productFamily && item["Família Prod"] !== filters.productFamily) {
        return false;
      }

      // Status filter
      if (filters.status && item.Status !== filters.status) {
        return false;
      }

      // State filter
      if (filters.state && item["UF Posto"] !== filters.state && item["UF Cons"] !== filters.state) {
        return false;
      }

      // Product filter (interactive)
      if (filters.product && item["Desc Produto"] !== filters.product) {
        return false;
      }

      // Defect filter (interactive)
      if (filters.defect && item["Defeito Constatado"] !== filters.defect) {
        return false;
      }

      // City filter (interactive)
      if (filters.city && item["Cidade Posto"] !== filters.city) {
        return false;
      }

      // Authorized filter (interactive)
      if (filters.authorized && item["Razão Social Posto"] !== filters.authorized) {
        return false;
      }

      // Customer filter
      if (filters.customer && item["Consumidor"] !== filters.customer) {
        return false;
      }

      // Reseller filter
      if (filters.reseller && item["Revendedor"] !== filters.reseller) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  // Calculate KPIs
  const kpiData: KPIData = useMemo(() => {
    const totalOrders = filteredData.length;

    // Calculate average service time for ALL filtered orders (not just warranty)
    // This ensures the KPI reflects the current filters (e.g., specific customer, product, etc.)
    let totalServiceDays = 0;
    let validServiceTimeCount = 0;

    filteredData.forEach(item => {
      const openDate = parseDate(item["Data Abertura"]);
      const closeDate = parseDate(item["Data Fechamento"]);

      if (openDate && closeDate) {
        const days = calculateDaysDifference(openDate, closeDate);
        // Ensure non-negative and reasonable values
        if (days >= 0) {
          totalServiceDays += days;
          validServiceTimeCount++;
        }
      }
    });

    const avgServiceTime = validServiceTimeCount > 0 ? totalServiceDays / validServiceTimeCount : 0;

    // Calculate average product lifetime
    let totalLifetimeDays = 0;
    let validLifetimeCount = 0;

    filteredData.forEach(item => {
      const fabricationDate = parseDate(item["Data Fabricação"]);
      const openDate = parseDate(item["Data Abertura"]);

      if (fabricationDate && openDate) {
        totalLifetimeDays += calculateDaysDifference(fabricationDate, openDate);
        validLifetimeCount++;
      }
    });

    const avgProductLifetime = validLifetimeCount > 0 ? totalLifetimeDays / validLifetimeCount : 0;

    // Calculate warranty percentage
    const warrantyCount = filteredData.filter(item => item.Finalidade === 'Garantia').length;
    const warrantyPercentage = totalOrders > 0 ? (warrantyCount / totalOrders) * 100 : 0;

    return {
      totalOrders,
      avgServiceTime: Math.round(avgServiceTime),
      avgProductLifetime: Math.round(avgProductLifetime),
      warrantyPercentage: Math.round(warrantyPercentage * 100) / 100
    };
  }, [filteredData]);

  // Calculate product ranking
  const productRanking: ProductRanking[] = useMemo(() => {
    const productCounts: { [key: string]: number } = {};

    filteredData.forEach(item => {
      const product = item["Desc Produto"];
      if (product) {
        productCounts[product] = (productCounts[product] || 0) + 1;
      }
    });

    return Object.entries(productCounts)
      .map(([produto, quantidade]) => ({ produto, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [filteredData]);

  // Calculate defect ranking
  const defectRanking: DefectRanking[] = useMemo(() => {
    const defectCounts: { [key: string]: number } = {};

    filteredData.forEach(item => {
      const defect = item["Defeito Constatado"];
      if (defect && defect.trim() !== '') {
        defectCounts[defect] = (defectCounts[defect] || 0) + 1;
      }
    });

    return Object.entries(defectCounts)
      .map(([defeito, quantidade]) => ({ defeito, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [filteredData]);

  // Calculate monthly trends
  const monthlyTrends: MonthlyTrend[] = useMemo(() => {
    const monthlyCounts: { [key: string]: number } = {};

    filteredData.forEach(item => {
      const date = parseDate(item["Data Abertura"]);
      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    });

    return Object.entries(monthlyCounts)
      .map(([month, quantidade]) => ({ month, quantidade }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredData]);

  // Calculate status distribution
  const statusDistribution: StatusDistribution[] = useMemo(() => {
    const statusCounts: { [key: string]: number } = {};

    filteredData.forEach(item => {
      const status = item.Status;
      if (status) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });

    const total = filteredData.length;

    return Object.entries(statusCounts)
      .map(([status, quantidade]) => ({
        status,
        quantidade,
        percentage: total > 0 ? Math.round((quantidade / total) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredData]);

  // Calculate city distribution
  const cityDistribution: CityDistribution[] = useMemo(() => {
    const cityCounts: { [key: string]: number } = {};

    filteredData.forEach(item => {
      const city = item["Cidade Posto"];
      if (city && city.trim() !== '') {
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    });

    return Object.entries(cityCounts)
      .map(([cidade, quantidade]) => ({ cidade, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredData]);

  // Calculate authorized distribution
  const authorizedDistribution: AuthorizedDistribution[] = useMemo(() => {
    const authorizedCounts: { [key: string]: number } = {};

    filteredData.forEach(item => {
      const authorized = item["Razão Social Posto"];
      if (authorized && authorized.trim() !== '') {
        authorizedCounts[authorized] = (authorizedCounts[authorized] || 0) + 1;
      }
    });

    return Object.entries(authorizedCounts)
      .map(([autorizada, quantidade]) => ({ autorizada, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredData]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const productFamilies = [...new Set(data.map(item => item["Família Prod"]).filter(Boolean))];
    const statuses = [...new Set(data.map(item => item.Status).filter(Boolean))];
    const states = [...new Set([
      ...data.map(item => item["UF Posto"]).filter(Boolean),
      ...data.map(item => item["UF Cons"]).filter(Boolean)
    ])];
    const customers = [...new Set(data.map(item => item["Consumidor"]).filter(Boolean))];
    const resellers = [...new Set(data.map(item => item["Revendedor"]).filter(Boolean))];

    return {
      productFamilies: productFamilies.sort(),
      statuses: statuses.sort(),
      states: states.sort(),
      customers: customers.sort(),
      resellers: resellers.sort()
    };
  }, [data]);

  return {
    data: filteredData,
    loading,
    error,
    filters,
    setFilters,
    kpiData,
    productRanking,
    defectRanking,
    monthlyTrends,
    statusDistribution,
    cityDistribution,
    authorizedDistribution,
    filterOptions
  };
};