import { ReactNode, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileBottomNav } from "@/components/admin/AdminMobileBottomNav";

interface AdminLayoutProps {
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-[#F8F5F0] overflow-hidden relative">
            {/* Sidebar - fixed on the left (Desktop Only) */}
            <div className="hidden md:block h-full shadow-xl z-20">
                <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden relative">

                {/* Scrollable Main Content */}
                <main className="flex-1 overflow-y-auto font-lato text-[#1E1E1E]">
                    {/* Top Bar Decoration for Mobile - Admin Badge if needed, currently handled in Page Header */}
                    <div className="p-4 md:p-8 pb-32 md:pb-8 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <AdminMobileBottomNav />
        </div>
    );
}
