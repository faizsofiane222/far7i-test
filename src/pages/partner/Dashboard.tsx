import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    Loader2,
    TrendingUp,
    Star,
    ArrowUpRight,
    MessageCircle,
    Eye,
    Filter,
} from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MOCK_PERIODS = [
    { id: 'all_time', title: 'Toute la période' },
    { id: 'current_month', title: 'Mois en cours' },
    { id: 'last_month', title: 'Mois précédent' },
    { id: 'last_3_months', title: '3 derniers mois' },
    { id: 'last_6_months', title: '6 derniers mois' },
];

const getConversionQuality = (views: number, leads: number) => {
    if (views === 0) return { label: "À améliorer", color: "text-orange-500", bg: "bg-[#D4D2CF]/10", rate: "0" };
    const rate = (leads / views) * 100;
    if (rate >= 15) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50/50", rate: rate.toFixed(1) };
    if (rate >= 8) return { label: "Bon", color: "text-blue-600", bg: "bg-blue-50/50", rate: rate.toFixed(1) };
    return { label: "À améliorer", color: "text-orange-500", bg: "bg-orange-50/50", rate: rate.toFixed(1) };
};

export default function PartnerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const [selectedPeriod, setSelectedPeriod] = useState(MOCK_PERIODS[0].id);
    const [selectedService, setSelectedService] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchFiltersData = async () => {
            if (!user) return;
            try {
                const { data: services, error: sError } = await supabase
                    .from('providers')
                    .select('id, commercial_name, category_slug')
                    .eq('user_id', user.id);

                if (sError) throw sError;
                setAvailableServices(services || []);

                if (services && services.length > 0) {
                    const slugs = [...new Set(services.map(s => s.category_slug).filter(Boolean))];
                    const { data: cats, error: cError } = await supabase
                        .from('service_categories')
                        .select('slug, label')
                        .in('slug', slugs);

                    if (cError) throw cError;
                    setAvailableCategories(cats || []);
                }
            } catch (err) {
                console.error("Erreur filtres:", err);
            }
        };
        fetchFiltersData();
    }, [user]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const rpcParams: any = { p_user_id: user.id };
                if (selectedService !== "all") rpcParams.p_provider_id = selectedService;
                if (selectedCategory !== "all") rpcParams.p_category_slug = selectedCategory;

                const { data, error } = await supabase.rpc('get_provider_dashboard_stats', rpcParams);
                if (error) throw error;
                if (data && !(data as any).error) setStats(data);
            } catch (err) {
                console.error("Erreur stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user, selectedPeriod, selectedService, selectedCategory]);

    const totalConversion = stats ? getConversionQuality(stats.totalViews, stats.totalLeads) : null;
    const isLoadingStats = loading && stats === null;

    if (isLoadingStats) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-[#B79A63]" />
                <p className="text-[#1E1E1E]/40 uppercase text-xs font-bold tracking-[0.2em] font-lato">Chargement de votre univers...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-12 pb-20">
            {/* Header: Serene & Minimalist */}
            <header className="space-y-2">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#1E1E1E]">
                    Bonjour, <span className="text-[#B79A63]">{user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Partenaire'}</span>
                </h1>
                <p className="text-[#1E1E1E]/40 font-serif italic text-lg">
                    L'analyse claire de vos performances.
                </p>
            </header>

            {/* Control Bar: Clean & Functional */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 py-4 border-y border-[#D4D2CF]/30 animate-fade-in-up">
                <div className="flex flex-1 gap-4">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="flex-1 bg-white px-5 py-3 rounded-xl border border-[#D4D2CF] text-sm font-bold text-[#1E1E1E] focus:ring-1 focus:ring-[#B79A63] focus:border-[#B79A63] cursor-pointer font-lato transition-all shadow-sm"
                    >
                        {MOCK_PERIODS.map(p => (<option key={p.id} value={p.id}>{p.title}</option>))}
                    </select>

                    <select
                        value={selectedCategory}
                        onChange={(e) => { setSelectedCategory(e.target.value); setSelectedService("all"); }}
                        className="flex-1 bg-white px-5 py-3 rounded-xl border border-[#D4D2CF] text-sm font-bold text-[#1E1E1E] focus:ring-1 focus:ring-[#B79A63] focus:border-[#B79A63] cursor-pointer font-lato transition-all shadow-sm"
                    >
                        <option value="all">Tous les univers</option>
                        {availableCategories.map(c => (<option key={c.slug} value={c.slug}>{c.label}</option>))}
                    </select>
                </div>

                <div className="relative flex-1">
                    <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full bg-[#1E1E1E] text-[#F8F5F0] pl-11 pr-5 py-3 rounded-xl border-none text-sm font-bold focus:ring-1 focus:ring-[#B79A63] cursor-pointer font-lato transition-all shadow-lg"
                    >
                        <option value="all">Toutes vos prestations</option>
                        {availableServices
                            .filter(s => selectedCategory === "all" || s.category_slug === selectedCategory)
                            .map(s => (<option key={s.id} value={s.id}>{s.commercial_name}</option>))}
                    </select>
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B79A63]" />
                </div>
            </div>

            {/* Hero Stats: The Gilded Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* 1. Leads */}
                <div className="bg-white p-8 rounded-2xl border border-[#D4D2CF] shadow-sm hover:shadow-md transition-all group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#1E1E1E]/60 font-lato">Mandats & Leads</span>
                        <div className="p-2.5 rounded-lg bg-[#B79A63]/5 text-[#B79A63]">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="font-serif text-5xl font-bold text-[#B79A63] tabular-nums tracking-tighter">{stats?.totalLeads}</p>
                        <div className="flex items-center text-emerald-600 text-xs font-bold font-lato">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                            {stats?.leadsTrend}
                        </div>
                    </div>
                </div>

                {/* 2. Vues */}
                <div className="bg-white p-8 rounded-2xl border border-[#D4D2CF] shadow-sm hover:shadow-md transition-all group animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#1E1E1E]/60 font-lato">Visibilité Profil</span>
                        <div className="p-2.5 rounded-lg bg-[#B79A63]/5 text-[#B79A63]">
                            <Eye className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="font-serif text-5xl font-bold text-[#1E1E1E] tabular-nums tracking-tighter">{stats?.totalViews}</p>
                        <div className="flex items-center text-emerald-600 text-xs font-bold font-lato">
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            {stats?.viewsTrend}
                        </div>
                    </div>
                </div>

                {/* 3. Satisfaction */}
                <div className="bg-white p-8 rounded-2xl border border-[#D4D2CF] shadow-sm hover:shadow-md transition-all group animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#1E1E1E]/60 font-lato">Satisfaction</span>
                        <div className="p-2.5 rounded-lg bg-[#B79A63]/5 text-[#B79A63]">
                            <Star className="w-5 h-5 fill-[#B79A63]" />
                        </div>
                    </div>
                    <div className="flex items-end gap-1.5 mt-2">
                        <p className="font-serif text-5xl font-bold text-[#1E1E1E] tabular-nums tracking-tighter">{stats?.averageRating}</p>
                        <span className="font-serif text-2xl text-[#1E1E1E]/20 mb-1">/5</span>
                        <span className="text-xs font-bold text-[#1E1E1E]/40 ml-auto font-lato">{stats?.reviewsCount} avis</span>
                    </div>
                </div>

                {/* 4. Conversion */}
                <div className="bg-white p-8 rounded-2xl border border-[#D4D2CF] shadow-sm hover:shadow-md transition-all group animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#1E1E1E]/60 font-lato">Conversion</span>
                        <div className={cn("px-3 py-1.5 rounded-lg text-xs font-bold font-lato uppercase", totalConversion?.bg, totalConversion?.color)}>
                            {totalConversion?.label}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                        <p className="font-serif text-5xl font-bold text-[#1E1E1E] tabular-nums tracking-tighter">{totalConversion?.rate}</p>
                        <span className="font-serif text-2xl text-[#1E1E1E]/20">%</span>
                    </div>
                </div>
            </div>

            {/* Performance Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Chart */}
                <div className="lg:col-span-2 bg-white p-10 rounded-3xl border border-[#D4D2CF] shadow-sm animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                    <h3 className="font-serif text-2xl font-bold text-[#1E1E1E] mb-10">L'activité dans le temps</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.chartData || []} margin={{ left: -25, right: 0, top: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#B79A63" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#B79A63" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#EBE6DA" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1E1E1E', fontWeight: 'bold' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1E1E1E30', fontWeight: 'bold' }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #D4D2CF', backgroundColor: '#F8F5F0', boxShadow: 'none' }}
                                    itemStyle={{ fontSize: '14px', color: '#1E1E1E' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    stroke="#B79A63"
                                    strokeWidth={3}
                                    fill="url(#colorLeads)"
                                    animationDuration={2000}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#D4D2CF"
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    fill="transparent"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Paroles de Clients */}
                <div className="bg-[#1E1E1E] p-10 rounded-3xl text-[#F8F5F0] animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <h3 className="font-serif text-2xl font-bold mb-8">Paroles de Clients</h3>
                    <div className="space-y-8 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                        {stats?.recentReviews && stats.recentReviews.length > 0 ? (
                            stats.recentReviews.map((review: any) => (
                                <div key={review.id} className="space-y-2 border-b border-white/5 pb-6 last:border-0">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest font-lato text-[#D4D2CF]/70">
                                        <span>{review.client}</span>
                                        <span>{format(new Date(review.date), 'dd MMM', { locale: fr })}</span>
                                    </div>
                                    <p className="font-serif italic text-lg text-[#D4D2CF]/90 leading-relaxed">"{review.text}"</p>
                                    <div className="flex gap-0.5 pt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={cn("w-2.5 h-2.5", i < review.rating ? "text-[#B79A63] fill-[#B79A63]" : "text-white/10")} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="p-4 rounded-full bg-white/5">
                                    <Star className="w-8 h-8 text-white/10" />
                                </div>
                                <p className="font-serif italic text-[#D4D2CF]/40 text-lg">Aucun avis pour le moment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Detail Module */}
            <div className="bg-white rounded-3xl border border-[#D4D2CF] shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                <div className="p-10 border-b border-[#D4D2CF]/30 bg-[#F8F5F0]/50">
                    <h3 className="font-serif text-3xl font-bold text-[#1E1E1E]">Audit du Portfolio</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#F8F5F0]/30">
                                <th className="px-10 py-5 text-xs font-bold uppercase tracking-[0.1em] text-[#1E1E1E]/40 font-lato">Prestation Élite</th>
                                <th className="px-10 py-5 text-xs font-bold uppercase tracking-[0.1em] text-[#1E1E1E]/40 text-center font-lato">Visibilité</th>
                                <th className="px-10 py-5 text-xs font-bold uppercase tracking-[0.1em] text-[#1E1E1E]/40 text-center font-lato">Impact</th>
                                <th className="px-10 py-5 text-xs font-bold uppercase tracking-[0.1em] text-[#1E1E1E]/40 text-right font-lato">Conversion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4D2CF]/20">
                            {stats?.topServices?.map((service: any) => {
                                const sConv = getConversionQuality(service.views, service.leads);
                                return (
                                    <tr key={service.id} className="hover:bg-[#F8F5F0]/30 transition-colors">
                                        <td className="px-10 py-8 font-serif text-lg font-bold text-[#1E1E1E] uppercase tracking-tight">{service.title}</td>
                                        <td className="px-10 py-8 text-center font-serif text-xl text-[#1E1E1E]/40 tabular-nums">{service.views}</td>
                                        <td className="px-10 py-8 text-center font-serif text-xl text-[#1E1E1E] font-bold tabular-nums">{service.leads}</td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn("text-xs font-bold px-3 py-1 rounded font-lato uppercase", sConv.bg, sConv.color)}>{sConv.label}</span>
                                                    <span className="font-serif text-xl font-bold text-[#1E1E1E]">{sConv.rate}%</span>
                                                </div>
                                                <div className="w-24 h-1 bg-[#D4D2CF]/20 rounded-full overflow-hidden">
                                                    <div className={cn("h-full", sConv.bg.replace('50/50', '500'))} style={{ width: `${Math.min(parseFloat(sConv.rate) * 4, 100)}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
