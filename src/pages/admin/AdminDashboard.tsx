import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Users, Layers, MousePointerClick, Loader2, Calendar, MapPin, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area,
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AdminKPIs {
    total_providers: number;
    total_services: number;
    pending_providers: number;
    pending_services: number;
    wilaya_distribution: { wilaya: string; count: number }[];
}

interface VisitorPoint {
    day: string;
    unique_visitors: number;
    page_views: number;
}

const formatDay = (day: string) => {
    const d = new Date(day);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export default function AdminDashboard() {
    const { user } = useAuth();
    const [kpis, setKpis] = useState<AdminKPIs | null>(null);
    const [visitorCount, setVisitorCount] = useState<number>(0);
    const [visitorEvolution, setVisitorEvolution] = useState<VisitorPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("7"); // Days

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                setLoading(true);

                // 1. Fetch KPIs
                const { data: kpiData, error: kpiError } = await (supabase as any).rpc('get_admin_kpis');
                if (kpiError) throw kpiError;
                setKpis(kpiData as AdminKPIs);

                // 2. Fetch Visitor Stats + Evolution
                await fetchVisitors(dateRange);

            } catch (error: any) {
                console.error("Dashboard error:", error);
                toast.error("Échec du chargement des statistiques : " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, dateRange]);

    const fetchVisitors = async (days: string) => {
        const endDate = new Date().toISOString();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const startISO = startDate.toISOString();

        // Total unique visitors
        const { data: total } = await (supabase as any).rpc('get_visitor_stats', {
            p_start_date: startISO,
            p_end_date: endDate
        });
        if (total !== undefined) setVisitorCount(total as number || 0);

        // Time series for chart
        const { data: evolution } = await (supabase as any).rpc('get_visitor_evolution', {
            p_start_date: startISO,
            p_end_date: endDate
        });
        if (evolution) {
            setVisitorEvolution((evolution as any[]).map(row => ({
                day: formatDay(row.day),
                unique_visitors: Number(row.unique_visitors),
                page_views: Number(row.page_views)
            })));
        }
    };

    const statCards = [
        {
            label: "Validations en attente",
            value: kpis?.pending_services ?? 0,
            subLabel: `${kpis?.pending_providers ?? 0} prestataires à valider`,
            icon: ShieldAlert,
            highlight: (kpis?.pending_services ?? 0) > 0,
            primary: true,
            color: "text-amber-600",
            bgColor: "bg-amber-50"
        },
        {
            label: "Prestataires Inscrits",
            value: kpis?.total_providers ?? 0,
            subLabel: "Total des partenaires",
            icon: Users,
            highlight: false,
            primary: false,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            label: "Prestations en Ligne",
            value: kpis?.total_services ?? 0,
            subLabel: "Total des offres",
            icon: Layers,
            highlight: false,
            primary: false,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50"
        },
        {
            label: "Visiteurs Uniques",
            value: visitorCount,
            subLabel: `Derniers ${dateRange} jour${parseInt(dateRange) > 1 ? 's' : ''}`,
            icon: MousePointerClick,
            highlight: false,
            primary: false,
            color: "text-[#B79A63]",
            bgColor: "bg-[#F8F5F0]"
        }
    ];

    if (loading && !kpis) {
        return (
            <AdminLayout>
                <div className="flex bg-[#FDFCFB] h-[80vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#B79A63]" />
                        <p className="font-serif italic text-[#1E1E1E]/40">Initialisation du Dashboard...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-[#D4D2CF]/50 shadow-sm">
                    <div className="space-y-1">
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E]">
                            Tableau de Bord Admin
                        </h1>
                        <p className="text-[#1E1E1E]/60 text-sm md:text-base font-lato">
                            Analyse de la croissance et suivi de l'activité de Far7i.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-[#F8F5F0] p-1.5 rounded-2xl border border-[#D4D2CF]/30">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#1E1E1E]/40 ml-3 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Période
                        </span>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[180px] border-none bg-transparent font-bold text-xs h-9">
                                <SelectValue placeholder="Choisir une période" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#D4D2CF]">
                                <SelectItem value="1">Aujourd'hui</SelectItem>
                                <SelectItem value="7">7 derniers jours</SelectItem>
                                <SelectItem value="30">30 derniers jours</SelectItem>
                                <SelectItem value="365">Cette année</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "relative overflow-hidden group rounded-3xl p-6 transition-all duration-300 border bg-white border-[#D4D2CF]/50 hover:border-[#B79A63]/50 hover:shadow-xl hover:shadow-[#1E1E1E]/5 hover:-translate-y-1",
                                stat.primary && stat.highlight && "ring-2 ring-amber-500/20 bg-amber-50/10"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-2xl", stat.bgColor, stat.color)}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                {stat.highlight && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                                        Action Requise
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-playfair text-4xl font-black text-[#1E1E1E]">
                                    {stat.value}
                                </h3>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]">
                                        {stat.label}
                                    </p>
                                    <p className="text-[10px] font-medium text-[#1E1E1E]/40 italic">
                                        {stat.subLabel}
                                    </p>
                                </div>
                            </div>

                            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                                <stat.icon className="w-32 h-32" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Visitor Evolution Chart */}
                <div className="bg-white p-8 rounded-3xl border border-[#D4D2CF]/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-[#F8F5F0] text-[#B79A63] rounded-xl">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-serif text-xl font-bold text-[#1E1E1E]">Évolution du Trafic</h2>
                            <p className="text-xs text-[#1E1E1E]/40">Visiteurs uniques par jour</p>
                        </div>
                        {visitorEvolution.length === 0 && (
                            <span className="ml-auto text-xs text-slate-400 italic">Aucune donnée sur cette période</span>
                        )}
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visitorEvolution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#B79A63" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#B79A63" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradPageviews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1E1E1E" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#1E1E1E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="day" tick={{ fill: '#1E1E1E', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#1E1E1E', fontSize: 11 }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.12)',
                                        fontSize: '12px'
                                    }}
                                    formatter={(value: any, name: string) => [
                                        value,
                                        name === 'unique_visitors' ? 'Visiteurs uniques' : 'Pages vues'
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="page_views"
                                    stroke="#1E1E1E"
                                    strokeWidth={1.5}
                                    fill="url(#gradPageviews)"
                                    strokeDasharray="4 2"
                                    dot={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="unique_visitors"
                                    stroke="#B79A63"
                                    strokeWidth={2.5}
                                    fill="url(#gradVisitors)"
                                    dot={{ fill: '#B79A63', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-6 mt-4 justify-end">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-4 h-0.5 bg-[#B79A63] rounded" />
                            <span>Visiteurs uniques</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-4 h-0.5 bg-[#1E1E1E] rounded opacity-40" style={{ borderTop: '1px dashed' }} />
                            <span>Pages vues</span>
                        </div>
                    </div>
                </div>

                {/* Secondary Charts & Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Wilaya Distribution Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-[#D4D2CF]/50 shadow-sm flex flex-col space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <h2 className="font-serif text-xl font-bold text-[#1E1E1E]">Couverture par Wilaya</h2>
                            </div>
                            <span className="text-[10px] font-bold text-[#1E1E1E]/40 uppercase tracking-widest">
                                Basé sur {kpis?.total_services} prestations
                            </span>
                        </div>

                        {(kpis?.wilaya_distribution?.length ?? 0) === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-slate-300 italic text-sm py-16">
                                Aucune prestation géolocalisée
                            </div>
                        ) : (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={kpis?.wilaya_distribution || []}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="wilaya"
                                            type="category"
                                            tick={{ fill: '#1E1E1E', fontSize: 10, fontWeight: 600 }}
                                            width={80}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                            {(kpis?.wilaya_distribution || []).map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={index % 2 === 0 ? '#B79A63' : '#1E1E1E'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Health Score */}
                    <div className="bg-[#1E1E1E] text-white p-8 rounded-3xl shadow-2xl shadow-[#1E1E1E]/20 flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#B79A63]/20 text-[#B79A63] rounded-xl">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <h2 className="font-serif text-xl font-bold">File de Validation</h2>
                            </div>

                            <div className="space-y-8 py-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                                        <span>Prestataires Approuvés</span>
                                        <span className="text-[#B79A63]">
                                            {Math.round(((kpis?.total_services || 1) - (kpis?.pending_services || 0)) / (kpis?.total_services || 1) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#B79A63] transition-all duration-1000 ease-out"
                                            style={{ width: `${((kpis?.total_services || 1) - (kpis?.pending_services || 0)) / (kpis?.total_services || 1) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B79A63]">En attente de validation</h4>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                            <span className="text-sm text-white/60">Prestataires</span>
                                            <span className="text-2xl font-black text-[#B79A63]">{kpis?.pending_providers ?? 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                            <span className="text-sm text-white/60">Fiches totales</span>
                                            <span className="text-2xl font-black text-white">{kpis?.pending_services ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Aesthetic background shapes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B79A63]/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
