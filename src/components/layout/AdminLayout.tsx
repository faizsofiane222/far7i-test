import { ReactNode, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileBottomNav } from "@/components/admin/AdminMobileBottomNav";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-[#FDFCFB] overflow-hidden relative font-lato">
            {/* Sidebar - Desktop Only */}
            <div className="hidden md:block h-full z-30">
                <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B79A63]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
                
                <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                    <div className="p-6 md:p-12 pb-32 md:pb-12 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <AdminMobileBottomNav />
        </div>
    );
}
