import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { GildedButton } from "./components/GildedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SplitScreenLayout } from "./components/SplitScreenLayout";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // First, check if the email exists in our records using the secure RPC
            const { data: exists, error: searchError } = await supabase
                .rpc("check_user_exists", { email_to_check: email.toLowerCase().trim() });

            if (searchError) throw searchError;

            if (!exists) {
                toast.error("Cet email n'est pas enregistré dans notre base de données partenaires.");
                setIsLoading(false);
                return;
            }

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/partner/update-password`,
            });

            if (error) throw error;

            setEmailSent(true);
            toast.success("Email de réinitialisation envoyé !");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'envoi de l'email");
        } finally {
            setIsLoading(false);
        }
    };

    // Success State
    if (emailSent) {
        return (
            <SplitScreenLayout>
                <div className="space-y-6">
                    {/* Green Success Frame */}
                    <div className="bg-white border-2 border-emerald-500 rounded-lg p-8 shadow-lg">
                        {/* Success Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Mail className="w-10 h-10 text-emerald-600" />
                            </div>
                        </div>

                        {/* Success Message */}
                        <div className="text-center space-y-4 mb-6">
                            <h1 className="font-serif text-3xl font-bold text-emerald-700">
                                Email envoyé !
                            </h1>
                            <p className="text-slate-700 font-sans text-lg">
                                Un lien de réinitialisation a été envoyé à
                            </p>
                            <p className="font-sans text-xl font-semibold text-emerald-600">
                                {email}
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-lg">📧</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-sans text-sm font-semibold text-emerald-900 mb-2">
                                        Prochaines étapes :
                                    </p>
                                    <ol className="space-y-2 font-sans text-sm text-slate-700">
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">1.</span>
                                            <span>Consultez votre boîte email</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">2.</span>
                                            <span>Cliquez sur le lien <strong>"Réinitialiser mon mot de passe"</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">3.</span>
                                            <span>Définissez votre nouveau mot de passe</span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6">
                            <GildedButton
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate("/partner/auth")}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Retour à la connexion
                            </GildedButton>
                        </div>
                    </div>
                </div>
            </SplitScreenLayout>
        );
    }

    // Request Form
    return (
        <SplitScreenLayout>
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-[#1E1E1E] mb-2">
                        Mot de passe oublié ?
                    </h1>
                    <p className="text-slate-600 font-sans">
                        Entrez votre email pour recevoir un lien de réinitialisation
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-[#FAF9F6] border-[#D4D2CF] focus:border-[#B79A63] focus:ring-[#B79A63]"
                        />
                    </div>

                    <GildedButton
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                    </GildedButton>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => navigate("/partner/auth")}
                        className="text-sm text-slate-600 hover:text-[#B79A63] transition-colors inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Retour à la connexion
                    </button>
                </div>
            </div>
        </SplitScreenLayout>
    );
}
