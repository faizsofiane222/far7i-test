import React from "react";
import {
    X, Check, AlertCircle, Trash2,
    Instagram, Facebook, Globe, Phone, MapPin,
    Calendar, User, Briefcase, Camera, Info,
    Tag, ShieldCheck, Mail, Clock, CheckCircle,
    Store, Smartphone, Star, LayoutGrid, Heart,
    CheckCircle2, XCircle, ChevronRight, Loader2, MessageSquare,
    Image as ImageIcon, ListChecks, DollarSign,
    Milestone, BadgeInfo
} from "lucide-react";
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
    item: any;
    type: 'profile' | 'prestation' | 'review';
    onActionComplete: () => void;
}

export function ModerationDrawer({ isOpen, onClose, item, type, onActionComplete }: ModerationDrawerProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [showRejectionInput, setShowRejectionInput] = React.useState(false);
    const [wilayas, setWilayas] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchWilayas = async () => {
            const { data } = await supabase.from('wilayas').select('*').order('code');
            if (data) setWilayas(data);
        };
        fetchWilayas();
    }, []);

    const getWilayaName = (id: string) => {
        if (!id) return "—";
        const w = wilayas.find(x => x.id === id);
        return w ? `${w.code} - ${w.name}` : id;
    };

    const pendingUpdates = item?.pending_updates;
    const isNewCreation = !pendingUpdates && (item?.status === 'pending' || item?.status === 'incomplete');
    const isModification = !!pendingUpdates;

    const handleApprove = async () => {
        if (!item) return;
        try {
            setIsSubmitting(true);
            
            const rpcName = type === 'profile' ? 'handle_profile_moderation' : 'handle_prestation_moderation';
            const idKey = type === 'profile' ? 'p_user_id' : 'p_provider_id';
            const targetId = type === 'profile' ? item.user_id : item.id;
            
            const { error } = await (supabase as any).rpc(rpcName, {
                [idKey]: targetId,
                p_action: 'approve'
            });

            if (error) throw error;
            toast.success("Élément approuvé avec succès");
            onActionComplete();
            onClose();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!item) return;
        if (!rejectionReason) {
            setShowRejectionInput(true);
            return;
        }

        try {
            setIsSubmitting(true);
            
            const rpcName = type === 'profile' ? 'handle_profile_moderation' : 'handle_prestation_moderation';
            const idKey = type === 'profile' ? 'p_user_id' : 'p_provider_id';
            const targetId = type === 'profile' ? item.user_id : item.id;

            const { error } = await (supabase as any).rpc(rpcName, {
                [idKey]: targetId,
                p_action: 'reject',
                p_reason: rejectionReason
            });

            if (error) throw error;
            toast.success("Élément refusé");
            onActionComplete();
            onClose();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFieldModified = (key: string) => {
        if (!isModification || !pendingUpdates) return false;
        const oldVal = item[key];
        const newVal = pendingUpdates[key];

        if (oldVal === newVal) return false;
        if (!oldVal && !newVal) return false;

        if (typeof oldVal !== typeof newVal) return true;
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) return true;
        return true;
    };

    // Immersive Profile View (Matches Profile.tsx layout)
    const ProfileModerationView = () => (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Top Identity Block */}
            <div className="flex flex-col md:flex-row gap-10">
                <div className="md:w-1/3 xl:w-1/4 flex flex-col items-center">
                    <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative group">
                        <img 
                            src={pendingUpdates?.profile_picture_url || item.profile_picture_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + (item.display_name || 'P')} 
                            className="w-full h-full object-cover" 
                            alt="Avatar" 
                        />
                        {(isFieldModified('profile_picture_url')) && (
                            <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-[2px] flex items-center justify-center">
                                <UnifiedBadge className="bg-blue-600 text-white shadow-lg">Nouvelle Photo</UnifiedBadge>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <h2 className="text-4xl font-serif font-bold text-[#1E1E1E]">
                                {pendingUpdates?.commercial_name || item.commercial_name || item.display_name}
                           </h2>
                           {isFieldModified('commercial_name') && <UnifiedBadge status="pending">Modifié</UnifiedBadge>}
                        </div>
                        <p className="text-xl text-slate-500 font-medium">@{item.email?.split('@')[0]}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoCard 
                            icon={Briefcase} 
                            label="Type de Prestataire" 
                            value={
                                ['solo', 'individual'].includes(pendingUpdates?.provider_type || item.provider_type)
                                ? "Indépendant / Freelance" 
                                : (pendingUpdates?.provider_type || item.provider_type) === 'agency'
                                ? "Agence / Équipe"
                                : (pendingUpdates?.provider_type || item.provider_type)
                            } 
                            modified={isFieldModified('provider_type')} 
                        />
                        <InfoCard icon={Phone} label="Téléphone" value={pendingUpdates?.phone_number || item.phone_number} modified={isFieldModified('phone_number')} />
                        <InfoCard icon={MapPin} label="Wilaya" value={getWilayaName(pendingUpdates?.wilaya_id || item.wilaya_id)} modified={isFieldModified('wilaya_id')} />
                        <InfoCard icon={Globe} label="Lien Réseau Social (Instagram/Facebook)" value={pendingUpdates?.social_link || item.social_link} modified={isFieldModified('social_link')} />
                    </div>
                </div>
            </div>

            {/* Contact Details Full */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" /> Email (Non modifiable)
                    </p>
                    <div className="w-full h-12 flex items-center rounded-2xl border border-[#D4D2CF] bg-[#F8F5F0]/80 px-4 py-2 text-sm text-[#1E1E1E] font-semibold">
                        {item.email}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatusCard 
                        icon={Smartphone} 
                        label="WhatsApp" 
                        value={pendingUpdates?.is_whatsapp_active ?? item.is_whatsapp_active ? 'Activé' : 'Désactivé'} 
                        isActive={pendingUpdates?.is_whatsapp_active ?? item.is_whatsapp_active} 
                    />
                    <StatusCard 
                        icon={Smartphone} 
                        label="Viber" 
                        value={pendingUpdates?.is_viber_active ?? item.is_viber_active ? 'Activé' : 'Désactivé'} 
                        isActive={pendingUpdates?.is_viber_active ?? item.is_viber_active} 
                    />
                </div>
            </div>
        </div>
    );

    // Consolidated Service View (One scrollable page)
    const ServiceModerationView = () => {
        const specifics = item.specifics || {};
        const gallery = item.gallery || [];

        return (
            <div className="space-y-12 animate-in fade-in duration-500 pb-32">
                {/* 1. Header & Identity */}
                <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-orange-50 rounded-2xl text-orange-600"><Store className="w-6 h-6" /></div>
                            <div>
                                <h2 className="text-3xl font-serif font-bold text-[#1E1E1E]">{item.commercial_name}</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{item.category_slug?.replace(/_/g, ' ')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem icon={MapPin} label="Adresse" value={item.address} />
                        <DetailItem icon={Tag} label="Prix de Base" value={item.base_price ? `${item.base_price} DA` : 'Non défini'} />
                        <DetailItem icon={Smartphone} label="Téléphone" value={item.phone_number} />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <BadgeInfo className="w-4 h-4" /> Description du Service
                        </label>
                        <div className="bg-slate-50 p-6 rounded-2xl text-slate-600 leading-relaxed text-sm">
                            {item.bio || "Aucune description fournie."}
                        </div>
                    </div>
                </section>

                {/* 2. Specifics (Junction Data) */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-[#B79A63]/10 rounded-xl text-[#B79A63]"><ListChecks className="w-5 h-5" /></div>
                        <h3 className="text-xl font-bold font-serif text-slate-800">Détails Techniques & Capacités</h3>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                            {Object.entries(specifics).map(([key, val]) => {
                                if (['provider_id', 'created_at', 'updated_at', 'id'].includes(key)) return null;
                                return (
                                    <div key={key} className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate" title={key}>{key.replace(/_/g, ' ')}</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {typeof val === 'boolean' ? (val ? 'Oui' : 'Non') : (Array.isArray(val) ? val.length + ' options' : String(val ?? '—'))}
                                        </p>
                                    </div>
                                );
                            })}
                            {Object.keys(specifics).length === 0 && <p className="col-span-full text-slate-400 italic">Aucune donnée spécifique trouvée.</p>}
                        </div>
                    </div>
                </section>

                {/* 3. Media Gallery */}
                <section className="space-y-6">
                   <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><ImageIcon className="w-5 h-5" /></div>
                        <h3 className="text-xl font-bold font-serif text-slate-800">Galerie & Vitrine</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {gallery.map((m: any, i: number) => (
                            <div key={i} className="aspect-square rounded-3xl overflow-hidden border-2 border-white shadow-lg relative group">
                                <img src={m.media_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                {m.is_main && (
                                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl ring-2 ring-white">IMAGE PRINCIPALE</div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full p-0 bg-[#F8F5F0] border-l-0 overflow-hidden shadow-none sm:max-w-none">
                <div className="flex flex-col h-full relative font-lato">
                    {/* Header */}
                    <div className="sticky top-0 z-50 bg-[#1E1E1E] text-white p-8 shadow-2xl flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-[#B79A63]/25 rounded-2xl flex items-center justify-center ring-2 ring-[#B79A63]/10">
                                {type === 'profile' ? <User className="w-8 h-8 text-[#B79A63]" /> : <Briefcase className="w-8 h-8 text-[#B79A63]" />}
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-white font-serif text-3xl font-bold tracking-tight">
                                    Modération : <span className="text-[#B79A63]">{item?.commercial_name || item?.display_name || 'Chargement...'}</span>
                                </h1>
                                <div className="flex items-center gap-3">
                                    <UnifiedBadge status="pending" size="sm" className="bg-[#B79A63]/20 text-[#B79A63] border-[#B79A63]/30">
                                        En attente de validation
                                    </UnifiedBadge>
                                    <span className="text-slate-400 text-sm italic opacity-80">Soumis le {item?.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-90">
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        <div className="max-w-5xl mx-auto">
                            {!item ? (
                                <div className="py-20 text-center space-y-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-[#B79A63] mx-auto" />
                                    <p className="text-slate-500 font-serif italic text-lg">Préparation de la vue de modération...</p>
                                </div>
                            ) : type === 'profile' ? (
                                <ProfileModerationView />
                            ) : (
                                <ServiceModerationView />
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-8 bg-white/90 backdrop-blur-2xl border-t border-[#D4D2CF]/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_-20px_60px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-6">
                            <UnifiedButton
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50 px-6 h-14 rounded-2xl font-bold"
                                onClick={() => {/* handle delete */ }}
                            >
                                <Trash2 className="w-5 h-5 mr-3" /> Supprimer
                            </UnifiedButton>

                            {showRejectionInput && (
                                <div className="animate-in slide-in-from-left-6 flex items-center gap-3 bg-orange-50/50 p-2 rounded-2xl border border-orange-100 shadow-inner">
                                    <input
                                        type="text"
                                        placeholder="Motif du refus (ex: Photo de mauvaise qualité)"
                                        className="w-96 h-12 rounded-xl border-none bg-transparent px-4 text-sm font-bold placeholder:text-orange-300 focus:outline-none"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        autoFocus
                                    />
                                    <UnifiedButton
                                        variant="secondary"
                                        className="bg-orange-600 text-white hover:bg-orange-700 h-12 px-6 rounded-xl shadow-lg shadow-orange-200"
                                        onClick={handleReject}
                                        loading={isSubmitting}
                                    >
                                        Confirmer le refus
                                    </UnifiedButton>
                                    <button onClick={() => setShowRejectionInput(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {!showRejectionInput && (
                            <div className="flex items-center gap-5 w-full md:w-auto">
                                <UnifiedButton
                                    variant="secondary"
                                    className="bg-orange-500/15 text-orange-600 hover:bg-orange-500 hover:text-white border-none min-w-[160px] h-14 rounded-2xl font-bold transition-all shadow-sm"
                                    onClick={() => setShowRejectionInput(true)}
                                    disabled={isSubmitting}
                                >
                                    <AlertCircle className="w-5 h-5 mr-3" /> Refuser
                                </UnifiedButton>
                                <UnifiedButton
                                    variant="success"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-200/50 min-w-[240px] h-16 text-lg font-bold rounded-2xl active:scale-95 transition-transform"
                                    onClick={handleApprove}
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                >
                                    <Check className="w-6 h-6 mr-3 stroke-[3]" /> Approuver & Publier
                                </UnifiedButton>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Helper Components
const InfoCard = ({ icon: Icon, label, value, modified }: any) => (
    <div className={cn(
        "p-5 rounded-2xl border transition-all",
        modified ? "bg-blue-50/50 border-blue-200 shadow-sm" : "bg-slate-50 border-slate-100"
    )}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Icon className="w-3.5 h-3.5" /> {label}
            {modified && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
        </p>
        <p className={cn("text-lg font-bold", modified ? "text-blue-700" : "text-slate-800")}>
            {value || "—"}
        </p>
    </div>
);

const DetailItem = ({ icon: Icon, label, value }: any) => (
    <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Icon className="w-3.5 h-3.5" /> {label}
        </p>
        <p className="text-slate-700 font-bold">{value || "—"}</p>
    </div>
);

const StatusCard = ({ icon: Icon, label, value, isActive }: any) => (
    <div className={cn(
        "p-5 rounded-2xl border flex items-center gap-4 transition-all shadow-sm",
        isActive ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-60"
    )}>
        <div className={cn("p-2 rounded-xl", isActive ? "bg-white text-emerald-600" : "bg-slate-200 text-slate-400")}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={cn("font-bold", isActive ? "text-emerald-700" : "text-slate-500")}>{value}</p>
        </div>
    </div>
);
