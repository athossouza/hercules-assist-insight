import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  onDetailClick?: () => void;
  headerActions?: ReactNode;
}

export const ChartCard = ({
  title,
  description,
  children,
  className,
  onDetailClick,
  headerActions
}: ChartCardProps) => {
  return (
    <Card className={cn(
      "chart-container bg-gradient-surface border-border/50 shadow-md hover:shadow-lg transition-all duration-300",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 relative z-10">
            {onDetailClick && (
              <Button variant="ghost" size="icon" onClick={onDetailClick} title="Detalhar">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            {headerActions}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};