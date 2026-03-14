import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
    ShieldAlert, Users, Layers, MousePointerClick, 
    Loader2, Calendar, MapPin, TrendingUp,
    ArrowUpRight, Activity, Clock, CheckCircle2
} from "lucide-react";
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
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("7");

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                setLoading(true);

                // 1. Fetch KPIs
                const { data: kpiData, error: kpiError } = await (supabase as any).rpc('get_admin_kpis');
                if (kpiError) throw kpiError;
                setKpis(kpiData as AdminKPIs);

                // 2. Fetch Visitor Stats
                await fetchVisitors(dateRange);

                // 3. Fetch Recent Activity
                const { data: activity } = await supabase
                    .from('providers')
                    .select('id, commercial_name, updated_at, moderation_status')
                    .order('updated_at', { ascending: false })
                    .limit(5);
                setRecentActivity(activity || []);

            } catch (error: any) {
                console.error("Dashboard error:", error);
                toast.error("Échec du chargement des statistiques");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, dateRange]);

    const fetchVisitors = async (days: string) => {
        try {
            const endDate = new Date().toISOString();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));
            const startISO = startDate.toISOString();

            const { data: total } = await (supabase as any).rpc('get_visitor_stats', {
                p_start_date: startISO,
                p_end_date: endDate
            });
            if (total !== undefined) setVisitorCount(total as number || 0);

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
        } catch (e) {
            console.warn("Visitor stats RPC not available", e);
        }
    };

    if (loading && !kpis) {
        return (
            <AdminLayout>
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#B79A63]/20 border-t-[#B79A63] rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Activity className="w-6 h-6 text-[#B79A63]" />
                            </div>
                        </div>
                        <p className="font-serif italic text-[#1E1E1E]/40 animate-pulse">Chargement de votre univers...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const StatCard = ({ label, value, subLabel, icon: Icon, color, trend }: any) => (
        <div className="group relative overflow-hidden bg-white/70 backdrop-blur-xl p-8 rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(183,154,99,0.1)] hover:-translate-y-1">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("p-4 rounded-2xl bg-slate-50 text-slate-400 transition-colors duration-500 group-hover:bg-[#B79A63]/10 group-hover:text-[#B79A63]")}>
                    <Icon className="w-6 h-6 shrink-0" />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                        <ArrowUpRight className="w-4 h-4" /> {trend}
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <h3 className="text-4xl font-black text-[#1E1E1E] tracking-tight">{value}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E1E1E]/40 mb-1">{label}</p>
                <p className="text-xs font-medium text-[#1E1E1E]/60 italic">{subLabel}</p>
            </div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="space-y-12 animate-in fade-in duration-1000">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="h-px w-8 bg-[#B79A63]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B79A63]">Performance Hub</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-[#1E1E1E] tracking-tighter">
                            Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B79A63] to-[#A68952]">Admin</span>.
                        </h1>
                        <p className="text-lg text-[#1E1E1E]/40 font-medium">Voici l'état actuel de votre plateforme Far7i.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-white shadow-sm ring-1 ring-slate-100">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[200px] border-none bg-transparent font-black text-[10px] uppercase tracking-widest h-12 focus:ring-0">
                                <SelectValue placeholder="Période" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-100 rounded-2xl shadow-2xl">
                                <SelectItem value="1">Aujourd'hui</SelectItem>
                                <SelectItem value="7">7 derniers jours</SelectItem>
                                <SelectItem value="30">30 derniers jours</SelectItem>
                                <SelectItem value="365">Cette année</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard 
                        label="Moderation" 
                        value={kpis?.pending_services ?? 0} 
                        subLabel={`${kpis?.pending_providers ?? 0} dossiers en attente`} 
                        icon={ShieldAlert}
                        trend="+3% / jour"
                    />
                    <StatCard 
                        label="Partenaires" 
                        value={kpis?.total_providers ?? 0} 
                        subLabel="Professionnels inscrits" 
                        icon={Users}
                    />
                    <StatCard 
                        label="Prestations" 
                        value={kpis?.total_services ?? 0} 
                        subLabel="Services activés" 
                        icon={Layers}
                    />
                    <StatCard 
                        label="Audience" 
                        value={visitorCount} 
                        subLabel="Visiteurs uniques" 
                        icon={MousePointerClick}
                    />
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Charts Section */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[40px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-[#1E1E1E] tracking-tight">Trafic & Engagement</h2>
                                    <p className="text-xs text-[#1E1E1E]/30 font-bold uppercase tracking-widest">Évolution quotidienne</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><TrendingUp className="w-5 h-5" /></div>
                            </div>
                            
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={visitorEvolution}>
                                        <defs>
                                            <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#B79A63" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#B79A63" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                        <XAxis 
                                            dataKey="day" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#1E1E1E', fontSize: 10, fontWeight: 900 }} 
                                            dy={15}
                                        />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '24px', 
                                                border: 'none', 
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                                padding: '16px'
                                            }} 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="unique_visitors" 
                                            stroke="#B79A63" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorVis)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Wilaya Distribution */}
                        <div className="bg-[#1E1E1E] p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#B79A63]/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
                            
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-white tracking-tight">Expansion Territoriale</h2>
                                    <p className="text-[10px] text-[#B79A63] font-black uppercase tracking-[0.2em]">Top 10 des Wilayas</p>
                                </div>
                                <MapPin className="w-6 h-6 text-[#B79A63]" />
                            </div>

                            <div className="h-[300px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={kpis?.wilaya_distribution?.slice(0, 10) || []} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="wilaya" 
                                            type="category" 
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} 
                                            width={80}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '16px' }} />
                                        <Bar dataKey="count" fill="#B79A63" radius={[0, 8, 8, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Activity & Queue */}
                    <div className="space-y-12">
                        {/* Validation Queue Card */}
                        <div className="bg-gradient-to-br from-[#B79A63] to-[#8C734A] p-10 rounded-[40px] text-white shadow-2xl shadow-[#B79A63]/20">
                            <h3 className="text-xl font-black tracking-tight mb-6">File de Priorité</h3>
                            <div className="space-y-4">
                                <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl flex justify-between items-center transition-all hover:bg-white/20">
                                    <span className="text-xs font-bold text-white/80">Prestataires</span>
                                    <span className="text-3xl font-black">{kpis?.pending_providers ?? 0}</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl flex justify-between items-center transition-all hover:bg-white/20">
                                    <span className="text-xs font-bold text-white/80">Services</span>
                                    <span className="text-3xl font-black">{kpis?.pending_services ?? 0}</span>
                                </div>
                            </div>
                            <button className="w-full mt-8 py-4 bg-white text-[#B79A63] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95">
                                Lancer la Moderation
                            </button>
                        </div>

                        {/* Activity Feed */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1E1E1E]/40 px-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Activité Récente
                            </h3>
                            <div className="space-y-4">
                                {recentActivity.map((act, i) => (
                                    <div key={act.id} className="group p-5 bg-white rounded-3xl border border-slate-50 transition-all hover:border-[#B79A63]/20 hover:shadow-lg">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                act.moderation_status === 'approved' ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500"
                                            )}>
                                                {act.moderation_status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-[13px] font-black text-[#1E1E1E] leading-tight">{act.commercial_name}</p>
                                                <p className="text-[10px] font-medium text-[#1E1E1E]/40 italic">
                                                    {new Date(act.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recentActivity.length === 0 && (
                                    <p className="text-center py-10 text-slate-300 italic text-sm">Aucune activité récente.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
