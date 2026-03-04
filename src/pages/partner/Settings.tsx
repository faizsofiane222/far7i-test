import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    Lock,
    ShieldCheck,
    ChevronRight,
    Loader2,
    Eye,
    EyeOff,
    Mail,
    Send,
    AlertTriangle,
    Check
} from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function Settings() {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deletePassword1, setDeletePassword1] = useState("");
    const [deletePassword2, setDeletePassword2] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) throw new Error("Impossible de récupérer votre email.");

            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/callback`,
            });

            if (error) throw error;

            toast.success("Email de réinitialisation envoyé !");
            setEmailSent(true);
        } catch (error: any) {
            console.error("Reset error:", error);
            toast.error(`Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deleteConfirm) {
            toast.error("Veuillez cocher la case de confirmation");
            return;
        }

        setIsDeleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non authentifié");

            // 1. Request deletion token
            const { data: token, error: rpcError } = await (supabase as any).rpc('request_account_deletion');
            if (rpcError) throw rpcError;

            // 2. Call Edge Function to send email
            const { error: funcError } = await supabase.functions.invoke('send-deletion-email', {
                body: {
                    email: user.email,
                    token: token,
                    origin: window.location.origin
                }
            });

            if (funcError) throw funcError;

            toast.success("Un email de confirmation vous a été envoyé. Veuillez cliquer sur le lien pour supprimer votre compte.");
            setDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Deletion request error:", error);
            toast.error(`Erreur: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1E1E1E]">Paramètres & Sécurité</h1>
                <p className="text-[#1E1E1E]/60 font-lato text-sm md:text-base">
                    Gérez vos informations de connexion et sécurisez votre compte.
                </p>
            </div>

            <div className="space-y-8 max-w-2xl mx-auto">

                {/* Main Settings Form */}
                <div className="space-y-8">
                    <section className="bg-white rounded-2xl border border-[#D4D2CF] shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 space-y-8">
                            <div className="flex items-center gap-3 border-b border-[#F8F5F0] pb-6">
                                <Lock className="w-5 h-5 text-[#B79A63]" />
                                <h2 className="text-xl font-serif font-semibold text-[#1E1E1E]">Changer le mot de passe</h2>
                            </div>

                            {emailSent ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-800">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <Send className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Email envoyé !</h3>
                                            <p className="text-sm">Vérifiez votre boîte de réception.</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-emerald-700/80">
                                        Un lien de réinitialisation a été envoyé à votre adresse email.
                                        Cliquez dessus pour définir votre nouveau mot de passe en toute sécurité.
                                    </p>
                                    <button
                                        onClick={() => setEmailSent(false)}
                                        className="text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 underline"
                                    >
                                        Renvoyer l'email
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-[#1E1E1E]/60 leading-relaxed max-w-xl">
                                        Pour des raisons de sécurité, la modification du mot de passe nécessite une vérification par email.
                                        Cliquez sur le bouton ci-dessous pour recevoir un lien de réinitialisation sécurisé.
                                    </p>

                                    <GildedButton
                                        onClick={handleResetPassword}
                                        className="w-full md:w-auto px-8 py-6"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Envoi en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="w-4 h-4 mr-2" />
                                                Envoyer le lien de réinitialisation
                                            </>
                                        )}
                                    </GildedButton>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-red-50/30 rounded-2xl border border-red-100 p-8 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider">Zone de danger</h3>
                            <p className="text-xs text-red-700/60">
                                La suppression de votre compte est irréversible. Toutes vos prestations et avis seront supprimés.
                            </p>
                        </div>
                        <button
                            onClick={() => setDeleteModalOpen(true)}
                            className="text-[10px] uppercase font-bold tracking-widest text-red-600 hover:text-red-700 transition-colors"
                        >
                            Supprimer mon compte partenaire
                        </button>
                    </section>
                </div>
            </div>

            {/* Delete Account Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-red-200 rounded-3xl bg-white shadow-xl">
                    <DialogHeader>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <DialogTitle className="font-serif text-2xl text-red-900">Suppression du compte</DialogTitle>
                        <DialogDescription className="text-red-700/60 font-lato">
                            Cette action est définitive. Vous perdrez l'accès à votre profil, vos services et vos avis.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDeleteAccount} className="space-y-6 pt-4">
                        <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-red-100">
                            <Checkbox
                                id="confirm"
                                checked={deleteConfirm}
                                onCheckedChange={(val) => setDeleteConfirm(val as boolean)}
                                className="mt-1 border-red-300 data-[state=checked]:bg-red-600"
                            />
                            <Label htmlFor="confirm" className="text-xs font-semibold leading-relaxed text-red-800 cursor-pointer">
                                Je confirme vouloir supprimer définitivement mon compte et toutes mes données associées.
                            </Label>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-red-900/60">Saisir votre mot de passe</Label>
                                <GildedInput
                                    type="password"
                                    value={deletePassword1}
                                    onChange={(e) => setDeletePassword1(e.target.value)}
                                    className="border-red-100 focus:ring-red-500"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-red-900/60">Saisir à nouveau pour confirmer</Label>
                                <GildedInput
                                    type="password"
                                    value={deletePassword2}
                                    onChange={(e) => setDeletePassword2(e.target.value)}
                                    className="border-red-100 focus:ring-red-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 h-12 rounded-xl border border-[#D4D2CF] text-[#1E1E1E] font-bold text-sm hover:bg-white transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isDeleting}
                                className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
