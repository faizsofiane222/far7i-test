import { GildedButton } from "@/components/ui/gilded-button";
import { Check, X, Info, ExternalLink, ImageIcon, Eye } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface NewServiceCardProps {
    service: any;
    onApprove: (id: string) => void;
    onReject: (id: string, reason: string) => void;
}

export function NewServiceCard({ service, onApprove, onReject }: NewServiceCardProps) {
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        onReject(service.id, rejectReason);
        setShowRejectDialog(false);
        setRejectReason("");
    };

    return (
        <>
            <div className="bg-white p-6 rounded-2xl border border-[#D4D2CF] hover:border-[#B79A63] transition-all shadow-sm group">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-[#D4D2CF]">
                            {service.media && service.media.length > 0 ? (
                                <img
                                    src={service.media[0]}
                                    alt={service.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-slate-300" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-[#1E1E1E] group-hover:text-[#B79A63] transition-colors line-clamp-1">
                                {service.title}
                            </h3>
                            <p className="text-xs text-slate-500">
                                Par : {service.providers?.commercial_name || 'Inconnu'}
                            </p>
                            <span className="inline-block text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap mt-1">
                                Nouveau Service
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-sm text-[#1E1E1E]/70 line-clamp-2 italic">
                        {service.short_pitch || 'Pas d\'accroche'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Créé le {new Date(service.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowRejectDialog(true)}
                        className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <X className="w-3 h-3" />
                        Rejeter
                    </button>
                    <GildedButton
                        onClick={() => onApprove(service.id)}
                        className="flex-1 h-9 text-[10px]"
                    >
                        <Check className="w-3 h-3 mr-1" />
                        Approuver
                    </GildedButton>
                </div>

                {/* View Full Service Link */}
                {service.provider_id && (
                    <a
                        href={`/admin/providers/${service.provider_id}/services/${service.id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 text-xs text-[#B79A63] hover:text-[#8B7355] transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Voir la prestation
                    </a>
                )}
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-[#FDFCFB]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Rejeter le service</DialogTitle>
                        <DialogDescription>
                            Indiquez la raison du rejet de ce service.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ex: Photos non conformes, description inappropriée..."
                        className="min-h-[100px]"
                    />
                    <DialogFooter>
                        <button
                            onClick={() => setShowRejectDialog(false)}
                            className="px-4 py-2 text-sm font-bold text-[#1E1E1E]/60 hover:text-[#1E1E1E] transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={!rejectReason.trim()}
                            className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            Confirmer le Rejet
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
