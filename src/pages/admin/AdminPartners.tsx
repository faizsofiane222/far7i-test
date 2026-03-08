import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
    Loader2, Search, Store, ChevronRight, ChevronDown,
    CheckCircle, XCircle, Clock, Trash2, AlertCircle,
    User, Briefcase, MessageSquare, ExternalLink
} from "lucide-react";
import { GildedInput } from "@/components/ui/gilded-input";
import { UnifiedBadge, UnifiedButton } from "@/components/unified";
import { ModerationDrawer } from "@/components/admin/ModerationDrawer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ModerationItem {
    id: string;
    status: string;
    moderation_status?: string;
    created_at: string;
    rejection_reason?: string;
    pending_updates?: any;
}

interface Prestation extends ModerationItem {
    commercial_name: string;
    category_slug: string;
    reviews: any[];
}

interface Partner {
    user_id: string;
    display_name: string;
    email: string;
    profile: ModerationItem & { display_name: string; email: string };
    prestations: Prestation[];
}

export default function AdminPartners() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [selectedItem, setSelectedItem] = useState<{
        type: 'profile' | 'prestation' | 'review';
        data: any;
        parentId?: string;
    } | null>(null);

    useEffect(() => {
        fetchModerationList();
    }, []);

    const fetchModerationList = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any).rpc('get_admin_moderation_list');
            if (error) throw error;
            setPartners(data || []);
        } catch (error: any) {
            console.error("Error fetching moderation list:", error);
            toast.error("Échec du chargement de la liste de modération");
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (userId: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'pending': return <Clock className="w-4 h-4 text-orange-500 animate-pulse" />;
            default: return <Clock className="w-4 h-4 text-slate-400" />;
        }
    };

    const filteredPartners = partners.filter(p =>
        p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.prestations?.some((pr: any) => pr.commercial_name?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <AdminLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E]">
                            Gestion des Partenaires
                        </h1>
                        <p className="text-[#1E1E1E]/60 font-lato">
                            Modérez les profils, les prestations et les avis des prestataires.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#D4D2CF] shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E1E1E]/40" />
                        <GildedInput
                            placeholder="Rechercher un partenaire, un email ou une prestation..."
                            className="pl-10 bg-[#F8F5F0] border-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#D4D2CF] shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-[#B79A63]" />
                            <p className="text-sm text-slate-500 font-medium">Chargement des données de modération...</p>
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Aucun partenaire trouvé.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#F8F5F0] border-b border-[#D4D2CF]">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/60 w-[40px]"></th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/60">Partenaire</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/60">Email</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/60 text-center">Éléments</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/60">Statut Global</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/60 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D4D2CF]">
                                    {filteredPartners.map((partner) => {
                                        const isExpanded = expandedRows[partner.user_id];
                                        // Check both 'status' (new column) AND 'moderation_status' (old column)
                                        const profilePending =
                                            partner.profile?.status === 'pending' ||
                                            partner.profile?.moderation_status === 'pending';
                                        const prestaPending = partner.prestations?.filter(
                                            (p: any) => p.status === 'pending' || p.moderation_status === 'pending'
                                        ).length ?? 0;
                                        const pendingCount = (profilePending ? 1 : 0) + prestaPending;

                                        return (
                                            <React.Fragment key={partner.user_id}>
                                                <tr
                                                    key={partner.user_id}
                                                    className={cn(
                                                        "hover:bg-[#F8F5F0]/50 transition-colors cursor-pointer group",
                                                        isExpanded && "bg-[#F8F5F0]/30"
                                                    )}
                                                    onClick={() => toggleRow(partner.user_id)}
                                                >
                                                    <td className="px-6 py-4">
                                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-[#B79A63]" /> : <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#B79A63]" />}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9CA986] to-[#B79A63] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                                {partner.display_name?.[0] || 'P'}
                                                            </div>
                                                            <span className="font-bold text-[#1E1E1E]">{partner.display_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{partner.email}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                                                            {partner.prestations.length} prestation{partner.prestations.length > 1 ? 's' : ''}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {pendingCount > 0 ? (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                                                                <span className="text-xs font-bold text-orange-600">
                                                                    {pendingCount} à valider
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                                <span className="text-xs font-bold text-green-600">À jour</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <UnifiedButton
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-[#B79A63] hover:bg-[#B79A63]/10"
                                                        >
                                                            Détails
                                                        </UnifiedButton>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="bg-[#F8F5F0]/20 animate-in slide-in-from-top-2 duration-300">
                                                        <td colSpan={6} className="px-12 py-4">
                                                            <div className="space-y-3 border-l-2 border-[#D4D2CF] ml-4 pl-6 py-2">
                                                                {/* Profil Segment */}
                                                                <div
                                                                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D4D2CF] hover:border-[#B79A63] transition-all cursor-pointer shadow-sm group/item"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Build fallback profile if null (migration pending)
                                                                        const profileData = partner.profile || {
                                                                            id: partner.user_id,
                                                                            display_name: partner.display_name,
                                                                            email: partner.email,
                                                                            status: 'pending',
                                                                        };
                                                                        setSelectedItem({ type: 'profile', data: profileData });
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                                            <User className="w-4 h-4" />
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-sm font-bold text-[#1E1E1E]">Profil Partenaire</span>
                                                                            {partner.profile?.pending_updates && (
                                                                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Mise à jour</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex items-center gap-2">
                                                                            {getStatusIcon(partner.profile?.status ?? 'pending')}
                                                                            <span className="text-xs capitalize text-slate-500 font-medium">{partner.profile?.status ?? 'pending'}</span>
                                                                        </div>
                                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:translate-x-1 transition-transform" />
                                                                    </div>
                                                                </div>

                                                                {/* Prestations Segments */}
                                                                {partner.prestations.map((presta) => (
                                                                    <div
                                                                        key={presta.id}
                                                                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D4D2CF] hover:border-[#B79A63] transition-all cursor-pointer shadow-sm group/item"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedItem({ type: 'prestation', data: presta, parentId: partner.user_id });
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                                                                <Briefcase className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-sm font-bold text-[#1E1E1E]">{presta.commercial_name}</span>
                                                                                <span className="ml-2 text-[10px] text-slate-400 uppercase font-bold">{presta.category_slug}</span>
                                                                                {presta.pending_updates && (
                                                                                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Modif</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 border-r pr-4 border-slate-100">
                                                                                <MessageSquare className="w-3 h-3" />
                                                                                {presta.reviews.length} avis
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {getStatusIcon(presta.status)}
                                                                                <span className="text-xs capitalize text-slate-500 font-medium">{presta.status}</span>
                                                                            </div>
                                                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:translate-x-1 transition-transform" />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ModerationDrawer
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                type={selectedItem?.type || 'profile'}
                item={selectedItem?.data}
                onActionComplete={fetchModerationList}
            />
        </AdminLayout>
    );
}
