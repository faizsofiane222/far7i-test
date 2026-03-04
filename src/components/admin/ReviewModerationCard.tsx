import { CheckCircle, XCircle, Star, User, Calendar } from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
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

interface ReviewModerationCardProps {
    review: any;
    onApprove: (reviewId: string) => Promise<void>;
    onReject: (reviewId: string, reason: string) => Promise<void>;
}

export function ReviewModerationCard({ review, onApprove, onReject }: ReviewModerationCardProps) {
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await onApprove(review.id);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setLoading(true);
        try {
            await onReject(review.id, rejectReason);
            setShowRejectDialog(false);
            setRejectReason("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl border-2 border-[#D4D2CF] p-6 hover:border-[#B79A63] transition-all shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-[#B79A63]" />
                            <span className="font-bold text-[#1E1E1E]">
                                {review.users?.display_name || 'Utilisateur'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating
                                            ? 'fill-[#B79A63] text-[#B79A63]'
                                            : 'text-[#D4D2CF]'
                                        }`}
                                />
                            ))}
                            <span className="ml-2 text-sm font-bold text-[#1E1E1E]/60">
                                {review.rating}/5
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase whitespace-nowrap">
                        En attente
                    </span>
                </div>

                {/* Provider Info */}
                <div className="mb-4 p-3 bg-[#F8F5F0] rounded-lg">
                    <div className="text-xs text-[#1E1E1E]/60 mb-1">Prestataire concerné</div>
                    <div className="font-bold text-[#1E1E1E]">
                        {review.providers?.commercial_name || 'Prestataire'}
                    </div>
                </div>

                {/* Review Content */}
                {review.comment && (
                    <div className="mb-4">
                        <p className="text-sm text-[#1E1E1E] leading-relaxed">
                            "{review.comment}"
                        </p>
                    </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-[#1E1E1E]/60 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>Publié le {new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <GildedButton
                        onClick={handleApprove}
                        disabled={loading}
                        className="flex-1 h-10 text-sm"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approuver
                    </GildedButton>
                    <button
                        onClick={() => setShowRejectDialog(true)}
                        disabled={loading}
                        className="flex-1 h-10 text-sm font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Rejeter
                    </button>
                </div>
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-[#FDFCFB]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Rejeter l'avis</DialogTitle>
                        <DialogDescription>
                            Indiquez la raison du rejet. L'utilisateur recevra cette information.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ex: Contenu inapproprié, spam, hors sujet, etc."
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
                            disabled={!rejectReason.trim() || loading}
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
