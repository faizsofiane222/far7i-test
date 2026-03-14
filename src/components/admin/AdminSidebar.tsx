import { 
    LayoutDashboard, Users, ShieldAlert, LogOut, 
    ChevronLeft, ChevronRight, FileText, MessageSquare, 
    Settings, Bell, Search, Info
} from "lucide-react";
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
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, description: "Vue d'ensemble et KPIs" },
    { name: "Partenaires", href: "/admin/partners", icon: Users, description: "Gestion et Modération" },
    { name: "Contenu Blog", href: "/admin/blog", icon: FileText, description: "Articles et Actualités" },
    { name: "Messagerie", href: "/admin/messaging", icon: MessageSquare, description: "Support et Newsletter" },
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
            <aside className={cn(
                "flex h-full flex-col bg-[#1A1A1A] transition-all duration-500 ease-in-out relative border-r border-white/5 shadow-2xl",
                isCollapsed ? "w-24" : "w-72"
            )}>
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#B79A63]/5 to-transparent pointer-events-none" />

                {/* Logo Section */}
                <div className={cn(
                    "flex h-24 shrink-0 items-center justify-between transition-all duration-300",
                    isCollapsed ? "px-6" : "px-8"
                )}>
                    {!isCollapsed ? (
                        <div className="flex flex-col">
                            <span className="font-serif text-2xl font-black text-white tracking-tight">
                                Far<span className="text-[#B79A63]">7</span>i
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B79A63] opacity-80">
                                Administration
                            </span>
                        </div>
                    ) : (
                        <span className="font-serif text-3xl font-black text-[#B79A63] mx-auto">7</span>
                    )}
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {!isCollapsed && (
                        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">
                            Menu Principal
                        </p>
                    )}
                    
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        
                        const content = (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "group relative flex items-center gap-4 py-4 px-4 rounded-2xl transition-all duration-300 transform active:scale-95",
                                    isActive
                                        ? "bg-gradient-to-r from-[#B79A63] to-[#A68952] text-white shadow-lg shadow-[#B79A63]/20"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon className={cn(
                                    "h-6 w-6 shrink-0 transition-all duration-300",
                                    isActive ? "scale-110" : "group-hover:scale-110"
                                )} />
                                
                                {!isCollapsed && (
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                        <span className={cn(
                                            "text-[10px] font-medium truncate opacity-60",
                                            isActive ? "text-white" : "group-hover:text-white/80"
                                        )}>
                                            {item.description}
                                        </span>
                                    </div>
                                )}

                                {item.name === "Partenaires" && pendingModeration > 0 && (
                                    <div className={cn(
                                        "h-6 min-w-[24px] px-1.5 flex items-center justify-center font-black text-[10px] rounded-full shadow-lg ring-2 ring-[#1A1A1A]",
                                        isActive ? "bg-white text-[#B79A63]" : "bg-orange-500 text-white animate-pulse"
                                    )}>
                                        {pendingModeration}
                                    </div>
                                )}

                                {item.name === "Messagerie" && unreadMessages > 0 && (
                                    <div className={cn(
                                        "h-6 min-w-[24px] px-1.5 flex items-center justify-center font-black text-[10px] rounded-full shadow-lg ring-2 ring-[#1A1A1A]",
                                        isActive ? "bg-white text-[#B79A63]" : "bg-[#B79A63] text-white"
                                    )}>
                                        {unreadMessages}
                                    </div>
                                )}
                                
                                {isActive && (
                                    <div className="absolute -left-4 w-1.5 h-8 bg-white rounded-full" />
                                )}
                            </Link>
                        );

                        if (isCollapsed) {
                            return (
                                <Tooltip key={item.name}>
                                    <TooltipTrigger asChild>
                                        {content}
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-[#1A1A1A] border-white/10 text-white px-4 py-2 font-bold shadow-2xl">
                                        {item.name}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return content;
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <button
                        onClick={onToggle}
                        className="w-full h-12 flex items-center justify-center gap-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-95 group mb-2"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
                            <>
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Réduire</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleSignOut}
                        className={cn(
                            "group flex items-center gap-4 w-full py-4 px-4 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-95",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <LogOut className="h-6 w-6 shrink-0 transition-transform group-hover:-translate-x-1" />
                        {!isCollapsed && <span className="font-bold text-sm">Déconnexion</span>}
                    </button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
