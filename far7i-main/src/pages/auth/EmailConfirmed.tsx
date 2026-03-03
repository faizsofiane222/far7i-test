import { Link } from "react-router-dom";
import { CheckCircle2, User } from "lucide-react";
import { GildedButton } from "@/pages/partner/components/GildedButton";
import { SplitScreenLayout } from "@/pages/partner/components/SplitScreenLayout";

export default function EmailConfirmed() {
    return (
        <SplitScreenLayout>
            <div className="flex flex-col items-center text-center max-w-lg mx-auto py-12">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>

                <h1 className="text-3xl font-serif font-bold text-[#1E1E1E] mb-4">
                    Compte activé avec succès !
                </h1>

                <p className="text-slate-600 mb-8 max-w-md">
                    Votre adresse e-mail a bien été vérifiée. Vous pouvez désormais vous connecter à votre Espace Partenaire et commencer à configurer votre vitrine.
                </p>

                <div className="w-full max-w-sm space-y-4">
                    <Link to="/partner/auth" className="w-full flex">
                        <GildedButton className="w-full">
                            <User className="w-5 h-5 mr-2" />
                            Se connecter à mon espace
                        </GildedButton>
                    </Link>
                </div>
            </div>
        </SplitScreenLayout>
    );
}
