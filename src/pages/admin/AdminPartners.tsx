import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
    Loader2, Search, Store, ChevronRight, ChevronDown,
    CheckCircle, XCircle, Clock, Trash2, AlertCircle,
    User, Briefcase, MessageSquare, ExternalLink,
    Mail, Phone, MapPin, Calendar, LayoutGrid, Filter,
    Building2, UserCircle2, ArrowUpDown
} from "lucide-react";
import { GildedInput } from "@/components/ui/gilded-input";
import { UnifiedBadge, UnifiedButton } from "@/components/unified";
import { ModerationDrawer } from "@/components/admin/ModerationDrawer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
}

interface Partner {
    user_id: string;
    display_name: string;
    email: string;
    profile: ModerationItem & { 
        display_name: string; 
        email: string;
        provider_type?: string;
        phone_number?: string;
        wilaya_id?: string;
    };
    prestations: Prestation[];
}

export default function AdminPartners() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
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
            // Defensive filter against null entries
            setPartners((data || []).filter((p: any) => p && p.profile));
        } catch (error: any) {
            console.error("Error fetching moderation list:", error);
            toast.error("Échec du chargement de la liste");
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

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'approved': 
                return { label: 'Validé', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
            case 'rejected': 
                return { label: 'Rejeté', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
            case 'pending': 
                return { label: 'En attente', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse' };
            default: 
                return { label: status, color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
        }
    };

    const filteredPartners = useMemo(() => {
        return partners.filter(p => {
            const matchesSearch = 
                p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
                p.email?.toLowerCase().includes(search.toLowerCase()) ||
                p.prestations?.some(pr => pr?.commercial_name?.toLowerCase().includes(search.toLowerCase()));
            
            const matchesStatus = statusFilter === "all" || 
                p?.profile?.status === statusFilter || 
                p?.prestations?.some(pr => pr?.status === statusFilter);
            
            const matchesType = typeFilter === "all" || p?.profile?.provider_type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [partners, search, statusFilter, typeFilter]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex h-[70vh] items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#B79A63]" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-10 animate-in fade-in duration-700 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-[#1E1E1E] tracking-tight">Gestion des Partenaires</h1>
                        <p className="text-sm text-[#1E1E1E]/40 font-medium italic">Gérez vos prestataires et validez leurs prestations en toute simplicité.</p>
                    </div>
                    {partners?.some(p => p.profile?.status === 'pending' || p.prestations?.some(pr => pr?.status === 'pending')) && (
                        <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 px-4 py-2 rounded-2xl">
                             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                             <span className="text-sm font-black text-orange-700 uppercase tracking-widest">Action Requise</span>
                        </div>
                    )}
                </div>

                {/* Filters Bar */}
                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[32px] border border-white shadow-sm flex flex-col lg:flex-row gap-6 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 transition-colors group-focus-within:text-[#B79A63]" />
                        <input 
                            type="text" 
                            placeholder="Rechercher un nom, email ou service..."
                            className="w-full h-14 pl-14 pr-6 bg-slate-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#B79A63]/20 transition-all outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] h-14 bg-slate-50/50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#B79A63]/20">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-xl rounded-2xl border-slate-100">
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="approved">Validés</SelectItem>
                                <SelectItem value="rejected">Rejetés</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px] h-14 bg-slate-50/50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#B79A63]/20">
                                <UserCircle2 className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-xl rounded-2xl border-slate-100">
                                <SelectItem value="all">Tous les types</SelectItem>
                                <SelectItem value="individual">Individuel</SelectItem>
                                <SelectItem value="agency">Agence</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <UnifiedButton 
                            variant="secondary" 
                            onClick={fetchModerationList}
                            className="h-14 w-14 p-0 rounded-2xl border-slate-100 bg-white hover:bg-[#B79A63]/5 hover:border-[#B79A63]/20"
                        >
                            <ArrowUpDown className="w-5 h-5 text-slate-400" />
                        </UnifiedButton>
                    </div>
                </div>

                {/* Partners List */}
                <div className="space-y-6">
                    {filteredPartners.map((partner) => {
                        const isExpanded = expandedPartners[partner.user_id];
                        const profStatus = getStatusConfig(partner.profile?.status || 'pending');
                        
                        return (
                            <div key={partner.user_id} className="group bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-black/5 overflow-hidden">
                                {/* Partner Main Row */}
                                <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                    <div className="flex flex-1 gap-6 items-center min-w-0">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B79A63] to-[#A68952] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#B79A63]/20">
                                            {partner.profile?.provider_type === 'agency' ? <Building2 className="w-8 h-8" /> : <User className="w-8 h-8" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-[#1E1E1E] truncate tracking-tight">{partner.display_name}</h3>
                                                <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", profStatus.color)}>
                                                    {profStatus.label}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-xs font-bold text-[#1E1E1E]/40">
                                                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {partner.email}</span>
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Inscription: {partner.profile?.created_at ? new Date(partner.profile.created_at).toLocaleDateString() : 'N/A'}</span>
                                                {partner.prestations?.length > 0 && (
                                                    <span className="flex items-center gap-1.5 text-[#B79A63] bg-[#B79A63]/5 px-2 py-0.5 rounded-lg border border-[#B79A63]/10">
                                                        <LayoutGrid className="w-3.5 h-3.5" /> {partner.prestations.length} services
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <UnifiedButton
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setSelectedItem({ type: 'profile', data: partner.profile })}
                                            className="font-black text-[10px] px-6 rounded-xl hover:translate-y-[-2px] transition-transform"
                                        >
                                            Modérer Profil
                                        </UnifiedButton>
                                        
                                        <button 
                                            onClick={() => togglePartner(partner.user_id)}
                                            className={cn(
                                                "w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-[#B79A63]/10 hover:text-[#B79A63] transition-all duration-300",
                                                isExpanded && "bg-[#B79A63] text-white rotate-180 hover:bg-[#B79A63] hover:text-white"
                                            )}
                                        >
                                            <ChevronDown className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Prestations */}
                                {isExpanded && (
                                    <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
                                        <div className="h-px w-full bg-slate-100 mb-8" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {partner.prestations?.map((prestation) => {
                                                if (!prestation) return null;
                                                const preStatus = getStatusConfig(prestation.status);
                                                return (
                                                    <div 
                                                        key={prestation.id}
                                                        className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-[#B79A63]/30 transition-all group/card cursor-pointer"
                                                        onClick={() => setSelectedItem({ type: 'prestation', data: prestation, parentId: partner.user_id })}
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-[#B79A63] shadow-sm transform transition-transform group-hover/card:scale-110">
                                                                <Briefcase className="w-5 h-5" />
                                                            </div>
                                                            <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border", preStatus.color)}>
                                                                {preStatus.label}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-black text-[#1E1E1E] text-sm mb-1 truncate">{prestation.commercial_name}</h4>
                                                        <p className="text-[10px] font-bold text-[#1E1E1E]/40 uppercase tracking-widest mb-4 italic">{prestation.category_slug}</p>
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#B79A63] group-hover/card:translate-x-1 transition-transform">
                                                            Modérer Service <ChevronRight className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {partner.prestations.length === 0 && (
                                                <div className="col-span-full py-10 text-center text-slate-300 italic text-sm">
                                                    Aucune prestation enregistrée pour ce partenaire.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {filteredPartners.length === 0 && (
                        <div className="py-32 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                            <Search className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-[#1E1E1E]/20">Aucun résultat trouvé</h3>
                            <p className="text-sm font-medium text-slate-300 italic">Essayez d'ajuster vos filtres ou votre recherche.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Moderation Drawer */}
            {selectedItem && (
                <ModerationDrawer
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    itemType={selectedItem.type}
                    data={selectedItem.data}
                    parentId={selectedItem.parentId}
                    onStatusChange={fetchModerationList}
                />
            )}
        </AdminLayout>
    );
}
