import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function AdminMobileBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
        { icon: Users, label: "Partenaires", path: "/admin/partners" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#B79A63]/20 px-6 py-2 flex items-center justify-between z-50 shadow-2xl">
            {navItems.map((item) => (
                <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center gap-1 min-w-[64px] py-1"
                >
                    <item.icon
                        className={cn(
                            "w-6 h-6 transition-colors duration-200",
                            isActive(item.path) ? "text-[#B79A63]" : "text-[#D4D2CF]/60"
                        )}
                    />
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider transition-colors duration-200",
                        isActive(item.path) ? "text-[#B79A63]" : "text-[#D4D2CF]/40"
                    )}>
                        {item.label}
                    </span>
                </button>
            ))}

            <button
                onClick={() => signOut()}
                className="flex flex-col items-center gap-1 min-w-[64px] py-1 text-red-400/80"
            >
                <LogOut className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Logout</span>
            </button>
        </div>
    );
}
