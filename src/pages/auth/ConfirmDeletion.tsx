import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { GildedButton } from "@/pages/partner/components/GildedButton";
import { SplitScreenLayout } from "@/pages/partner/components/SplitScreenLayout";
import { toast } from "sonner";

export default function ConfirmDeletion() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState<string>("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMsg("Lien invalide ou expiré.");
            return;
        }

        const confirmDeletion = async () => {
            try {
                const { data, error } = await (supabase as any).rpc("confirm_account_deletion", {
                    token_val: token
                });

                if (error) throw error;

                if (data) {
                    setStatus("success");
                    // Supprimer la session locale au cas où
                    await supabase.auth.signOut();
                } else {
                    setStatus("error");
                    setErrorMsg("Le lien de confirmation est invalide ou a déjà été utilisé.");
                }
            } catch (err: any) {
                console.error("Deletion confirmation error:", err);
                setStatus("error");
                setErrorMsg(err.message || "Une erreur est survenue lors de la suppression.");
            }
        };

        confirmDeletion();
    }, [token]);

    return (
        <SplitScreenLayout>
            <div className="flex flex-col items-center text-center max-w-lg mx-auto py-12">
                {status === "loading" && (
                    <>
                        <Loader2 className="w-16 h-16 text-[#B79A63] animate-spin mb-6" />
                        <h1 className="text-3xl font-serif font-bold text-[#1E1E1E] mb-4">
                            Suppression en cours...
                        </h1>
                        <p className="text-slate-600">
                            Veuillez patienter pendant que nous traitons votre demande.
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-[#1E1E1E] mb-4">
                            Compte supprimé
                        </h1>
                        <p className="text-slate-600 mb-8 font-sans">
                            Votre compte et toutes vos données ont été définitivement supprimés de Far7i.
                        </p>
                        <GildedButton onClick={() => navigate("/")} className="w-full">
                            Retour à l'accueil
                        </GildedButton>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-[#1E1E1E] mb-4">
                            Erreur de suppression
                        </h1>
                        <p className="text-red-600 mb-8 font-sans">
                            {errorMsg}
                        </p>
                        <GildedButton onClick={() => navigate("/")} className="w-full">
                            Retour à l'accueil
                        </GildedButton>
                    </>
                )}
            </div>
        </SplitScreenLayout>
    );
}
