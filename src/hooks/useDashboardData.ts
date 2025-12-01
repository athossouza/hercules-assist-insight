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
  DashboardFilters,
  ServiceTimeTrend
} from '@/types/dashboard';
import { useDashboardContext } from '@/contexts/DashboardContext';
import { differenceInDays, format, getWeek, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null;

  // Check if it's an Excel serial number (numeric string)
  // Excel dates are often integers (days since 1899-12-30)
  if (/^\d+(\.\d+)?$/.test(dateStr)) {
    const serial = parseFloat(dateStr);
    // Excel base date adjustment (25569 days offset from 1970-01-01)
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    // Return date object (ignoring time for simplicity in this context)
    return new Date(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate());
  }

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
  const { data, loading, error, importMetadata, importData } = useDashboardContext();

  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { start: null, end: null },
    productFamily: '',
    status: '',
    state: '',
    part: ''
  });

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

      // Part filter (interactive)
      if (filters.part) {
        const items = item.relatedItems || [item];
        const hasPart = items.some(subItem => {
          const partCode = subItem["Peças Trocadas"];
          const partDesc = subItem["Descrição Peça"];
          if (!partDesc) return false;
          const label = partCode ? `${partCode} - ${partDesc}` : partDesc;
          return label === filters.part;
        });
        if (!hasPart) return false;
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

      // Reseller filter (uses "Faturado Para" as requested)
      if (filters.reseller && item["Faturado Para"] !== filters.reseller) {
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

  // Calculate service time trends (Average Service Time History)
  const serviceTimeTrends: ServiceTimeTrend[] = useMemo(() => {
    const timeData: { [key: string]: { totalDays: number; count: number; date: Date } } = {};

    // Determine if we should use weekly or monthly granularity
    let isWeekly = false;
    if (filters.dateRange.start && filters.dateRange.end) {
      const daysDiff = differenceInDays(filters.dateRange.end, filters.dateRange.start);
      isWeekly = daysDiff <= 90; // Use weekly if range is 3 months or less
    }

    filteredData.forEach(item => {
      const openDate = parseDate(item["Data Abertura"]);
      const closeDate = parseDate(item["Data Fechamento"]);

      if (openDate && closeDate) {
        const days = calculateDaysDifference(openDate, closeDate);
        if (days >= 0) {
          let key = "";
          if (isWeekly) {
            // Weekly key: "YYYY-Www"
            const week = getWeek(openDate);
            const year = openDate.getFullYear();
            key = `${year}-W${String(week).padStart(2, '0')}`;
          } else {
            // Monthly key: "YYYY-MM"
            key = `${openDate.getFullYear()}-${String(openDate.getMonth() + 1).padStart(2, '0')}`;
          }

          if (!timeData[key]) {
            timeData[key] = { totalDays: 0, count: 0, date: openDate };
          }
          timeData[key].totalDays += days;
          timeData[key].count += 1;
        }
      }
    });

    return Object.entries(timeData)
      .map(([key, data]) => {
        let label = "";
        if (isWeekly) {
          // Format: "Semana X - Mês" or similar
          // To make it user friendly, let's use the start of the week date
          // But since we only have the key, let's use the stored sample date to format
          // Or better, just format the key.
          // Let's use the stored date to get the week label
          const weekStart = startOfWeek(data.date, { weekStartsOn: 0 });
          const weekEnd = endOfWeek(data.date, { weekStartsOn: 0 });
          // Example: "01/10 - 07/10"
          label = `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`;
        } else {
          // Format: "Mês/Ano"
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          label = format(date, 'MMM/yyyy', { locale: ptBR });
          // Capitalize first letter
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        return {
          period: label,
          avgTime: Math.round(data.totalDays / data.count),
          sortKey: key // Keep key for sorting
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ period, avgTime }) => ({ period, avgTime }));
  }, [filteredData, filters.dateRange]);

  // Calculate product ranking (Now Parts Ranking as per user request)
  const productRanking: ProductRanking[] = useMemo(() => {
    const productCounts: { [key: string]: number } = {};

    filteredData.forEach(item => {
      // Use relatedItems to get all parts if available, otherwise use the item itself
      const items = item.relatedItems || [item];

      items.forEach(subItem => {
        const partCode = subItem["Peças Trocadas"];
        const partDesc = subItem["Descrição Peça"];

        if (partDesc && partDesc.trim() !== '') {
          // Format: "Code - Description" or just "Description" if code is missing
          const label = partCode ? `${partCode} - ${partDesc}` : partDesc;
          productCounts[label] = (productCounts[label] || 0) + 1;
        }
      });
    });

    const ranking = Object.entries(productCounts)
      .map(([produto, quantidade]) => ({ produto, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    // If a part filter is active, only show that part in the ranking
    if (filters.part) {
      return ranking.filter(item => {
        // Check if the item matches the filter (Code - Description)
        // The item.produto here IS the label constructed above
        return item.produto === filters.part;
      });
    }

    return ranking;
  }, [filteredData, filters.part]);

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
    // Helper to filter by date range
    const filterByDate = (item: ServiceOrder) => {
      if (!filters.dateRange.start && !filters.dateRange.end) return true;
      const itemDate = parseDate(item["Data Abertura"]);
      if (!itemDate) return false;
      if (filters.dateRange.start && itemDate < filters.dateRange.start) return false;
      if (filters.dateRange.end && itemDate > filters.dateRange.end) return false;
      return true;
    };

    const productFamilies = [...new Set(data.map(item => item["Família Prod"]).filter(Boolean))];
    const statuses = [...new Set(data.map(item => item.Status).filter(Boolean))];
    const states = [...new Set([
      ...data.map(item => item["UF Posto"]).filter(Boolean),
      ...data.map(item => item["UF Cons"]).filter(Boolean)
    ])];
    const customers = [...new Set(data.map(item => item["Consumidor"]).filter(Boolean))];

    // Resellers should be filtered by the selected date range
    const resellers = [...new Set(
      data
        .filter(filterByDate)
        .map(item => item["Faturado Para"])
        .filter(Boolean)
    )];

    return {
      productFamilies: productFamilies.sort(),
      statuses: statuses.sort(),
      states: states.sort(),
      customers: customers.sort(),
      resellers: resellers.sort()
    };
  }, [data, filters.dateRange]);

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
    serviceTimeTrends,
    statusDistribution,
    cityDistribution,
    authorizedDistribution,
    filterOptions,
    importMetadata,
    importData
  };
};