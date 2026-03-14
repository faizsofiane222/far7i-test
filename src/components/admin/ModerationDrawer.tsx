import React, { useState, useEffect } from "react";
import {
    X, Check, AlertCircle, Trash2,
    Instagram, Facebook, Globe, Phone, MapPin,
    Calendar, User, Briefcase, Camera, Info,
    Tag, ShieldCheck, Mail, Clock, CheckCircle,
    Store, Smartphone, Star, LayoutGrid, Heart,
    CheckCircle2, XCircle, ChevronRight, Loader2, MessageSquare,
    Image as ImageIcon, ListChecks, DollarSign,
    Milestone, BadgeInfo, History, ExternalLink, Building2
} from "lucide-react";
import { ProfileDiffViewer } from "./ProfileDiffViewer";
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { UnifiedButton } from "@/components/unified/UnifiedButton";
import { UnifiedBadge } from "@/components/unified/UnifiedBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ModerationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    itemType: 'profile' | 'prestation' | 'review';
    parentId?: string;
    onStatusChange: () => void;
}

export function ModerationDrawer({ isOpen, onClose, data, itemType, parentId, onStatusChange }: ModerationDrawerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [wilayas, setWilayas] = useState<any[]>([]);

    useEffect(() => {
        const fetchWilayas = async () => {
            const { data: w } = await supabase.from('wilayas').select('*').order('code');
            if (w) setWilayas(w);
        };
        fetchWilayas();
    }, []);

    const getWilayaName = (id: string) => {
        if (!id) return "—";
        const w = wilayas.find(x => x.id === id);
        return w ? `${w.code} - ${w.name}` : id;
    };

    const pendingUpdates = data?.pending_updates;
    const isModification = !!pendingUpdates;

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!data) return;
        if (action === 'reject' && !rejectionReason) {
            setShowRejectionInput(true);
            return;
        }

        try {
            setIsSubmitting(true);
            const rpcName = itemType === 'profile' ? 'handle_profile_moderation' : 'handle_prestation_moderation';
            const idKey = itemType === 'profile' ? 'p_user_id' : 'p_provider_id';
            const targetId = itemType === 'profile' ? (data.user_id || data.id) : data.id;

            const { error } = await (supabase as any).rpc(rpcName, {
                [idKey]: targetId,
                p_action: action,
                p_reason: action === 'reject' ? rejectionReason : null
            });

            if (error) throw error;
            toast.success(action === 'approve' ? "Approuvé avec succès" : "Élément rejeté");
            onStatusChange();
            onClose();
        } catch (error: any) {
            console.error("Moderation error:", error);
            toast.error(`Erreur: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFieldModified = (key: string) => {
        if (!isModification || !pendingUpdates) return false;
        const oldVal = data[key];
        const newVal = pendingUpdates[key];
        if (oldVal === newVal) return false;
        return true;
    };

    const SectionHeader = ({ icon: Icon, title, subtitle, color = "text-[#B79A63]" }: any) => (
        <div className="flex items-center gap-4 mb-8">
            <div className={cn("p-3 rounded-2xl bg-white border border-slate-100 shadow-sm", color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-black text-[#1E1E1E] tracking-tight">{title}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subtitle}</p>
            </div>
        </div>
    );

    const ProfileView = () => (
        <div className="space-y-12 pb-24 animate-in fade-in duration-700">
            {/* 1. Modifications Audit (Highest Priority) */}
            {isModification && (
                <div className="bg-blue-50/50 rounded-[32px] border border-blue-100 p-8 space-y-6">
                    <SectionHeader 
                        icon={History} 
                        title="Audit des Modifications" 
                        subtitle="Comparaison Avant/Après" 
                        color="text-blue-600"
                    />
                    <ProfileDiffViewer oldData={data} newData={pendingUpdates} />
                </div>
            )}

            {/* 2. Global Mirror (Mirrors Profile.tsx) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Lateral Admin Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm flex flex-col items-center gap-6">
                         <div className="w-40 h-40 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative">
                            <img 
                                src={pendingUpdates?.profile_picture_url || data.profile_picture_url || "/placeholder.svg"} 
                                className="w-full h-full object-cover" 
                                alt="Avatar" 
                            />
                            {isFieldModified('profile_picture_url') && (
                                <div className="absolute inset-x-0 bottom-0 bg-blue-500 py-1 flex items-center justify-center">
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Nouveau</span>
                                </div>
                            )}
                         </div>
                         <div className="text-center space-y-1">
                            <h4 className="text-lg font-black text-[#1E1E1E] leading-tight">
                                {pendingUpdates?.commercial_name || data.commercial_name || data.display_name}
                            </h4>
                            <p className="text-xs font-bold text-slate-400">{data.email}</p>
                         </div>
                         <div className="w-full h-px bg-slate-50" />
                         <div className="w-full grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase text-slate-400">Statut Actuel</p>
                                <UnifiedBadge status={data.status || 'pending'} size="sm" className="w-full justify-center" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase text-slate-400">Services</p>
                                <p className="text-sm font-black text-[#1E1E1E] px-3">{(data as any).prestations_count || 0}</p>
                            </div>
                         </div>
                    </div>

                    {data.rejection_reason && (
                        <div className="p-6 bg-red-50 border border-red-100 rounded-[24px] space-y-2">
                            <p className="text-[8px] font-black uppercase text-red-500 tracking-widest flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" /> Motif du Rejet Précédent
                            </p>
                            <p className="text-xs font-bold text-red-700 italic leading-relaxed">"{data.rejection_reason}"</p>
                        </div>
                    )}
                </div>

                {/* Main Content Mirror */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-sm space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <Detail label="Type de Prestataire" icon={Building2} modified={isFieldModified('provider_type')}>
                                {(pendingUpdates?.provider_type || data.provider_type) === 'agency' ? 'Agence' : 'Individuel'}
                            </Detail>
                            <Detail label="Wilaya" icon={MapPin} modified={isFieldModified('wilaya_id')}>
                                {getWilayaName(pendingUpdates?.wilaya_id || data.wilaya_id)}
                            </Detail>
                            <Detail label="Téléphone" icon={Phone} modified={isFieldModified('phone_number')}>
                                {pendingUpdates?.phone_number || data.phone_number}
                            </Detail>
                            <Detail label="Réseau Social" icon={Instagram} modified={isFieldModified('social_link')}>
                                <a href={pendingUpdates?.social_link || data.social_link} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">
                                    Lien externe <ExternalLink className="w-3 h-3" />
                                </a>
                            </Detail>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Canaux de communication</p>
                            <div className="flex flex-wrap gap-4">
                                <Channel active={pendingUpdates?.is_whatsapp_active ?? data.is_whatsapp_active}>WhatsApp</Channel>
                                <Channel active={pendingUpdates?.is_viber_active ?? data.is_viber_active}>Viber</Channel>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Biographie / Description</p>
                            <div className={cn(
                                "p-6 rounded-2xl bg-slate-50 text-sm font-medium leading-relaxed text-slate-600",
                                isFieldModified('bio') && "ring-2 ring-blue-500/20 bg-blue-50/20"
                            )}>
                                {pendingUpdates?.bio || data.bio || "Aucune biographie fournie."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const PrestationView = () => (
        <div className="space-y-12 pb-24 animate-in fade-in duration-700">
             <div className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-sm space-y-10">
                <SectionHeader icon={Briefcase} title={data.commercial_name} subtitle={data.category_slug?.replace(/_/g, ' ')} />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Detail label="Prix de Base" icon={DollarSign}>{data.base_price ? `${data.base_price} DA` : 'Non défini'}</Detail>
                    <Detail label="Wilaya de Service" icon={MapPin}>{getWilayaName(data.wilaya_id)}</Detail>
                    <Detail label="Téléphone" icon={Phone}>{data.phone_number}</Detail>
                </div>

                <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Galerie Photos</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(data.gallery || []).map((m: any, i: number) => (
                            <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative border-2 border-white">
                                <img src={m.media_url} className="w-full h-full object-cover" />
                                {m.is_main && <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg">PRINCIPALE</div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Description</p>
                    <div className="p-6 rounded-2xl bg-slate-50 text-sm font-medium leading-relaxed text-slate-600">
                        {data.bio || "Aucune description."}
                    </div>
                </div>
             </div>
        </div>
    );

    const Detail = ({ label, icon: Icon, children, modified }: any) => (
        <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Icon className="w-3 h-3" /> {label}
                {modified && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
            </p>
            <div className={cn("text-sm font-black text-[#1E1E1E]", modified && "text-blue-600")}>
                {children || "—"}
            </div>
        </div>
    );

    const Channel = ({ active, children }: any) => (
        <div className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
            active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-300 border-slate-100"
        )}>
            {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {children}
        </div>
    );

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-[85vw] max-w-[1200px] p-0 bg-[#F8F5F0] border-l-0 overflow-hidden shadow-none font-lato">
                <div className="flex flex-col h-full">
                    {/* Header bar */}
                    <div className="bg-[#1E1E1E] p-8 md:p-10 flex items-center justify-between shadow-2xl relative z-20">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-[#B79A63] rounded-2xl flex items-center justify-center shadow-lg shadow-[#B79A63]/20">
                                {itemType === 'profile' ? <User className="w-7 h-7 text-white" /> : <Briefcase className="w-7 h-7 text-white" />}
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                    Modération {itemType === 'profile' ? 'Profil' : 'Prestation'}
                                </h1>
                                <p className="text-[#B79A63]/70 text-xs font-bold uppercase tracking-widest">{data?.commercial_name || data?.display_name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable contents */}
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-10">
                        <div className="max-w-4xl mx-auto">
                            {itemType === 'profile' ? <ProfileView /> : <PrestationView />}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white/80 backdrop-blur-3xl border-t border-slate-100 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] relative z-20">
                        <div className="max-w-4xl mx-auto">
                            {showRejectionInput ? (
                                <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#B79A63] flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> Motif du Rejet (Sera visible par le prestataire)
                                        </label>
                                        <textarea 
                                            className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-red-500/20 outline-none resize-none transition-all placeholder:italic"
                                            placeholder="Ex: Les photos sont de mauvaise qualité, veuillez les remplacer..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-4">
                                        <UnifiedButton variant="ghost" onClick={() => setShowRejectionInput(false)} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                                            Annuler
                                        </UnifiedButton>
                                        <UnifiedButton 
                                            variant="secondary" 
                                            className="bg-red-500 text-white hover:bg-red-600 h-14 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-200"
                                            onClick={() => handleAction('reject')}
                                            loading={isSubmitting}
                                        >
                                            Confirmer le Rejet
                                        </UnifiedButton>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center justify-end gap-6">
                                    <UnifiedButton 
                                        variant="secondary" 
                                        className="h-16 px-10 border-slate-100 rounded-3xl font-black uppercase text-[11px] tracking-widest text-slate-400 hover:text-red-500 hover:border-red-100 transition-all hover:bg-red-50 w-full sm:w-auto"
                                        onClick={() => setShowRejectionInput(true)}
                                        disabled={isSubmitting}
                                    >
                                        Marquer comme Non Conforme
                                    </UnifiedButton>
                                    <UnifiedButton 
                                        variant="secondary" 
                                        className="h-16 px-14 bg-[#1E1E1E] text-white hover:bg-[#B79A63] rounded-3xl font-black uppercase text-[12px] tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
                                        onClick={() => handleAction('approve')}
                                        loading={isSubmitting}
                                    >
                                        <CheckCircle2 className="w-5 h-5 mr-3" /> Approuver la Publication
                                    </UnifiedButton>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
