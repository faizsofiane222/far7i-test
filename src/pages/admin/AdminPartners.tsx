// Triggering re-deployment
import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
    Loader2, Search, Store, ChevronRight, ChevronDown,
    CheckCircle, XCircle, Clock, Trash2, AlertCircle,
    User, Briefcase, MessageSquare, ExternalLink,
    Mail, Phone, MapPin, Calendar, LayoutGrid
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
    specifics?: any;
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
    const [expandedPartners, setExpandedPartners] = useState<Record<string, boolean>>({});
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

    const togglePartner = (userId: string) => {
        setExpandedPartners(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': 
                return <UnifiedBadge status="approved" size="sm" className="bg-emerald-100 text-emerald-700 border-emerald-200">Approuvé</UnifiedBadge>;
            case 'rejected': 
                return <UnifiedBadge status="rejected" size="sm" className="bg-red-100 text-red-700 border-red-200">Refusé</UnifiedBadge>;
            case 'pending': 
                return <UnifiedBadge status="pending" size="sm" className="bg-orange-100 text-orange-700 border-orange-200 animate-pulse">À Valider</UnifiedBadge>;
            case 'incomplete':
                return <UnifiedBadge status="draft" size="sm" className="bg-slate-100 text-slate-600 border-slate-200">Incomplet</UnifiedBadge>;
            default: 
                return <UnifiedBadge status="draft" size="sm">{status}</UnifiedBadge>;
        }
    };

    const filteredPartners = partners.filter(p =>
        p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.prestations?.some((pr: any) => pr.commercial_name?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-serif font-bold text-[#1E1E1E] tracking-tight">
                            Gestion des Partenaires
                        </h1>
                        <p className="text-[#1E1E1E]/60 font-lato text-lg">
                            Modérez les profils et prestations avec la nouvelle interface unifiée.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/50 backdrop-blur-sm border border-[#D4D2CF] rounded-2xl px-4 py-2 flex items-center gap-2 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-sm font-bold text-slate-700">
                                {partners.reduce((acc, p) => acc + ((p.prestations?.some(pr => pr.status === 'pending') || p.profile?.status === 'pending') ? 1 : 0), 0)} En attente
                            </span>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-5 rounded-3xl border border-[#D4D2CF]/60 shadow-xl shadow-slate-200/50 transition-all focus-within:shadow-[#B79A63]/10">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B79A63]" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou prestation..."
                            className="w-full pl-12 pr-4 h-14 bg-slate-50 border-none rounded-2xl outline-none text-[#1E1E1E] font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-[#B79A63]/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Partners List (Accordions) */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 animate-spin text-[#B79A63]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-white rounded-full border border-slate-100 shadow-sm" />
                                </div>
                            </div>
                            <p className="text-slate-500 font-serif italic text-lg opacity-80 animate-pulse">Chargement des fleurons de la plateforme...</p>
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-slate-500">Aucun partenaire trouvé</h3>
                            <p className="text-slate-400 mt-2">Essayez d'ajuster vos critères de recherche.</p>
                        </div>
                    ) : (
                        filteredPartners.map((partner) => {
                            const isExpanded = expandedPartners[partner.user_id];
                            const pendingItems = [
                                ...(partner.profile?.status === 'pending' ? [{ type: 'profile', data: partner.profile }] : []),
                                ...(partner.prestations?.filter(p => p.status === 'pending').map(p => ({ type: 'prestation', data: p })) || [])
                            ];

                            return (
                                <div 
                                    key={partner.user_id}
                                    className={cn(
                                        "bg-white rounded-3xl border transition-all duration-500 overflow-hidden shadow-sm group",
                                        isExpanded ? "ring-2 ring-[#B79A63]/30 border-[#B79A63]/50 shadow-2xl" : "hover:border-[#B79A63]/40 hover:shadow-md"
                                    )}
                                >
                                    {/* Partner Header (Accordion Toggle) */}
                                    <div 
                                        className={cn(
                                            "p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer transition-colors",
                                            isExpanded ? "bg-[#F8F5F0]" : "bg-white"
                                        )}
                                        onClick={() => togglePartner(partner.user_id)}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9CA986] to-[#B79A63] flex items-center justify-center text-white font-serif text-2xl font-bold shadow-lg shadow-[#B79A63]/20 ring-4 ring-white">
                                                    {partner.display_name?.[0] || 'P'}
                                                </div>
                                                {pendingItems.length > 0 && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-md animate-bounce">
                                                        {pendingItems.length}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-bold text-[#1E1E1E] group-hover:text-[#B79A63] transition-colors">{partner.display_name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {partner.email}</span>
                                                    <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {(partner.prestations?.length || 0)} services</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="hidden md:flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Statut Global</span>
                                                {pendingItems.length > 0 ? (
                                                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                                        <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                                        <span className="text-xs font-bold text-orange-600 uppercase">Attention requise</span>
                                                    </div>
                                                ) : partner.profile?.status === 'incomplete' || !partner.profile ? (
                                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                        <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-500 uppercase">Profil Incomplet</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span className="text-xs font-bold text-emerald-600 uppercase">Vérifié</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                isExpanded ? "bg-[#B79A63] text-white rotate-180" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                                            )}>
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Partner Content (Expandable) */}
                                    {isExpanded && (
                                        <div className="p-8 bg-white border-t border-[#D4D2CF]/30 space-y-8 animate-in slide-in-from-top-4 duration-500">
                                            
                                            {/* Section: Profil & Administration */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                                    <User className="w-4 h-4 text-[#B79A63]" />
                                                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Identité & Profil</h4>
                                                </div>
                                                
                                                <div 
                                                    className="group/item flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-[#F8F5F0] hover:border-[#B79A63]/30 transition-all cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedItem({ type: 'profile', data: partner.profile || { id: partner.user_id, display_name: partner.display_name, email: partner.email, status: 'incomplete' } });
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-500 shadow-sm group-hover/item:shadow-md transition-all">
                                                            <User className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#1E1E1E]">Profil de {partner.display_name}</p>
                                                            <p className="text-xs text-slate-500">Informations générales, bio, et contacts.</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        {partner.profile ? getStatusBadge(partner.profile.status) : <UnifiedBadge status="draft" size="sm">Incomplet</UnifiedBadge>}
                                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover/item:translate-x-1 group-hover/item:text-[#B79A63] transition-all" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section: Prestations (Services) */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                                    <LayoutGrid className="w-4 h-4 text-[#B79A63]" />
                                                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Prestations de Service</h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {partner.prestations?.map((presta) => (
                                                        <div 
                                                            key={presta.id}
                                                            className="group/presta flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white hover:bg-[#F8F5F0] hover:border-[#B79A63]/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedItem({ type: 'prestation', data: presta, parentId: partner.user_id });
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-[#B79A63] border border-slate-100 transition-colors group-hover/presta:bg-white">
                                                                    <Briefcase className="w-6 h-6" />
                                                                </div>
                                                                <div className="max-w-[140px] lg:max-w-none">
                                                                    <p className="font-bold text-[#1E1E1E] truncate">{presta.commercial_name}</p>
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{presta.category_slug.replace(/_/g, ' ')}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                {getStatusBadge(presta.status)}
                                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover/presta:translate-x-1 group-hover/presta:text-[#B79A63] transition-all" />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {partner.prestations.length === 0 && (
                                                        <div className="col-span-2 py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                                            <p className="text-slate-400 text-sm font-medium">Aucune prestation active pour le moment.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            );
                        })
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
