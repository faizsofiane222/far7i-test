import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Home } from "lucide-react";
import { VenueSpecifics } from "./specifics/VenueSpecifics";
import { MusicSpecifics } from "./specifics/MusicSpecifics";
import { CateringSpecifics } from "./specifics/CateringSpecifics";
import { RentalSpecifics } from "./specifics/RentalSpecifics";
import { BeautySpecifics } from "./specifics/BeautySpecifics";

export const Step2_Specifics = () => {
    const { categorySlug } = useOnboardingStore();

    return (
        <div className="space-y-10">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-[#1E1E1E]">Configuration de votre Profil</h2>
                <p className="text-[#1E1E1E]/60 mt-2">Détaillez vos services pour donner plus d'éléments de décision aux mariés.</p>
            </div>

            <div className="py-12 px-6 text-center bg-[#F8F5F0] rounded-2xl border border-[#D4D2CF] animate-in fade-in max-w-xl mx-auto">
                <Home className="w-12 h-12 text-[#B79A63]/50 mx-auto mb-4" />
                <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">Interface Premium</h3>
                <p className="text-[#1E1E1E]/70 font-sans leading-relaxed">
                    Afin de mettre en valeur votre prestation de manière optimale, une <b>interface complète sur-mesure</b> vous sera proposée dans votre espace "Mes Prestations" juste après cette étape d'inscription !
                </p>
            </div>
        </div>
    );
};
