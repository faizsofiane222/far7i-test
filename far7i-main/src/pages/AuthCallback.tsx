import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getDashboardRoute } from "@/utils/auth-routing";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        // Check hash for type=recovery BEFORE supabase processes it (Implicit Flow)
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
            // It's a recovery, but we need to let Supabase process the hash first to set the session.
            // We'll trust onAuthStateChange to handle the redirect, or set a flag.
            console.log("Recovery detected in hash");
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                toast.success("Veuillez définir votre nouveau mot de passe");
                navigate("/partner/update-password", { replace: true });
            }
        });

        const handleCallback = async () => {
            // ... existing logic ...
            try {
                // Check key params
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                const type = params.get('type');

                // ALSO Check Hash params manually for 'type' because 'implicit' flow puts them there
                // URLSearchParams can parse the string after '#'
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const hashType = hashParams.get('type');

                const effectiveType = type || hashType;

                if (code) {
                    // ... PKCE logic ...
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;

                    if (data.session) {
                        if (effectiveType === 'signup' || effectiveType === 'email') {
                            toast.success("Email vérifié !");
                            navigate("/email-confirmed", { replace: true });
                        } else if (effectiveType === 'recovery') {
                            toast.success("Veuillez définir votre nouveau mot de passe");
                            navigate("/partner/update-password", { replace: true });
                        } else if (effectiveType === 'delete_account') {
                            const token = hashParams.get('token') || params.get('token');
                            navigate(`/confirm-deletion?token=${token}`, { replace: true });
                        } else {
                            toast.success("Connexion réussie !");
                            const route = await getDashboardRoute(data.session.user);
                            navigate(route, { replace: true });
                        }
                        return;
                    }
                }

                // Fallback: Check for existing session (OAuth callback or Implicit Flow)
                // Note: getSession() might consume the hash, so we checked hashType before.
                const { data, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (data.session) {
                    // Check if it was a recovery based on hash analysis
                    if (effectiveType === 'recovery') {
                        toast.success("Veuillez définir votre nouveau mot de passe");
                        navigate("/partner/update-password", { replace: true });
                        return;
                    }

                    if (effectiveType === 'signup' || effectiveType === 'email') {
                        toast.success("Email vérifié avec succès !");
                        navigate("/email-confirmed", { replace: true });
                        return;
                    }

                    toast.success("Connexion réussie !");
                    const route = await getDashboardRoute(data.session.user);
                    navigate(route, { replace: true });
                } else {
                    // If no session and no code, it might be just a page reload or invalid state
                    // throw new Error("Aucune session créée");
                }
            } catch (err: any) {
                console.error("Auth Callback Error:", err);
                // ... error handling ...
                setIsProcessing(false);
                setError(err.message);
                toast.error("Erreur d'authentification");
                setTimeout(() => navigate("/partner/auth"), 3000);
            }
        };

        handleCallback();

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    // Show error only if processing is complete and there's an error
    if (!isProcessing && error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
                <div className="text-center max-w-md p-8">
                    <div className="mb-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-[#1E1E1E] mb-4">
                        Erreur d'authentification
                    </h1>
                    <p className="text-slate-600 mb-2">{error}</p>
                    <p className="text-sm text-slate-500">Redirection vers la page de connexion...</p>
                </div>
            </div>
        );
    }

    // Always show loading state while processing (even if there's an error during redirect)
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#B79A63]" />
                <p className="text-lg font-medium text-[#1E1E1E]">Vérification en cours...</p>
                <p className="text-sm text-slate-500 mt-2">Veuillez patienter</p>
            </div>
        </div>
    );
}
