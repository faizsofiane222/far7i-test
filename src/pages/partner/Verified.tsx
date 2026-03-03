import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function PartnerVerified() {
    const { session, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect to auth if not logged in
    useEffect(() => {
        if (!loading && !session) {
            navigate("/partner/auth", { replace: true });
        }
    }, [session, loading, navigate]);

    // Show loader while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
                <Loader2 className="h-8 w-8 animate-spin text-[#B79A63]" />
            </div>
        );
    }

    // Don't render if not authenticated
    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Success Card with Green Border */}
                <div className="bg-white rounded-lg border-2 border-emerald-500 shadow-lg overflow-hidden">
                    {/* Animated Checkmark */}
                    <div className="bg-gradient-to-br from-emerald-50 to-white pt-12 pb-8 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 rounded-full mb-6 animate-bounce">
                            <CheckCircle2 className="w-16 h-16 text-emerald-600" strokeWidth={2.5} />
                        </div>

                        {/* Success Title */}
                        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#1E1E1E] mb-4">
                            Inscription Confirmée
                        </h1>

                        {/* Success Message */}
                        <p className="font-sans text-lg text-slate-600 max-w-md mx-auto px-4">
                            Votre compte partenaire est maintenant actif. Bienvenue chez Far7i.
                        </p>
                    </div>

                    {/* User Info Section */}
                    <div className="bg-[#FAF9F6] px-8 py-6 border-t border-emerald-100">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-[#B79A63]/10 rounded-full flex items-center justify-center">
                                <span className="text-xl font-serif font-bold text-[#B79A63]">
                                    {session.user?.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="text-left">
                                <p className="font-sans text-sm text-slate-500">Compte activé pour</p>
                                <p className="font-sans text-base font-medium text-[#1E1E1E]">
                                    {session.user?.email}
                                </p>
                            </div>
                        </div>

                        {/* Benefits List */}
                        <div className="bg-white rounded-lg p-6 mb-6 border border-emerald-100">
                            <h3 className="font-serif text-lg font-semibold text-[#1E1E1E] mb-4">
                                Prochaines étapes :
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "Complétez votre profil professionnel",
                                    "Ajoutez vos services et tarifs",
                                    "Téléchargez vos plus belles réalisations",
                                    "Commencez à recevoir des demandes",
                                ].map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-emerald-600 text-sm font-bold">{idx + 1}</span>
                                        </div>
                                        <span className="font-sans text-sm text-slate-600">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={() => navigate("/partner/dashboard")}
                            className="w-full py-4 px-6 bg-[#1E1E1E] text-white rounded-md hover:bg-[#B79A63] hover:text-[#1E1E1E] transition-all duration-300 font-sans font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            Accéder à mon Dashboard
                        </button>

                        <p className="text-center text-xs text-slate-500 mt-4">
                            Vous pourrez personnaliser votre espace à tout moment
                        </p>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="text-center mt-8">
                    <p className="font-sans text-sm text-slate-500">
                        Besoin d'aide ? Consultez notre{" "}
                        <a href="/guide" className="text-[#B79A63] hover:underline">
                            guide de démarrage
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
