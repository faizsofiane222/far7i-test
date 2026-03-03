import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Users, Layers, MousePointerClick, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStats {
    total_providers: number;
    pending_validations: number;
    total_services: number;
    total_leads_generated: number;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Call the secure RPC function
                const { data, error } = await supabase.rpc('get_admin_platform_stats');

                if (error) throw error;
                if (data) setStats(data as AdminStats);

            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchStats();
    }, [user]);

    const statCards = [
        {
            label: "En Attente de Validation",
            value: stats?.pending_validations ?? 0,
            icon: ShieldAlert,
            highlight: (stats?.pending_validations ?? 0) > 0, // Urgency if any pending
            primary: true // Main card
        },
        {
            label: "Prestataires Inscrits",
            value: stats?.total_providers ?? 0,
            icon: Users,
            highlight: false,
            primary: false
        },
        {
            label: "Offres en Ligne",
            value: stats?.total_services ?? 0,
            icon: Layers,
            highlight: false,
            primary: false
        },
        {
            label: "Leads Générés (Global)",
            value: stats?.total_leads_generated ?? 0,
            icon: MousePointerClick,
            highlight: false,
            primary: false
        }
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex bg-[#F8F5F0] h-[80vh] items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#B79A63]" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E]">
                        Bienvenue, Administrateur.
                    </h1>
                    <p className="text-[#1E1E1E]/60 text-sm md:text-base font-lato">
                        Vue d'ensemble de l'activité et de la santé de la plateforme Far7i.
                    </p>
                </div>

                {/* KPI Section - Responsive: Carousel on Mobile, Grid on Desktop */}
                <div className="relative w-screen -mx-4 px-4 md:w-full md:mx-0 md:px-0 overflow-x-auto md:overflow-visible hide-scrollbar pb-4 md:pb-0">
                    <div className="flex md:grid md:grid-cols-4 gap-4 w-max md:w-full">
                        {statCards.map((stat, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-[85vw] md:w-auto h-40 md:h-48 shrink-0 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 snap-center border",
                                    stat.primary && stat.highlight
                                        ? "bg-[#1E1E1E] border-[#B79A63] shadow-xl shadow-[#B79A63]/20" // Focused Pending Card
                                        : "bg-white border-[#D4D2CF]/50 shadow-sm hover:border-[#B79A63]/50"
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        stat.primary && stat.highlight ? "bg-[#B79A63]/20 text-[#B79A63]" : "bg-[#F8F5F0] text-[#1E1E1E]/40"
                                    )}>
                                        <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    {stat.highlight && (
                                        <span className="flex h-2 w-2 rounded-full bg-[#B79A63] animate-pulse" />
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className={cn(
                                        "font-playfair text-3xl md:text-4xl font-bold",
                                        stat.primary && stat.highlight ? "text-white" : "text-[#1E1E1E]"
                                    )}>
                                        {stat.value}
                                    </h3>
                                    <p className={cn(
                                        "text-xs md:text-sm font-bold uppercase tracking-wider",
                                        stat.primary && stat.highlight ? "text-[#B79A63]" : "text-[#1E1E1E]/40"
                                    )}>
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Charts Placeholder for V2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 opacity-50 grayscale pointer-events-none select-none">
                    <div className="aspect-video bg-white rounded-2xl border border-[#D4D2CF]/50 flex items-center justify-center p-8">
                        <p className="font-serif italic text-[#1E1E1E]/40">Graphiques d'acquisition (Coming Soon)</p>
                    </div>
                    <div className="aspect-video bg-white rounded-2xl border border-[#D4D2CF]/50 flex items-center justify-center p-8">
                        <p className="font-serif italic text-[#1E1E1E]/40">Répartition géographique (Coming Soon)</p>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
