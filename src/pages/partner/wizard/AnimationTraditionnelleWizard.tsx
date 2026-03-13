import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { animationTraditionnelleSchema, type AnimationTraditionnelleFormValues } from "./animation-traditionnelle/schema";
import IdentityStep from "./animation-traditionnelle/steps/IdentityStep";
import SpecialtiesStep from "./animation-traditionnelle/steps/SpecialtiesStep";
import LogisticsStep from "./animation-traditionnelle/steps/LogisticsStep";
import PricingStep from "./animation-traditionnelle/steps/PricingStep";
import MediaStep from "./animation-traditionnelle/steps/MediaStep";

const STEPS = [
    { id: 1, label: "Identité" },
    { id: 2, label: "Spécialités" },
    { id: 3, label: "Logistique" },
    { id: 4, label: "Tarification" },
    { id: 5, label: "Médias" },
];

export default function AnimationTraditionnelleWizard() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [providerId, setProviderId] = useState<string | null>(id || null);

    const methods = useForm<AnimationTraditionnelleFormValues>({
        resolver: zodResolver(animationTraditionnelleSchema),
        defaultValues: {
            commercial_name: "",
            category_slug: "animation_musicale_traditionnelle",
            wilaya_id: "",
            address: "",
            events_accepted: [],
            bio: "",
            hasZorna: false,
            hasKarkabou: false,
            hasBendir: false,
            hasAutre: false,
            autreAnimationSpecifiez: "",
            deplacementPossible: false,
            wilayasDeplacement: [],
            prixAPartirDeDA: 0,
            acompteMontantDA: 0,
            politiqueAnnulation: "",
            media: [],
            formulaire_far7i: true,
            phone: "",
        },
    });

    const { handleSubmit, trigger, getValues, reset } = methods;

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
                    commercial_name: provider.commercial_name || "",
                    category_slug: "animation_musicale_traditionnelle",
                    wilaya_id: provider.wilaya_id || "",
                    address: provider.address || "",
                    events_accepted: provider.events_accepted || [],
                    bio: provider.bio || "",
                    hasZorna: music.has_zorna || false,
                    hasKarkabou: music.has_karkabou || false,
                    hasBendir: music.has_bendir || false,
                    hasAutre: music.has_autre || false,
                    autreAnimationSpecifiez: music.autre_specifiez || "",
                    prixAPartirDeDA: provider.base_price || 0,
                    acompteMontantDA: music.acompte_montant || 0,
                    deplacementPossible: music.deplacement_possible || (music.wilayas_deplacement?.length > 0),
                    wilayasDeplacement: music.wilayas_deplacement || [],
                    politiqueAnnulation: music.politique_annulation || "",
                    media: mediaUrls,
                    formulaire_far7i: true,
                    phone: provider.phone_number || "",
                });
            }
        } catch (error) {
            console.error("Error fetching provider:", error);
            toast.error("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const getFieldsForStep = (stepNumber: number): (keyof AnimationTraditionnelleFormValues)[] => {
        switch (stepNumber) {
            case 1: return ["commercial_name", "wilaya_id", "events_accepted"];
            case 2: return ["hasZorna", "hasKarkabou", "hasBendir", "hasAutre", "autreAnimationSpecifiez"];
            case 3: return ["deplacementPossible", "wilayasDeplacement"];
            case 4: return ["prixAPartirDeDA", "acompteMontantDA", "politiqueAnnulation"];
            case 5: return ["media", "phone", "formulaire_far7i"];
            default: return [];
        }
    };

    const onNext = async () => {
        const fieldsToValidate = getFieldsForStep(step);
        const isValid = await trigger(fieldsToValidate);

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

    const handleSaveDraft = async () => {
        const data = getValues();
        await onSubmit(data, true);
    };

    const onSubmit = async (data: AnimationTraditionnelleFormValues, isDraftOrEvent?: boolean | React.BaseSyntheticEvent) => {
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
                commercial_name: data.commercial_name,
                category_slug: "animation_musicale_traditionnelle",
                wilaya_id: data.wilaya_id,
                address: typeof data.address === 'string' ? data.address : data.address.address,
                events_accepted: data.events_accepted,
                bio: data.bio,
                base_price: data.prixAPartirDeDA,
                phone_number: data.phone || "",
                moderation_status: isDraft ? "draft" : "pending",
                last_saved_step: isDraft ? step : null,
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

            // 2. Upsert Provider Music (using custom fields for traditional music)
            const musicPayload = {
                provider_id: currentProviderId,
                has_zorna: data.hasZorna,
                has_karkabou: data.hasKarkabou,
                has_bendir: data.hasBendir,
                has_autre: data.hasAutre,
                autre_specifiez: data.autreAnimationSpecifiez,
                acompte_montant: data.acompteMontantDA,
                politique_annulation: data.politiqueAnnulation,
                wilayas_deplacement: data.wilayasDeplacement,
                deplacement_possible: data.deplacementPossible,
            };

            const { error: musicError } = await (supabase as any).from("provider_music").upsert(musicPayload);
            if (musicError) {
                console.warn("Possible schema mismatch for provider_music depending on migration status", musicError);
            }

            // 3. Media Sync
            if (data.media && data.media.length > 0) {
                await supabase.from("provider_media").delete().eq("provider_id", currentProviderId);
                const mediaPayload = data.media.map((url, i) => ({
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
        <div className="min-h-screen bg-[#FDFCFB] pb-24 font-lato">
            <div className="max-w-4xl mx-auto px-4 pt-12">
                {/* Stepper Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-serif text-[#1E1E1E] mb-8 text-center">Animation Traditionnelle (Zorna, Karkabou...)</h1>

                    <div className="flex items-center justify-between relative px-2">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#D4D2CF] -translate-y-1/2 z-0" />
                        {STEPS.map((s) => (
                            <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                    step === s.id ? "bg-[#B79A63] border-[#B79A63] text-white shadow-lg shadow-[#B79A63]/20 scale-110" :
                                        step > s.id ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" :
                                            "bg-[#F8F5F0] border-[#D4D2CF] text-[#D4D2CF]"
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
                    <FormProvider {...methods}>
                        <form onSubmit={(e) => { e.preventDefault(); }}>
                            <div className="p-8 md:p-12">
                                {step === 1 && <IdentityStep />}
                                {step === 2 && <SpecialtiesStep />}
                                {step === 3 && <LogisticsStep />}
                                {step === 4 && <PricingStep />}
                                {step === 5 && <MediaStep />}
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

                                <div className="flex gap-4">
                                    {step < STEPS.length && (
                                        <button
                                            type="button"
                                            onClick={handleSaveDraft}
                                            disabled={saving}
                                            className="px-6 py-2.5 rounded-full font-bold text-sm bg-transparent border border-[#D4D2CF] text-[#1E1E1E] hover:border-[#B79A63] hover:text-[#B79A63] transition-all flex items-center"
                                        >
                                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Sauvegarder le brouillon
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onNext}
                                        disabled={saving}
                                        className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#1E1E1E] text-white hover:bg-[#B79A63] transition-all flex items-center"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {step === STEPS.length ? "Soumettre pour validation" : "Suivant"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
}
