import React, { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GildedButton } from "@/components/ui/gilded-button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ModificationDiffProps {
    originalData: any;
    pendingData: any;
    onApprove: () => void;
    onReject: (reason: string) => void;
    labels?: Record<string, string>; // Map field keys to readable labels
}

export function ModificationDiff({ originalData, pendingData, onApprove, onReject, labels }: ModificationDiffProps) {
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // Identify changed keys
    const allKeys = new Set([...Object.keys(pendingData || {})]);
    const changes: string[] = [];
    const IGNORED_KEYS = ['updated_at', 'created_at', 'id', 'user_id', 'provider_id', 'moderation_status', 'pending_changes', 'modification_submitted'];

    allKeys.forEach(key => {
        if (IGNORED_KEYS.includes(key)) return;

        // Simple equality check
        if (JSON.stringify(originalData?.[key]) !== JSON.stringify(pendingData?.[key])) {
            changes.push(key);
        }
    });

    if (changes.length === 0) {
        return <div className="p-4 text-center text-slate-400">Aucune modification détectée (Mise à jour technique uniquement).</div>;
    }

    const handleReject = () => {
        onReject(rejectReason);
        setShowRejectDialog(false);
        setRejectReason("");
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {changes.map(key => (
                    <div key={key} className="bg-white border border-[#D4D2CF] rounded-lg overflow-hidden">
                        <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#D4D2CF] flex justify-between items-center">
                            <span className="font-bold text-[#1E1E1E] text-sm uppercase tracking-wider">
                                {labels?.[key] || key}
                            </span>
                        </div>
                        <div className="flex flex-col md:grid md:grid-cols-[1fr,auto,1fr] divide-y md:divide-y-0 md:divide-x divide-[#D4D2CF]">
                            {/* Original */}
                            <div className="p-4 bg-red-50/30">
                                <div className="text-[10px] text-red-400 font-bold uppercase mb-1">Avant</div>
                                <div className="text-sm text-[#1E1E1E]/70 break-all whitespace-pre-wrap font-mono">
                                    {renderValue(key, originalData?.[key])}
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center justify-center p-2 bg-[#F8F5F0] text-[#B79A63]">
                                <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                            </div>

                            {/* New */}
                            <div className="p-4 bg-emerald-50/30">
                                <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Après</div>
                                <div className="text-sm text-[#1E1E1E] break-all whitespace-pre-wrap font-medium font-mono">
                                    {renderValue(key, pendingData?.[key])}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D2CF]">
                <button
                    onClick={() => setShowRejectDialog(true)}
                    className="flex items-center px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-100 transition-colors"
                >
                    <X className="w-4 h-4 mr-2" />
                    Rejeter
                </button>
                <GildedButton onClick={onApprove} className="h-10 px-6">
                    <Check className="w-4 h-4 mr-2" />
                    Valider les changements
                </GildedButton>
            </div>

            {/* Reject Reason Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-[#FDFCFB]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Rejeter les modifications</DialogTitle>
                        <DialogDescription>
                            Indiquez la raison du rejet de ces modifications.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ex: Informations imprécises, photos de mauvaise qualité..."
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
        </div>
    );
}

function renderValue(key: string, val: any): React.ReactNode {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">—</span>;
    if (typeof val === 'boolean') return <span>{val ? "Oui" : "Non"}</span>;

    // Detect images
    const isImageUrl = typeof val === 'string' && (
        val.startsWith('http') ||
        val.startsWith('/') ||
        val.includes('supabase.co/storage') ||
        val.includes('blob:')
    );
    const isImageArray = Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && (
        val[0].startsWith('http') ||
        val[0].startsWith('/') ||
        val[0].includes('supabase.co/storage') ||
        val[0].includes('blob:')
    );

    const isMediaField = key.toLowerCase().includes('url') ||
        key.toLowerCase().includes('image') ||
        key.toLowerCase().includes('photo') ||
        key.toLowerCase() === 'media';

    if (isMediaField) {
        if (isImageUrl) {
            return (
                <div className="mt-2 rounded-lg overflow-hidden border border-[#D4D2CF] max-w-[200px]">
                    <img src={val} alt="Preview" className="w-full h-auto object-cover" />
                </div>
            );
        }
        if (isImageArray) {
            return (
                <div className="mt-2 grid grid-cols-2 gap-2 max-w-[300px]">
                    {val.map((url: string, idx: number) => (
                        <div key={idx} className="aspect-square rounded-md overflow-hidden border border-[#D4D2CF]">
                            <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            );
        }
    }

    // Special rendering for relations
    if (key === 'inclusions' && Array.isArray(val)) {
        return (
            <div className="space-y-1 mt-1">
                {val.map((inc: any, idx: number) => (
                    <div key={idx} className="text-[11px] flex items-center gap-2">
                        <span className={cn("px-1 rounded", inc.inclusion_type === 'included' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700")}>
                            {inc.inclusion_type === 'included' ? '✓' : inc.inclusion_type === 'optional' ? '?' : 'x'}
                        </span>
                        <span>{inc.item_text}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (key === 'options' && Array.isArray(val)) {
        return (
            <div className="space-y-2 mt-1">
                {val.map((opt: any, idx: number) => (
                    <div key={idx} className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="font-bold flex justify-between">
                            <span>{opt.title}</span>
                            <span className="text-[#B79A63]">{opt.price} DZD</span>
                        </div>
                        <div className="text-slate-500 italic">{opt.description}</div>
                    </div>
                ))}
            </div>
        );
    }

    if (key === 'faqs' && Array.isArray(val)) {
        return (
            <div className="space-y-2 mt-1">
                {val.map((faq: any, idx: number) => (
                    <div key={idx} className="text-[11px]">
                        <div className="font-bold text-slate-700">Q: {faq.question}</div>
                        <div className="text-slate-600">R: {faq.answer}</div>
                    </div>
                ))}
            </div>
        );
    }

    if (typeof val === 'object') return <pre className="text-[10px] bg-slate-100 p-2 rounded whitespace-pre-wrap break-all">{JSON.stringify(val, null, 2)}</pre>;

    return <span>{String(val)}</span>;
}
