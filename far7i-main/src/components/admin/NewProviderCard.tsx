import { CheckCircle, XCircle, User, MapPin, Calendar, ExternalLink } from "lucide-react";
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

interface NewProviderCardProps {
    provider: any;
    onApprove: (providerId: string) => Promise<void>;
    onReject: (providerId: string, reason: string) => Promise<void>;
}

export function NewProviderCard({ provider, onApprove, onReject }: NewProviderCardProps) {
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await onApprove(provider.id);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setLoading(true);
        try {
            await onReject(provider.id, rejectReason);
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
                    <div className="flex items-center gap-3">
                        {provider.profile_picture_url ? (
                            <img
                                src={provider.profile_picture_url}
                                alt={provider.commercial_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#B79A63]"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[#B79A63]/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-[#B79A63]" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-[#1E1E1E]">{provider.commercial_name}</h3>
                            <p className="text-xs text-[#1E1E1E]/60">
                                {provider.provider_type === 'agency' ? 'Agence' : 'Individuel'}
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase">
                        Nouveau
                    </span>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4 text-sm">
                    {provider.phone_number && (
                        <div className="flex items-center gap-2 text-[#1E1E1E]/60">
                            <User className="w-4 h-4" />
                            <span>{provider.phone_number}</span>
                        </div>
                    )}
                    {provider.wilayas && (
                        <div className="flex items-center gap-2 text-[#1E1E1E]/60">
                            <MapPin className="w-4 h-4" />
                            <span>{provider.wilayas.name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-[#1E1E1E]/60">
                        <Calendar className="w-4 h-4" />
                        <span>Créé le {new Date(provider.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>

                {/* Bio Preview */}
                {provider.bio && (
                    <div className="mb-4 p-3 bg-[#F8F5F0] rounded-lg">
                        <p className="text-xs text-[#1E1E1E]/80 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: provider.bio }}
                        />
                    </div>
                )}

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

                {/* View Full Profile Link */}
                <a
                    href={`/admin/providers/${provider.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 text-xs text-[#B79A63] hover:text-[#8B7355] transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                    Voir le profil complet
                </a>
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-[#FDFCFB]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Rejeter le prestataire</DialogTitle>
                        <DialogDescription>
                            Indiquez la raison du rejet. Le prestataire recevra cette information.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ex: Informations incomplètes, photos manquantes, etc."
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
