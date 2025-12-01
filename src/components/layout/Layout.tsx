import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { DataImporter } from "../dashboard/DataImporter";

export default function Layout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <div className="h-4 w-px bg-border" />
                        <span className="font-semibold">Hercules Motores</span>
                    </div>
                    <DataImporter />
                </header>
                <main className="flex-1 overflow-auto">
                    {children || <Outlet />}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
