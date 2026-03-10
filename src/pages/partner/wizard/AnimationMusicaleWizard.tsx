import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Save, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GildedButton } from "@/components/ui/gilded-button";

import { animationMusicaleSchema, type AnimationMusicaleFormValues } from "./animation-musicale/schema";
import IdentityStep from "./animation-musicale/steps/IdentityStep";
import SpecialtiesStep from "./animation-musicale/steps/SpecialtiesStep";
import EquipmentStep from "./animation-musicale/steps/EquipmentStep";
import PricingStep from "./animation-musicale/steps/PricingStep";
import MediaStep from "./animation-musicale/steps/MediaStep";

const STEPS = [
    { id: 1, label: "Identité" },
    { id: 2, label: "Spécialités" },
    { id: 3, label: "Matériel" },
    { id: 4, label: "Logistique" },
    { id: 5, label: "Médias" },
];

export default function AnimationMusicaleWizard() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [providerId, setProviderId] = useState<string | null>(id || null);

    const methods = useForm<AnimationMusicaleFormValues>({
        resolver: zodResolver(animationMusicaleSchema),
        defaultValues: {
            nom: "",
            category_slug: "dj_orchestre",
            wilaya_id: "",
            adresse: "",
            evenementsAccepte: [],
            description: "",
            isDJ: false,
            isOrchestra: false,
            stylesMusicaux: [],
            equipements: [],
            optionsAnimation: [],
            prixAPartirDeDA: 0,
            deplacementPossible: false,
            wilayasDeplacement: [],
            acompteDemande: false,
            cautionDemande: false,
            politiqueAnnulation: "",
            galeriePhotos: [],
            utiliserFormulaireFar7i: true,
            telephone: "",
        },
    });

    const { handleSubmit, trigger, getValues, reset, formState: { errors } } = methods;

    useEffect(() => {
        if (id) {
            fetchProviderData();
        }
    }, [id]);

    const fetchProviderData = async () => {
        try {
            setLoading(true);
            const { data: provider, error } = await supabase
                .from("providers")
                .select(`
                    *,
                    provider_media(media_url, is_main),
                    provider_music(*)
                `)
                .eq("id", id)
                .single();

            if (error) throw error;

            if (provider) {
                const music = (provider.provider_music?.[0] as any) || {};
                const mediaUrls = provider.provider_media?.map((m: any) => m.media_url) || [];

                reset({
                    nom: provider.commercial_name || "",
                    category_slug: "dj_orchestre",
                    wilaya_id: provider.wilaya_id || "",
                    adresse: provider.address || "",
                    evenementsAccepte: provider.events_accepted || [],
                    description: provider.bio || "",
                    isDJ: music.is_dj || false,
                    isOrchestra: music.is_orchestra || false,
                    stylesMusicaux: music.music_styles || [],
                    equipements: music.equipment_options || [],
                    optionsAnimation: music.animation_options || [],
                    prixAPartirDeDA: provider.base_price || 0,
                    deplacementPossible: music.deplacement_possible || (music.wilayas_deplacement?.length > 0),
                    wilayasDeplacement: music.wilayas_deplacement || [],
                    acompteDemande: music.acompte_demande || false,
                    cautionDemande: music.caution_demande || false,
                    politiqueAnnulation: music.politique_annulation || "",
                    galeriePhotos: mediaUrls,
                    utiliserFormulaireFar7i: true, // Defaulting to true as per general wizard pattern
                    telephone: provider.phone_number || "",
                });
            }
        } catch (error) {
            console.error("Error fetching provider:", error);
            toast.error("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const onNext = async () => {
        const fieldsToValidate = getFieldsForStep(step);
        const isValid = await trigger(fieldsToValidate as any);

        if (isValid) {
            if (step < STEPS.length) {
                setStep(step + 1);
                window.scrollTo(0, 0);
            } else {
                handleSubmit(onSubmit)();
            }
        } else {
            toast.error("Veuillez corriger les erreurs avant de continuer");
        }
    };

    const getFieldsForStep = (stepNumber: number) => {
        switch (stepNumber) {
            case 1: return ["nom", "wilaya_id", "evenementsAccepte"];
            case 2: return ["isDJ", "isOrchestra"];
            case 3: return ["equipements"];
            case 4: return ["prixAPartirDeDA", "wilayasDeplacement"];
            case 5: return ["galeriePhotos"];
            default: return [];
        }
    };

    const handleSaveDraft = async () => {
        const data = getValues();
        await onSubmit(data, true);
    };

    const onSubmit = async (data: AnimationMusicaleFormValues, isDraftOrEvent?: boolean | React.BaseSyntheticEvent) => {
        const isDraft = typeof isDraftOrEvent === 'boolean' ? isDraftOrEvent : false;

        if (!user) {
            toast.error("Vous devez être connecté");
            return;
        }

        try {
            setSaving(true);
            let currentProviderId = providerId;

            // 1. Upsert Provider
            const providerPayload = {
                user_id: user.id,
                commercial_name: data.nom,
                category_slug: "dj_orchestre",
                wilaya_id: data.wilaya_id,
                address: data.adresse,
                events_accepted: data.evenementsAccepte,
                bio: data.description,
                base_price: data.prixAPartirDeDA,
                phone_number: data.telephone || "",
                moderation_status: isDraft ? "incomplete" : "pending",
            };

            if (currentProviderId) {
                const { error } = await supabase
                    .from("providers")
                    .update(providerPayload as any)
                    .eq("id", currentProviderId);
                if (error) throw error;
            } else {
                const { data: newProvider, error } = await supabase
                    .from("providers")
                    .insert(providerPayload as any)
                    .select("id")
                    .single();
                if (error) throw error;
                currentProviderId = newProvider.id;
                setProviderId(currentProviderId);
            }

            // 2. Upsert Provider Music
            const musicPayload = {
                provider_id: currentProviderId,
                is_dj: data.isDJ,
                is_orchestra: data.isOrchestra,
                music_styles: data.stylesMusicaux,
                equipment_options: data.equipements,
                animation_options: data.optionsAnimation,
                acompte_demande: data.acompteDemande,
                caution_demande: data.cautionDemande,
                politique_annulation: data.politiqueAnnulation,
                wilayas_deplacement: data.wilayasDeplacement,
                deplacement_possible: data.deplacementPossible,
            };

            const { error: musicError } = await (supabase as any).from("provider_music").upsert(musicPayload);
            if (musicError) throw musicError;

            // 3. Media Sync
            if (data.galeriePhotos.length > 0) {
                await supabase.from("provider_media").delete().eq("provider_id", currentProviderId);
                const mediaPayload = data.galeriePhotos.map((url, i) => ({
                    provider_id: currentProviderId,
                    media_url: url,
                    is_main: i === 0,
                }));
                const { error: mediaError } = await supabase.from("provider_media").insert(mediaPayload as any);
                if (mediaError) throw mediaError;
            }

            toast.success(isDraft ? "Brouillon sauvegardé" : "Prestation soumise avec succès !");
            if (!isDraft) {
                navigate("/partner/dashboard/services");
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error("Erreur lors de la sauvegarde : " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#B79A63]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-12">
                {/* Stepper Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-serif text-[#1E1E1E] mb-8 text-center">Animation Musicale</h1>

                    <div className="flex items-center justify-between relative px-2">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#D4D2CF] -translate-y-1/2 z-0" />
                        {STEPS.map((s) => (
                            <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                    step === s.id ? "bg-[#B79A63] border-[#B79A63] text-white shadow-lg shadow-[#B79A63]/20 scale-110" :
                                        step > s.id ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" :
                                            "bg-white border-[#D4D2CF] text-[#D4D2CF]"
                                )}>
                                    {step > s.id ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{s.id}</span>}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest hidden md:block",
                                    step === s.id ? "text-[#B79A63]" : "text-[#1E1E1E]/40"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-[#F8F5F0] border border-[#D4D2CF] rounded-3xl overflow-hidden shadow-sm">
                    <form onSubmit={handleSubmit((d) => onSubmit(d, false))}>
                        <div className="p-8 md:p-12">
                            {step === 1 && <IdentityStep methods={methods} />}
                            {step === 2 && <SpecialtiesStep methods={methods} />}
                            {step === 3 && <EquipmentStep methods={methods} />}
                            {step === 4 && <PricingStep methods={methods} />}
                            {step === 5 && <MediaStep methods={methods} />}
                        </div>

                        {/* Actions Footer */}
                        <div className="px-8 py-6 bg-[#EBE6DA] border-t border-[#D4D2CF] flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                                className="text-xs font-bold uppercase tracking-widest text-[#1E1E1E]/60 hover:text-[#1E1E1E] transition-colors"
                            >
                                {step === 1 ? "Annuler" : "Précédent"}
                            </button>

                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={saving}
                                    className="px-6 py-3 border border-[#D4D2CF] rounded-xl text-xs font-bold uppercase tracking-widest text-[#1E1E1E] hover:border-[#B79A63] transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sauvegarder le brouillon"}
                                </button>

                                <GildedButton
                                    type="button"
                                    onClick={onNext}
                                    disabled={saving}
                                    className="min-w-[140px]"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                        step === STEPS.length ? "Soumettre" :
                                            <span className="flex items-center gap-2">Suivant <ChevronRight className="w-4 h-4" /></span>}
                                </GildedButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
