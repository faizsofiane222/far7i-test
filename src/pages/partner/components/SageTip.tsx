import * as React from "react";
import { Lightbulb, Info, Sparkles, AlertCircle, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

interface SageTipProps {
    tipId: keyof typeof SAGE_TIPS;
    variant?: "info" | "warning" | "success" | "tip";
    className?: string;
}

export const SAGE_TIPS = {
    // DASHBOARD
    completion: {
        title: "Le calcul est mathématique : 100% = Top Visibilité.",
        body: "Notre système classe les prestataires par score de complétion. Un profil incomplet est automatiquement relayé en bas de page. Remplissez chaque champ pour battre le score et passer devant vos concurrents."
    },
    // SERVICE EDITOR
    service_title: {
        title: "Personnalisez votre Titre",
        body: "Un titre professionnel aide les clients à vous identifier immédiatement. Nous recommandons d'inclure votre spécialité et votre nom commercial (ex: Photographe + Votre Nom) pour une mémorisation maximale."
    },
    // PROFILE
    commercial_name: {
        title: "Votre Nom Commercial",
        body: "Utilisez le nom sous lequel vos clients vous connaissent. Évitez les majuscules inutiles pour garder un aspect professionnel et haut de gamme."
    },
    slug: {
        title: "SEO & URL Personnalisée",
        body: "Ce lien (ex: far7i.com/p/votre-nom) est votre identité numérique. Une fois choisi, évitez de le changer car il sera indexé par Google pour vous apporter du trafic hors-plateforme."
    },
    bio: {
        title: "L'art du Storytelling",
        body: "Les clients n'achètent pas un service, ils achètent une émotion. Utilisez cet espace pour raconter votre passion, votre style et ce qui vous rend unique sur le marché algérien."
    },
    expertise: {
        title: "Ciblage Précis",
        body: "Plus vous êtes précis dans vos domaines d'expertise, plus nous pouvons vous envoyer des prospects qualifiés qui cherchent exactement ce que vous proposez."
    },
    location: {
        title: "Ne soyez pas invisible.",
        body: "Notre moteur de recherche est strict. Même si vous acceptez de vous déplacer, si vous ne cochez pas les Wilayas cibles (ex: Alger + Blida) dans cette liste, vous n'apparaitrez jamais dans les recherches de ces villes. Cochez large pour être vu."
    },
    // SERVICE EDITOR
    service_category: {
        title: "Structure de l'Algorithme",
        body: "Chaque catégorie possède des filtres spécifiques. Choisir la bonne catégorie assure que vos futurs clients trouvent votre service via les filtres de prix et de style."
    },
    service_media: {
        title: "Impact Visuel",
        body: "Une photo de haute qualité augmente le taux de clic de 300%. Utilisez des photos lumineuses et évitez les montages avec trop de texte qui polluent l'image."
    },
    service_pricing: {
        title: "Transparence & Confiance",
        body: "Les prestataires affichant un prix de base clair reçoivent 2x plus de demandes. C'est un gage de professionnalisme qui rassure immédiatement le client sur votre gamme de service."
    },
    service_pitch: {
        title: "L'Accroche Commerciale",
        body: "Cette courte phrase apparaît sur votre carte de prix. Soyez percutant : les mariés choisissent 3x plus souvent les offres détaillées. Résumez la valeur ajoutée de ce pack."
    },
    service_inclusions: {
        title: "Détails qui Comptent",
        body: "Listez tout ce qui est inclus. Chaque ligne ajoutée ici réduit le nombre de questions que le client devra vous poser par téléphone, accélérant ainsi la réservation."
    },
    options: {
        title: "Parlez la langue de l'Algorithme.",
        body: "Notre algorithme scanne vos options comme des mots-clés. Ajoutez des options spécifiques (ex: Drone, Zorna, Facture Pro) pour capturer des recherches précises et augmenter votre panier moyen."
    },
    faq: {
        title: "Gagnez du temps de support.",
        body: "Répondez ici aux doutes fréquents (avances, déplacements, délais). Un client bien informé est un client qui réserve sans hésiter, libérant votre temps pour votre métier."
    }
};

export function SageTip({ tipId, variant = "tip", className }: SageTipProps) {
    const tip = SAGE_TIPS[tipId];
    if (!tip) return null;

    const icons = {
        info: Info,
        warning: AlertCircle,
        success: Sparkles,
        tip: Lightbulb
    };

    const Icon = icons[variant] || Lightbulb;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95",
                        variant === "tip" && "bg-[#B79A63]/10 text-[#B79A63] hover:bg-[#B79A63] hover:text-white",
                        variant === "info" && "bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white",
                        variant === "warning" && "bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white",
                        variant === "success" && "bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white",
                        className
                    )}
                >
                    <Icon className="w-3.5 h-3.5" />
                    <span>Conseil</span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 border-[#B79A63]/20 bg-white shadow-2xl rounded-3xl overflow-hidden sm:rounded-3xl">
                <div className="p-1 bg-gradient-to-r from-[#B79A63] to-[#D4AF37]" />
                <div className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[#B79A63]">
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Le Conseil du Sage</span>
                        </div>
                        <DialogClose asChild>
                            <button className="p-2 hover:bg-[#F8F5F0] rounded-full transition-colors">
                                <X className="w-4 h-4 text-[#1E1E1E]/40" />
                            </button>
                        </DialogClose>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-serif font-bold text-xl text-[#1E1E1E] leading-tight">
                            {tip.title}
                        </h4>
                        <div className="w-12 h-1 bg-[#B79A63] rounded-full" />
                        <p className="font-lato text-base text-[#1E1E1E]/70 leading-relaxed">
                            {tip.body}
                        </p>
                    </div>

                    <div className="bg-[#F8F5F0] p-4 rounded-2xl border border-[#D4D2CF]/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#B79A63]/60 uppercase tracking-tighter">
                            <Zap className="w-3.5 h-3.5" />
                            Optimisation Far7i V1
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
