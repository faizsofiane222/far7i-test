import { LayoutDashboard, User, Briefcase, Settings, ChevronLeft, ChevronRight, LogOut, MessageSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const navigation = [
    { name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
    { name: "Mon Profil", href: "/partner/dashboard/profile", icon: User },
    { name: "Mes Prestations", href: "/partner/dashboard/services", icon: Briefcase },
    { name: "Ma Messagerie", href: "/partner/dashboard/messages", icon: MessageSquare },
    { name: "Paramètres", href: "/partner/dashboard/settings", icon: Settings },
];

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    serviceNotificationCount?: number;
}

export function Sidebar({ isCollapsed, onToggle, serviceNotificationCount = 0 }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { messages: unreadMessages } = useNotifications();
    const { signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
        toast.success("Déconnecté avec succès");
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div className={cn(
                "flex h-full flex-col bg-[#1E1E1E] transition-all duration-300 relative border-r border-white/5",
                isCollapsed ? "w-20" : "w-64"
            )}>
                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-20 bg-[#B79A63] text-white p-1 rounded-full shadow-lg border-2 border-[#1E1E1E] hover:bg-[#A68952] transition-colors z-50"
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>

                <div className={cn(
                    "flex h-16 shrink-0 items-center transition-all duration-300",
                    isCollapsed ? "justify-center px-0" : "px-6"
                )}>
                    {isCollapsed ? (
                        <span className="font-serif text-xl font-bold text-[#B79A63]">F.</span>
                    ) : (
                        <span className="font-serif text-2xl font-bold text-[#B79A63]">Far7i</span>
                    )}
                </div>

                <nav className="flex flex-1 flex-col px-3 py-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const content = (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "group flex items-center py-2 text-sm font-medium rounded-xl transition-all duration-200",
                                    isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "px-3",
                                    isActive
                                        ? "bg-[#B79A63]/10 text-[#B79A63]"
                                        : "text-[#D4D2CF] hover:text-[#B79A63] hover:bg-white/5"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 shrink-0 transition-colors duration-200",
                                        isCollapsed ? "" : "mr-3",
                                        isActive ? "text-[#B79A63]" : "text-[#D4D2CF] group-hover:text-[#B79A63]"
                                    )}
                                    aria-hidden="true"
                                />
                                {!isCollapsed && <span className="font-lato flex-1">{item.name}</span>}

                                {item.name === "Ma Messagerie" && unreadMessages > 0 && (
                                    <Badge variant="secondary" className={cn(
                                        "ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center font-bold text-[10px] rounded-full bg-[#B79A63] text-black",
                                        isCollapsed ? "absolute top-0 right-0 scale-75" : ""
                                    )}>
                                        {unreadMessages}
                                    </Badge>
                                )}


                            </Link>
                        );

                        if (isCollapsed) {
                            return (
                                <Tooltip key={item.name}>
                                    <TooltipTrigger asChild>
                                        {content}
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-[#1E1E1E] border-white/10 text-white font-lato">
                                        {item.name}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return content;
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-white/5">
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleSignOut}
                                    className="w-12 h-12 mx-auto flex items-center justify-center rounded-xl text-[#D4D2CF] hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-[#1E1E1E] border-white/10 text-white font-lato">
                                Déconnexion
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center px-3 py-2 text-sm font-medium text-[#D4D2CF] rounded-xl hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            <span className="font-lato">Déconnexion</span>
                        </button>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
