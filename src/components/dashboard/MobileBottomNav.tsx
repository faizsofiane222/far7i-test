import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    User,
    Briefcase,
    MessageSquare,
    MoreHorizontal,
    Settings,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface MobileBottomNavProps {
    serviceNotificationCount?: number;
}

export function MobileBottomNav({ serviceNotificationCount = 0 }: MobileBottomNavProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: "Home", path: "/partner/dashboard" },
        { icon: User, label: "Profil", path: "/partner/dashboard/profile" },
        { icon: Briefcase, label: "Services", path: "/partner/dashboard/services", count: serviceNotificationCount },
        { icon: MessageSquare, label: "Messages", path: "/partner/dashboard/messages" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#D4D2CF]/10 px-4 py-2 flex items-center justify-between z-50">
            {navItems.map((item) => (
                <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center gap-1 min-w-[64px] py-1 relative group"
                >
                    <div className="relative">
                        <item.icon
                            className={cn(
                                "w-6 h-6 transition-colors duration-200",
                                isActive(item.path) ? "text-[#B79A63]" : "text-white/60"
                            )}
                        />
                        {item.count && item.count > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1E1E1E]" />
                        )}
                    </div>
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider transition-colors duration-200",
                        isActive(item.path) ? "text-[#B79A63]" : "text-white/40"
                    )}>
                        {item.label}
                    </span>
                </button>
            ))}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex flex-col items-center gap-1 min-w-[64px] py-1">
                        <MoreHorizontal className="w-6 h-6 text-white/60" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Menu</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#1E1E1E] border-[#D4D2CF]/10 text-white shadow-2xl">
                    <DropdownMenuItem
                        onClick={() => navigate("/partner/dashboard/settings")}
                        className="flex items-center gap-3 py-3 focus:bg-white/5 cursor-pointer"
                    >
                        <Settings className="w-4 h-4 text-[#B79A63]" />
                        <span className="font-medium text-sm text-white/90">Paramètres</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={async () => {
                            await signOut();
                            navigate("/");
                        }}
                        className="flex items-center gap-3 py-3 focus:bg-white/5 cursor-pointer text-red-400 focus:text-red-400"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium text-sm">Déconnexion</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
