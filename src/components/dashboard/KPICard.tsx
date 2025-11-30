import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success';
  className?: string;
  onDetailClick?: () => void;
}

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'primary',
  className,
  onDetailClick
}: KPICardProps) => {
  const variants = {
    default: 'bg-muted',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    success: 'bg-success'
  };

  const iconVariants = {
    default: 'text-muted-foreground',
    primary: 'text-primary-foreground',
    secondary: 'text-secondary-foreground',
    accent: 'text-accent-foreground',
    success: 'text-success-foreground'
  };

  return (
    <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {onDetailClick && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDetailClick} title="Detalhar">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <div className={cn("p-2 rounded-full bg-opacity-10", variants[variant])}>
            <Icon className={cn("h-4 w-4", iconVariants[variant])} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center text-xs font-medium mt-2",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            <span className="mr-1">
              {trend.isPositive ? "↗" : "↘"}
            </span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
};