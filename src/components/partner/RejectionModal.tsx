import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, ArrowRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function RejectionModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [notifId, setNotifId] = useState<string | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const checkRejection = async () => {
            const { data: notifications } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'provider_rejected')
                .eq('read', false)
                .order('created_at', { ascending: false })
                .limit(1);

            if (notifications && notifications.length > 0) {
                const notif = notifications[0];
                setRejectionReason(notif.message.split('Raison du rejet: ')[1] || notif.message);
                setNotifId(notif.id);
                setIsOpen(true);
            }
        };

        checkRejection();
    }, [user]);

    const handleClose = async () => {
        if (notifId) {
            await supabase.rpc('mark_notification_read', { notification_id: notifId });
        }
        setIsOpen(false);
    };

    const handleAction = () => {
        handleClose();
        navigate("/partner/dashboard/profile");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md rounded-2xl border-[#D4D2CF] shadow-2xl p-0 overflow-hidden">
                <div className="bg-red-50 p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-red-100">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-red-900">Validation Requise</DialogTitle>
                        <DialogDescription className="text-red-700 font-medium">
                            Votre profil nécessite quelques ajustements avant d'être publié.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="p-6 space-y-6 bg-white">
                    <div className="bg-[#FAF9F6] border border-[#D4D2CF]/50 rounded-xl p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/40 mb-2">Message de l'administrateur :</h4>
                        <p className="text-sm text-[#1E1E1E] leading-relaxed italic">
                            "{rejectionReason}"
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handleAction}
                            className="w-full h-12 rounded-xl bg-[#1E1E1E] hover:bg-black text-white font-bold group"
                        >
                            Corriger mon Profil
                            <Pencil className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="w-full text-xs text-slate-400 hover:text-slate-600"
                        >
                            Plus tard
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
