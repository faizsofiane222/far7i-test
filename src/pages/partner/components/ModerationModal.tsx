import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GildedButton } from "@/components/ui/gilded-button";
import { PartyPopper, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: {
        type: string;
        title: string;
        message: string;
    };
}

export function ModerationModal({ isOpen, onClose, notification }: ModerationModalProps) {
    const isSuccess = notification.type.includes('approved') || notification.type.includes('updated');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-[#FDFCFB] border-[#B79A63]/20">
                <DialogHeader className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center animate-bounce",
                        isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                        {isSuccess ? <PartyPopper className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                    </div>
                    <DialogTitle className="font-serif text-2xl font-bold text-[#1E1E1E]">
                        {notification.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#1E1E1E]/70 font-lato leading-relaxed px-4">
                        {notification.message}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Statut</p>
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm",
                        isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                        {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {isSuccess ? "Validé & Publié" : "Modifications requises"}
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <GildedButton
                        onClick={onClose}
                        className="w-full sm:w-48 h-12"
                    >
                        {isSuccess ? "C'est génial !" : "Compris, je m'en occupe"}
                    </GildedButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
