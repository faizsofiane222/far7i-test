import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    FileText,
    MessageSquare,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function AdminMobileBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: "Stats", path: "/admin/dashboard" },
        { icon: Users, label: "Parts", path: "/admin/partners" },
        { icon: FileText, label: "Blog", path: "/admin/blog" },
        { icon: MessageSquare, label: "Chat", path: "/admin/messaging" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-6 left-4 right-4 h-20 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/5 rounded-[32px] px-4 flex items-center justify-between z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => (
                <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center gap-1.5 flex-1 relative"
                >
                    <item.icon
                        className={cn(
                            "w-6 h-6 transition-all duration-300 transform active:scale-75",
                            isActive(item.path) ? "text-[#B79A63] scale-110" : "text-white/40"
                        )}
                    />
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                        isActive(item.path) ? "text-white" : "text-white/20"
                    )}>
                        {item.label}
                    </span>
                    {isActive(item.path) && (
                        <div className="absolute -top-3 w-1.5 h-1.5 bg-[#B79A63] rounded-full animate-pulse shadow-[0_0_10px_#B79A63]" />
                    )}
                </button>
            ))}

            <button
                onClick={() => signOut()}
                className="flex flex-col items-center gap-1.5 flex-1 text-red-500/60 active:scale-75 transition-all"
            >
                <LogOut className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Out</span>
            </button>
        </div>
    );
}
