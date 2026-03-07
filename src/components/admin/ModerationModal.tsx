import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { UnifiedBadge, UnifiedButton } from "@/components/unified";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    CheckCircle, XCircle, Trash2, AlertCircle,
    ArrowRight, ShieldCheck, History, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'profile' | 'prestation' | 'review';
    data: any;
    onRefresh: () => void;
}

export function ModerationModal({ isOpen, onClose, type, data, onRefresh }: ModerationModalProps) {
    const [loading, setLoading] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    if (!data) return null;

    const handleApprove = async () => {
        try {
            setLoading(true);
            const tableName = type === 'profile' ? 'users' : (type === 'prestation' ? 'providers' : 'reviews');
            const { error } = await (supabase as any).rpc('approve_moderation_item', {
                p_table: tableName,
                p_id: data.id
            });

            if (error) throw error;
            toast.success("Élément approuvé avec succès");
            onRefresh();
            onClose();
        } catch (error: any) {
            console.error("Error approving item:", error);
            toast.error("Échec de l'approbation");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Veuillez fournir une raison pour le refus");
            return;
        }

        try {
            setLoading(true);
            const tableName = type === 'profile' ? 'users' : (type === 'prestation' ? 'providers' : 'reviews');
            const { error } = await (supabase as any).rpc('reject_moderation_item', {
                p_table: tableName,
                p_id: data.id,
                p_reason: rejectionReason
            });

            if (error) throw error;
            toast.success("Élément refusé");
            onRefresh();
            onClose();
        } catch (error: any) {
            console.error("Error rejecting item:", error);
            toast.error("Échec du refus");
        } finally {
            setLoading(false);
            setRejecting(false);
        }
    };

    const renderComparisonFields = () => {
        const current = data;
        const pending = data.pending_updates;
        const isFirstTime = !pending && current.status === 'pending';

        // Fields to compare based on type
        let fields: string[] = [];
        if (type === 'profile') {
            fields = ['display_name', 'email'];
        } else if (type === 'prestation') {
            fields = ['commercial_name', 'category_slug', 'phone_number', 'social_link'];
        }

        const displayFields = pending ? Array.from(new Set([...Object.keys(pending), ...fields])) : fields;

        return (
            <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto pr-2 pb-4">
                {/* Left: Current Version */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4 sticky top-0 bg-white">
                        <History className="w-4 h-4 text-slate-400" />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Version Actuelle</h3>
                    </div>

                    {isFirstTime ? (
                        <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 text-slate-400 p-6 text-center">
                            <Info className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">Première soumission.<br />Aucune version précédente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayFields.map(field => (
                                <div key={`current-${field}`} className="group">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 px-1">{field.replace('_', ' ')}</label>
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600 font-medium">
                                        {String(current[field] || '—')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: New Submission */}
                <div className="space-y-4 border-l border-slate-100 pl-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-blue-100 mb-4 sticky top-0 bg-white">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-blue-500">Nouvelle Soumission</h3>
                    </div>

                    <div className="space-y-4">
                        {displayFields.map(field => {
                            const value = pending ? (pending[field] || current[field]) : current[field];
                            const isChanged = pending && pending[field] !== undefined && pending[field] !== current[field];

                            return (
                                <div key={`new-${field}`} className="group">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 px-1">{field.replace('_', ' ')}</label>
                                    <div className={cn(
                                        "p-3 border rounded-xl text-sm font-bold transition-all",
                                        isChanged
                                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                            : "bg-slate-50 border-slate-100 text-slate-700"
                                    )}>
                                        {String(value || '—')}
                                        {isChanged && <span className="ml-2 text-[9px] bg-blue-200 px-1 rounded">MODIFIÉ</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <DialogHeader className="p-6 bg-[#1E1E1E] text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="font-serif text-2xl flex items-center gap-3">
                                Modération {type === 'profile' ? 'Profil' : (type === 'prestation' ? 'Prestation' : 'Avis')}
                                <UnifiedBadge status={data.status as any} size="md" className="bg-[#B79A63] text-black border-none" />
                            </DialogTitle>
                            <p className="text-white/60 text-sm mt-1">Comparez les modifications et prenez une décision.</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-8 bg-white">
                    {type === 'review' ? (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-lg text-slate-800">{data.client_name}</span>
                                    <div className="flex text-yellow-500">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i} className={cn("text-xl", i < data.rating ? "fill-current" : "opacity-30")}>★</span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-600 italic leading-relaxed">"{data.comment}"</p>
                            </div>
                        </div>
                    ) : renderComparisonFields()}
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50 flex-col sm:flex-row gap-4 shrink-0">
                    {rejecting ? (
                        <div className="flex-1 flex gap-3 animate-in slide-in-from-right-4 duration-300">
                            <input
                                autoFocus
                                className="flex-1 px-4 rounded-xl border-2 border-orange-200 focus:border-orange-500 outline-none text-sm transition-all shadow-inner bg-white"
                                placeholder="Indiquez la raison du refus..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <UnifiedButton variant="danger" size="md" onClick={handleReject} loading={loading}>
                                Confirmer Refus
                            </UnifiedButton>
                            <UnifiedButton variant="ghost" size="md" onClick={() => setRejecting(false)}>
                                Annuler
                            </UnifiedButton>
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-between">
                            <div className="flex gap-3">
                                <UnifiedButton
                                    variant="danger"
                                    size="md"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    className="bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white"
                                >
                                    Supprimer
                                </UnifiedButton>
                            </div>
                            <div className="flex gap-3">
                                <UnifiedButton
                                    variant="secondary"
                                    size="md"
                                    icon={<XCircle className="w-4 h-4" />}
                                    onClick={() => setRejecting(true)}
                                    className="border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white"
                                >
                                    Refuser
                                </UnifiedButton>
                                <UnifiedButton
                                    variant="primary"
                                    size="md"
                                    icon={<CheckCircle className="w-4 h-4" />}
                                    onClick={handleApprove}
                                    loading={loading}
                                    className="bg-green-600 text-white border-none hover:bg-green-700 shadow-lg shadow-green-100"
                                >
                                    Valider
                                </UnifiedButton>
                            </div>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
