import React from "react";
import {
    X, Check, AlertCircle, Trash2, ExternalLink,
    Instagram, Facebook, Globe, Phone, MapPin,
    Calendar, User, Briefcase, Camera, MessageSquare, Info,
    Tag, ShieldCheck
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
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

    if (!item) return null;

    const pendingUpdates = item.pending_updates;
    const isNewCreation = !pendingUpdates && (item.status === 'pending' || item.status === 'incomplete');
    const isModification = !!pendingUpdates;

    const handleApprove = async () => {
        try {
            setIsSubmitting(true);
            const tableName = type === 'profile' ? 'users' : (type === 'prestation' ? 'providers' : 'reviews');
            const { error } = await (supabase as any).rpc('approve_moderation_item', {
                p_table: tableName,
                p_id: item.id
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
        if (!rejectionReason) {
            setShowRejectionInput(true);
            return;
        }

        try {
            setIsSubmitting(true);
            const tableName = type === 'profile' ? 'users' : (type === 'prestation' ? 'providers' : 'reviews');
            const { error } = await (supabase as any).rpc('reject_moderation_item', {
                p_table: tableName,
                p_id: item.id,
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

    // Helper to determine if a field is modified
    const isFieldModified = (key: string) => {
        if (!isModification || !pendingUpdates) return false;
        const oldVal = item[key];
        const newVal = pendingUpdates[key];

        // Deep compare for simple values
        if (typeof oldVal !== typeof newVal) return true;
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) return true;
        return false;
    };

    const RenderField = ({ label, icon: Icon, value, updatedValue, fieldKey, isLongText = false }: any) => {
        const modified = isModification && isFieldModified(fieldKey);

        return (
            <div className={cn(
                "p-4 rounded-2xl border transition-all duration-300 mb-4",
                modified ? "bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-100" : "bg-white border-slate-100"
            )}>
                <div className="flex items-center gap-2 mb-2">
                    {Icon && <Icon className="w-4 h-4 text-[#B79A63]" />}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
                    {modified && (
                        <UnifiedBadge status="pending" size="sm" className="ml-2 animate-pulse bg-amber-100 text-amber-700">MODIFIÉ</UnifiedBadge>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Colonne Gauche: Actuel (si modification) ou Seule (si nouveau) */}
                    <div className={cn(!isModification ? "md:col-span-2" : "")}>
                        {!isModification ? (
                            <div className={cn("text-slate-800", isLongText ? "whitespace-pre-wrap leading-relaxed" : "font-medium")}>
                                {value || <span className="text-slate-300 italic">Non renseigné</span>}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Version Actuelle</span>
                                <div className={cn("text-slate-500 line-through opacity-60", isLongText ? "whitespace-pre-wrap text-sm" : "font-medium")}>
                                    {value || "Vide"}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Colonne Droite: Nouveau (uniquement si modification) */}
                    {isModification && (
                        <div className="space-y-1 border-l border-amber-100 pl-8">
                            <span className="text-[10px] font-bold text-amber-600 uppercase">Nouvelle Version</span>
                            <div className={cn("text-slate-900", isLongText ? "whitespace-pre-wrap leading-relaxed" : "font-bold text-lg")}>
                                {updatedValue || <span className="text-slate-300 italic">Supprimé</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const GallerySection = ({ currentGallery = [], updatedGallery = [] }: any) => {
        const modified = isModification && JSON.stringify(currentGallery) !== JSON.stringify(updatedGallery);

        return (
            <div className={cn(
                "p-6 rounded-3xl border mb-8",
                modified ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"
            )}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-[#B79A63]" />
                        <h3 className="font-serif font-bold text-xl text-slate-800">Galerie Photos</h3>
                        {modified && <UnifiedBadge status="pending" className="bg-amber-100 text-amber-700">Média Modifié</UnifiedBadge>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Galerie Actuelle */}
                    {isModification && (
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actuelle ({currentGallery.length})</p>
                            <div className="grid grid-cols-3 gap-2 opacity-50">
                                {currentGallery.map((m: any, i: number) => (
                                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200">
                                        <img src={m.media_url || m} className="w-full h-full object-cover" alt="" />
                                    </div>
                                ))}
                                {currentGallery.length === 0 && <div className="col-span-3 py-8 text-center text-slate-300 italic">Aucune photo</div>}
                            </div>
                        </div>
                    )}

                    {/* Galerie Nouvelle / Seule */}
                    <div className={cn("space-y-4", !isModification ? "md:col-span-2" : "border-l border-amber-100 pl-12")}>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                            {isModification ? "Nouvelle Sélection" : "Photos soumises"} ({updatedGallery.length})
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {updatedGallery.map((m: any, i: number) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-lg group relative">
                                    <img src={m.media_url || m} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                    {(m.is_main || i === 0) && (
                                        <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">PRINCIPALE</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-[90%] sm:max-w-[90%] p-0 bg-[#F8F5F0] border-l-0">
                <div className="flex flex-col h-full relative font-lato">

                    {/* Header Sticky */}
                    <div className="sticky top-0 z-50 bg-[#1E1E1E] text-white p-6 shadow-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#B79A63]/20 rounded-2xl">
                                {type === 'profile' ? <User className="w-6 h-6 text-[#B79A63]" /> : <Briefcase className="w-6 h-6 text-[#B79A63]" />}
                            </div>
                            <div>
                                <SheetTitle className="text-white font-serif text-2xl">
                                    Révision : {item.commercial_name || item.display_name}
                                </SheetTitle>
                                <SheetDescription className="text-slate-400 capitalize">
                                    {type} • {isNewCreation ? "Nouvelle Inscription" : "Mise à jour de données"}
                                </SheetDescription>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Area de scroll */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-12 pb-48">
                        <div className="max-w-6xl mx-auto space-y-12">

                            {/* Section Identité */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <ShieldCheck className="w-5 h-5 text-[#B79A63]" />
                                    <h3 className="font-serif font-bold text-2xl text-slate-800">Informations Clés</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <RenderField
                                        label="Nom / Enseigne"
                                        icon={Briefcase}
                                        fieldKey="commercial_name"
                                        value={item.commercial_name || item.display_name}
                                        updatedValue={pendingUpdates?.commercial_name}
                                    />
                                    <RenderField
                                        label="Bio / Description"
                                        icon={Info}
                                        fieldKey="bio"
                                        isLongText
                                        value={item.bio}
                                        updatedValue={pendingUpdates?.bio}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <RenderField
                                            label="Prix de base"
                                            icon={Tag}
                                            fieldKey="base_price"
                                            value={item.base_price ? `${item.base_price} DZD` : null}
                                            updatedValue={pendingUpdates?.base_price ? `${pendingUpdates.base_price} DZD` : null}
                                        />
                                        <RenderField
                                            label="Type"
                                            icon={User}
                                            fieldKey="provider_type"
                                            value={item.provider_type}
                                            updatedValue={pendingUpdates?.provider_type}
                                        />
                                        <RenderField
                                            label="Expérience"
                                            icon={Calendar}
                                            fieldKey="years_of_experience"
                                            value={item.years_of_experience ? `${item.years_of_experience} ans` : null}
                                            updatedValue={pendingUpdates?.years_of_experience ? `${pendingUpdates.years_of_experience} ans` : null}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section Meedias (Exclusivement pour les prestations) */}
                            {type === 'prestation' && (
                                <GallerySection
                                    currentGallery={item.gallery || []}
                                    updatedGallery={pendingUpdates?.gallery || item.gallery || []}
                                />
                            )}

                            {/* Section Contact & Social */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <Phone className="w-5 h-5 text-[#B79A63]" />
                                    <h3 className="font-serif font-bold text-2xl text-slate-800">Contact & Réseaux</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RenderField
                                        label="Téléphone"
                                        icon={Phone}
                                        fieldKey="phone_number"
                                        value={item.phone_number}
                                        updatedValue={pendingUpdates?.phone_number}
                                    />
                                    <RenderField
                                        label="Instagram / Social"
                                        icon={Instagram}
                                        fieldKey="social_link"
                                        value={item.social_link}
                                        updatedValue={pendingUpdates?.social_link}
                                    />
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Footer Sticky - Action Bar */}
                    <div className="fixed bottom-0 left-[10%] right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-between z-[60]">
                        <div className="flex items-center gap-6">
                            <UnifiedButton
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50"
                                onClick={() => {/* handle delete */ }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                            </UnifiedButton>

                            {showRejectionInput && (
                                <div className="animate-in slide-in-from-left-4 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Raison du refus..."
                                        className="w-80 h-10 rounded-xl border border-orange-200 px-4 text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        autoFocus
                                    />
                                    <UnifiedButton
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleReject}
                                        loading={isSubmitting}
                                    >
                                        Confirmer le refus
                                    </UnifiedButton>
                                    <button onClick={() => setShowRejectionInput(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {!showRejectionInput && (
                            <div className="flex items-center gap-4">
                                <UnifiedButton
                                    variant="secondary"
                                    className="bg-orange-500 hover:bg-orange-600 text-[#1E1E1E] min-w-[140px]"
                                    onClick={() => setShowRejectionInput(true)}
                                    disabled={isSubmitting}
                                >
                                    <AlertCircle className="w-4 h-4 mr-2" /> Refuser
                                </UnifiedButton>
                                <UnifiedButton
                                    variant="success"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 min-w-[180px] h-14 text-lg font-bold"
                                    onClick={handleApprove}
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                >
                                    <Check className="w-5 h-5 mr-2" /> Approuver & Publier
                                </UnifiedButton>
                            </div>
                        )}
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
}
