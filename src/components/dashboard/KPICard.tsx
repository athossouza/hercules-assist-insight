import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'secondary' | 'accent' | 'success';
  className?: string;
}

export const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'primary',
  className 
}: KPICardProps) => {
  const variantStyles = {
    primary: 'bg-gradient-primary text-primary-foreground',
    secondary: 'bg-gradient-secondary text-secondary-foreground',
    accent: 'bg-gradient-accent text-accent-foreground',
    success: 'bg-success text-success-foreground'
  };

  return (
    <Card className={cn(
      "kpi-card p-6 border-0 shadow-lg",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium opacity-90">
            {title}
          </p>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            {subtitle && (
              <p className="text-sm opacity-75">
                {subtitle}
              </p>
            )}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span className="mr-1">
                {trend.isPositive ? "↗" : "↘"}
              </span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="p-3 bg-white/20 rounded-lg">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};