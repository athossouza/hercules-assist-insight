import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DashboardFilters } from "@/types/dashboard";

interface FilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  filterOptions: {
    productFamilies: string[];
    statuses: string[];
    states: string[];
  };
}

export const FilterBar = ({ filters, onFiltersChange, filterOptions }: FilterBarProps) => {
  const hasActiveFilters = 
    filters.dateRange.start || 
    filters.dateRange.end || 
    filters.productFamily || 
    filters.status || 
    filters.state;

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { start: null, end: null },
      productFamily: '',
      status: '',
      state: ''
    });
  };

  return (
    <Card className="p-4 bg-gradient-surface border-border/50 shadow-sm">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.dateRange.start && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.start ? (
                    filters.dateRange.end ? (
                      <>
                        {format(filters.dateRange.start, "dd/MM/yy", { locale: ptBR })} -{" "}
                        {format(filters.dateRange.end, "dd/MM/yy", { locale: ptBR })}
                      </>
                    ) : (
                      format(filters.dateRange.start, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange.start || undefined}
                  selected={{
                    from: filters.dateRange.start || undefined,
                    to: filters.dateRange.end || undefined,
                  }}
                  onSelect={(range) => {
                    onFiltersChange({
                      ...filters,
                      dateRange: {
                        start: range?.from || null,
                        end: range?.to || null,
                      }
                    });
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Product Family Filter */}
          <Select
            value={filters.productFamily || undefined}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, productFamily: value || '' })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Família do Produto" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.productFamilies.map((family) => (
                <SelectItem key={family} value={family}>
                  {family}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status || undefined}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, status: value || '' })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* State Filter */}
          <Select
            value={filters.state || undefined}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, state: value || '' })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};