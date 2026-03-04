import { LayoutDashboard, Users, ShieldAlert, LogOut, ChevronLeft, ChevronRight, FileText, MessageSquare, Bell } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Mes prestataires", href: "/admin/providers", icon: Users },
    { name: "Modération", href: "/admin/moderation", icon: ShieldAlert },
    { name: "Blog", href: "/admin/blog", icon: FileText },
    { name: "Messagerie & Newsletter", href: "/admin/messaging", icon: MessageSquare },
];

interface AdminSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { messages: unreadMessages, pendingModeration } = useNotifications();

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Erreur lors de la déconnexion");
        } else {
            navigate("/");
            toast.success("Déconnecté avec succès");
        }
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div className={cn(
                "flex h-full flex-col bg-[#1E1E1E] transition-all duration-300 relative border-r border-[#B79A63]/20",
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
                    "flex h-16 shrink-0 items-center transition-all duration-300 gap-2",
                    isCollapsed ? "justify-center px-0 flex-col" : "px-6"
                )}>
                    {isCollapsed ? (
                        <>
                            <span className="font-serif text-xl font-bold text-[#D4D2CF]">F.</span>
                            <span className="text-[9px] bg-[#B79A63] text-[#1E1E1E] px-1 rounded font-bold">ADM</span>
                        </>
                    ) : (
                        <>
                            <span className="font-serif text-2xl font-bold text-[#D4D2CF]">Far7i</span>
                            <span className="text-[10px] bg-[#B79A63] text-[#1E1E1E] px-2 py-0.5 rounded-full font-bold tracking-wider">ADMIN</span>
                        </>
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
                                        ? "bg-[#B79A63]/20 text-[#B79A63]"
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

                                {item.name === "Modération" && pendingModeration > 0 && (
                                    <Badge className={cn(
                                        "ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center font-bold text-[10px] rounded-full animate-pulse",
                                        isCollapsed ? "absolute top-0 right-0 scale-75" : ""
                                    )}>
                                        {pendingModeration}
                                    </Badge>
                                )}

                                {item.name === "Messagerie & Newsletter" && unreadMessages > 0 && (
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
                                    <TooltipContent side="right" className="bg-[#1E1E1E] border-[#B79A63]/20 text-[#D4D2CF] font-lato">
                                        {item.name}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return content;
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-[#B79A63]/20">
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
                            <TooltipContent side="right" className="bg-[#1E1E1E] border-[#B79A63]/20 text-[#D4D2CF] font-lato">
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
