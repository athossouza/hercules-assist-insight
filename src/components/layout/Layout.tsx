import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { DataImporter } from "../dashboard/DataImporter";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export default function Layout({ children }: { children?: React.ReactNode }) {
    const { loading, user } = useDashboardContext();
    const { signOut } = useAuth();
    const [progress, setProgress] = useState(0);

    // Simulate progress when loading
    useEffect(() => {
        if (loading) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress((prev) => {
                    // Slow down significantly as we approach 90%
                    if (prev >= 90) return prev;
                    const increment = Math.max(0.5, (90 - prev) / 20); // Decaying increment
                    return prev + increment;
                });
            }, 200);
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
                    <div className="flex items-center gap-4">
                        <DataImporter />

                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-muted">
                                        <User className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.name || 'Usuário'}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Sair</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

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
