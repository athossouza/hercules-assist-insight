import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { DataImporter } from "../dashboard/DataImporter";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export default function Layout({ children }: { children?: React.ReactNode }) {
    const { loading } = useDashboardContext();
    const [progress, setProgress] = useState(0);

    // Simulate progress when loading
    useEffect(() => {
        if (loading) {
            setProgress(10);
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 10;
                });
            }, 500);
            return () => clearInterval(interval);
        } else {
            setProgress(100);
            const timeout = setTimeout(() => setProgress(0), 500);
            return () => clearTimeout(timeout);
        }
    }, [loading]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between relative overflow-hidden">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <div className="h-4 w-px bg-border" />
                        <span className="font-semibold">Hercules Motores</span>
                    </div>
                    <DataImporter />

                    {/* Global Progress Bar */}
                    {loading && (
                        <div className="absolute bottom-0 left-0 w-full h-1">
                            <Progress value={progress} className="h-1 w-full rounded-none bg-transparent" indicatorClassName="bg-primary transition-all duration-500" />
                        </div>
                    )}
                </header>
                <main className="flex-1 overflow-auto">
                    {children || <Outlet />}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
