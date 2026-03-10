import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    ChevronLeft,
    Save,
    Image as ImageIcon,
    X,
    Plus,
    Check,
    Loader2,
    Utensils,
    Users,
    Truck,
    Clock,
    DollarSign,
    Sparkles,
    ArrowRight
} from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { compressAndUpload } from "@/lib/image-utils";
import { useWilayas } from "@/hooks/useWilayas";

// @ts-ignore
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Removed hardcoded WILAYAS, now using useWilayas hook

const EVENT_TYPES = [
    { id: "mariage", label: "Mariage" },
    { id: "fiancailles", label: "Fiançailles" },
    { id: "naissance", label: "Naissance" },
    { id: "circoncision", label: "Circoncision" },
    { id: "anniversaire", label: "Anniversaire" },
    { id: "reussite", label: "Fête de réussite" },
    { id: "soutenance", label: "Soutenance" },
    { id: "entreprise", label: "B2B / Entreprise" }
];

const CUISINE_TYPES = [
    { id: "traditionnelle", label: "Traditionnelle Algérienne" },
    { id: "moderne", label: "Moderne / Fusion" },
    { id: "orientale", label: "Orientale" },
    { id: "internationale", label: "Internationale" }
];

const RESTAURATION_SALE = [
    { id: "buffet", label: "Buffet Chaud / Froid" },
    { id: "cocktail", label: "Cocktail dînatoire" },
    { id: "repas_table", label: "Repas servi à table" }
];

const RESTAURATION_SUCRE = [
    { id: "desserts", label: "Plateaux de Desserts" },
    { id: "patisserie", label: "Pâtisserie Fine" },
    { id: "gateaux_trad", label: "Gâteaux Traditionnels" }
];

export default function CateringEditor({ isNewProp }: { isNewProp?: boolean }) {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isOnboarding = searchParams.get('onboarding') === 'true';
    const { wilayas } = useWilayas();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    // Identifiant du prestataire (provider)
    const providerId = id;

    const [baseData, setBaseData] = useState({
        commercial_name: "",
        category_slug: "traiteur",
        wilaya_id: "",
        address: "",
        events_accepted: [] as string[],
        bio: "",
    });

    const [cateringData, setCateringData] = useState({
        capacity_min: 0,
        capacity_max: 0,
        cuisine_types: [] as string[],
        restoration_types_sale: [] as string[],
        restoration_types_sucre: [] as string[],
        menus_types: "",
        formules_personnalisables: "",
        delivery_possible: false,
        service_on_site: false,
        staff_service: false,
        staff_maitre_hotel: false,
        rent_dishes: false,
        rent_cutlery: false,
        rent_tablecloths: false,
        setup_table_dressing: false,
        setup_simple_decor: false,
        cleaning_post_event: false,
        dietary_allergies_management: false,
        base_price: 0,
        acompte_demande: "",
        politique_annulation: "",
    });

    const [media, setMedia] = useState<string[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    useEffect(() => {
        if (user && providerId) {
            fetchProviderData();
        } else {
            setLoading(false);
        }
    }, [user, providerId]);

    const fetchProviderData = async () => {
        try {
            setLoading(true);
            const { data: provider, error } = await supabase
                .from("providers")
                .select(`
                    id, commercial_name, category_slug, wilaya_id, address, 
                    events_accepted, bio, base_price,
                    moderation_status, last_saved_step,
                    provider_catering (*),
                    provider_media (media_url, is_main)
                `)
                .eq("id", providerId)
                .single();

            if (provider) {
                setBaseData({
                    commercial_name: provider.commercial_name || "",
                    category_slug: provider.category_slug || "traiteur",
                    wilaya_id: provider.wilaya_id || null,
                    address: provider.address || "",
                    events_accepted: provider.events_accepted || [],
                    bio: provider.bio || "",
                });

                if (provider.provider_catering) {
                    const catering = provider.provider_catering as any;
                    setCateringData(prev => ({
                        ...prev,
                        ...catering,
                        base_price: provider.base_price || 0
                    }));
                }

                if (provider.provider_media) {
                    setMedia(provider.provider_media.map((m: any) => m.media_url));
                }

                if (provider.moderation_status === "incomplete" || provider.moderation_status === "draft") {
                    setStep(provider.last_saved_step || 1);
                } else {
                    setStep(1); // Default to start for published/pending records
                }
            }
        } catch (error: any) {
            console.error("Error fetching provider:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!baseData.commercial_name.trim()) { toast.error("Le nom est obligatoire"); setStep(1); return; }
        await handleSave(false, true);
    }

    const handleSave = async (silent = false, isDraft: boolean = false) => {
        if (!baseData.commercial_name.trim()) {
            toast.error("Le nom est obligatoire");
            return;
        }

        try {
            if (!silent) setSaving(true);

            let currentProviderId = providerId;

            // 1. Update or Insert Providers
            const providerPayload = {
                commercial_name: baseData.commercial_name,
                category_slug: baseData.category_slug,
                wilaya_id: baseData.wilaya_id || null,
                address: baseData.address,
                events_accepted: baseData.events_accepted,
                bio: baseData.bio,
                base_price: cateringData.base_price,
                moderation_status: isDraft ? "draft" : "pending",
                last_saved_step: isDraft ? step : null,
            };

            if (currentProviderId) {
                const { error: pError } = await supabase
                    .from('providers')
                    .update(providerPayload)
                    .eq('id', currentProviderId);

                if (pError) throw pError;
            } else if (user) {
                const { data: newP, error: pError } = await supabase
                    .from('providers')
                    .insert({
                        user_id: user.id,
                        phone_number: "", // Mandatory
                        ...providerPayload
                    })
                    .select('id')
                    .single();

                if (pError) throw pError;
                currentProviderId = newP.id;
            }

            if (!currentProviderId) throw new Error("Erreur d'identifiant prestataire");

            // 2. Upsert Catering Specifics
            const { error: cError } = await supabase
                .from('provider_catering')
                .upsert({
                    provider_id: currentProviderId,
                    capacity_min: cateringData.capacity_min,
                    capacity_max: cateringData.capacity_max,
                    cuisine_types: cateringData.cuisine_types,
                    restoration_types_sale: cateringData.restoration_types_sale,
                    restoration_types_sucre: cateringData.restoration_types_sucre,
                    menus_types: cateringData.menus_types,
                    formules_personnalisables: cateringData.formules_personnalisables,
                    delivery_possible: cateringData.delivery_possible,
                    service_on_site: cateringData.service_on_site,
                    staff_service: cateringData.staff_service,
                    staff_maitre_hotel: cateringData.staff_maitre_hotel,
                    rent_dishes: cateringData.rent_dishes,
                    rent_cutlery: cateringData.rent_cutlery,
                    rent_tablecloths: cateringData.rent_tablecloths,
                    setup_table_dressing: cateringData.setup_table_dressing,
                    setup_simple_decor: cateringData.setup_simple_decor,
                    cleaning_post_event: cateringData.cleaning_post_event,
                    dietary_allergies_management: cateringData.dietary_allergies_management,
                    acompte_demande: cateringData.acompte_demande,
                    politique_annulation: cateringData.politique_annulation,
                });

            if (cError) throw cError;

            // 3. Media
            await supabase.from('provider_media').delete().eq('provider_id', providerId);
            if (media.length > 0) {
                const mediaInserts = media.map((url, idx) => ({
                    provider_id: providerId,
                    media_url: url,
                    is_main: idx === 0,
                    sort_order: idx
                }));
                await supabase.from('provider_media').insert(mediaInserts);
            }

            if (!silent) {
                toast.success(isDraft ? "Brouillon sauvegardé" : "Offre enregistrée !");
                if (!isDraft) {
                    if (isOnboarding) {
                        navigate('/partner/dashboard?success=catering_ready');
                    } else {
                        navigate('/partner/dashboard/services');
                    }
                }
            }
        } catch (error: any) {
            console.error("Save error:", error);
            if (!silent) toast.error("Erreur de sauvegarde");
        } finally {
            if (!silent) setSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!user || !files || files.length === 0) return;
        setUploadingMedia(true);
        try {
            const newMedia = [...media];
            for (let i = 0; i < files.length; i++) {
                if (newMedia.length >= 8) break;
                const { publicUrl, error: uploadError } = await compressAndUpload(
                    files[i],
                    user.id,
                    { folder: providerId || user.id }
                );
                if (uploadError) throw uploadError;
                newMedia.push(publicUrl);
            }
            setMedia(newMedia);
            toast.success("Photos ajoutées");
        } catch (e) {
            toast.error("Erreur upload");
        } finally {
            setUploadingMedia(false);
        }
    };

    if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#B79A63]" /></div>;

    const steps = [
        { num: 1, label: "Identité" },
        { num: 2, label: "Description" },
        { num: 3, label: "Galerie" },
        { num: 4, label: "Capacité" },
        { num: 5, label: "Menu" },
        { num: 6, label: "Services" },
        { num: 7, label: "Tarifs" },
        { num: 8, label: "Conditions" },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-36 md:pb-32 px-4">
            {/* Header & Stepper */}
            <div className="space-y-8 mb-12 mt-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F8F5F0] rounded-full text-[#1E1E1E]/40 hover:text-[#B79A63] transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">Configuration : Traiteur</h1>
                        <p className="text-sm text-[#1E1E1E]/60 mt-1">Détaillez votre offre de restauration événementielle.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D4D2CF] -translate-y-1/2 z-0" />
                    {steps.map((s) => (
                        <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                            <button
                                onClick={() => setStep(s.num)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    step === s.num ? "bg-[#B79A63] border-[#B79A63] text-white shadow-lg" :
                                        step > s.num ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" :
                                            "bg-white border-[#D4D2CF] text-[#D4D2CF]"
                                )}
                            >
                                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                            </button>
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider hidden md:block", step === s.num ? "text-[#B79A63]" : step > s.num ? "text-[#1E1E1E]" : "text-[#D4D2CF]")}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-[#D4D2CF] p-8 md:p-10 shadow-sm min-h-[500px] mb-8 relative overflow-hidden">

                {/* Visual Flair */}
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Utensils className="w-32 h-32" />
                </div>

                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-6 flex items-center gap-2">
                                <Check className="w-5 h-5 text-[#B79A63]" /> 1. Identité du service
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Nom commercial *</Label>
                                    <GildedInput value={baseData.commercial_name} onChange={e => setBaseData({ ...baseData, commercial_name: e.target.value })} placeholder="Ex: Excellence Traiteur" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Wilaya *</Label>
                                    <select value={baseData.wilaya_id} onChange={e => setBaseData({ ...baseData, wilaya_id: e.target.value })} className="w-full h-11 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] px-4 font-lato text-sm focus:ring-1 focus:ring-[#B79A63] outline-none">
                                        <option value="">Sélectionnez</option>
                                        {wilayas.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#F8F5F0]">
                            <Label className="text-sm font-bold text-[#1E1E1E] mb-4 block">Événements acceptés</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {EVENT_TYPES.map(ev => (
                                    <button key={ev.id} onClick={() => {
                                        const exits = baseData.events_accepted.includes(ev.id);
                                        setBaseData({ ...baseData, events_accepted: exits ? baseData.events_accepted.filter(x => x !== ev.id) : [...baseData.events_accepted, ev.id] });
                                    }} className={cn("px-3 py-2 rounded-xl border text-xs font-bold transition-all", baseData.events_accepted.includes(ev.id) ? "border-[#B79A63] bg-[#F8F5F0] text-[#B79A63]" : "border-[#D4D2CF] text-[#1E1E1E]/40 hover:border-[#1E1E1E]/20")}>
                                        {ev.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2 — Description */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">2. Description <span className="text-[#B79A63] font-normal">(optionnelle)</span></h2>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Présentation / Bio</Label>
                            <textarea value={baseData.bio} onChange={e => setBaseData({ ...baseData, bio: e.target.value })} rows={6} className="w-full bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl p-4 text-sm font-lato focus:ring-1 focus:ring-[#B79A63] outline-none resize-none" placeholder="Décrivez votre savoir-faire culinaire..." />
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-[#F8F5F0] rounded-xl border border-[#D4D2CF]/50">
                            <span className="text-[#B79A63] text-xs">&#9432;</span>
                            <p className="text-xs text-[#1E1E1E]/60 leading-relaxed">Ce champ est facultatif. Il permet aux clients de comprendre votre style et votre expertise culinaire.</p>
                        </div>
                    </div>
                )}


                {/* STEP 4 — Capacité */}
                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">2. Capacités de réception</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F8F5F0]/50 p-6 rounded-2xl border border-[#D4D2CF]/40">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/40 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Couverts Min.
                                </Label>
                                <GildedInput type="number" value={cateringData.capacity_min} onChange={e => setCateringData({ ...cateringData, capacity_min: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/40 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Couverts Max.
                                </Label>
                                <GildedInput type="number" value={cateringData.capacity_max} onChange={e => setCateringData({ ...cateringData, capacity_max: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5 — Menu (Expertise Culinaire) */}
                {step === 5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2 text-center md:text-left">3. Expertise Culinaire</h2>

                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Types de cuisine</Label>
                            <div className="flex flex-wrap gap-2">
                                {CUISINE_TYPES.map(it => (
                                    <button key={it.id} onClick={() => {
                                        const exits = cateringData.cuisine_types.includes(it.id);
                                        setCateringData({ ...cateringData, cuisine_types: exits ? cateringData.cuisine_types.filter(x => x !== it.id) : [...cateringData.cuisine_types, it.id] });
                                    }} className={cn("px-4 py-2 rounded-full border text-xs font-bold transition-all", cateringData.cuisine_types.includes(it.id) ? "bg-[#1E1E1E] text-white border-[#1E1E1E]" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/40")}>
                                        {it.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase tracking-widest text-[#B79A63]">Prestations Salées</Label>
                                {RESTAURATION_SALE.map(it => (
                                    <label key={it.id} className="flex items-center gap-3 p-4 rounded-xl border border-[#D4D2CF] hover:border-[#B79A63] transition-all cursor-pointer bg-white group">
                                        <input type="checkbox" checked={cateringData.restoration_types_sale.includes(it.id)} onChange={() => {
                                            const exits = cateringData.restoration_types_sale.includes(it.id);
                                            setCateringData({ ...cateringData, restoration_types_sale: exits ? cateringData.restoration_types_sale.filter(x => x !== it.id) : [...cateringData.restoration_types_sale, it.id] });
                                        }} className="w-5 h-5 accent-[#B79A63]" />
                                        <span className="text-sm font-medium">{it.label}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase tracking-widest text-[#B79A63]">Prestations Sucrées</Label>
                                {RESTAURATION_SUCRE.map(it => (
                                    <label key={it.id} className="flex items-center gap-3 p-4 rounded-xl border border-[#D4D2CF] hover:border-[#B79A63] transition-all cursor-pointer bg-white group">
                                        <input type="checkbox" checked={cateringData.restoration_types_sucre.includes(it.id)} onChange={() => {
                                            const exits = cateringData.restoration_types_sucre.includes(it.id);
                                            setCateringData({ ...cateringData, restoration_types_sucre: exits ? cateringData.restoration_types_sucre.filter(x => x !== it.id) : [...cateringData.restoration_types_sucre, it.id] });
                                        }} className="w-5 h-5 accent-[#B79A63]" />
                                        <span className="text-sm font-medium">{it.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#F8F5F0]">
                            <Label className="text-sm font-bold text-[#1E1E1E] mb-4 block">Détails des menus & personnalisation</Label>
                            <div className="prose-editor">
                                <ReactQuill theme="snow" value={cateringData.menus_types} onChange={(val: string) => setCateringData({ ...cateringData, menus_types: val })} placeholder="Exemple de menu royal..." className="bg-[#F8F5F0] rounded-xl overflow-hidden border border-[#D4D2CF]" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 6 — Services */}
                {step === 6 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">4. Logistique & Services</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'delivery_possible', label: 'Livraison à domicile', icon: <Truck className="w-4 h-4" /> },
                                { id: 'service_on_site', label: 'Service complet sur place', icon: <Utensils className="w-4 h-4" /> },
                                { id: 'staff_service', label: 'Serveurs qualifiés', icon: <Check className="w-4 h-4" /> },
                                { id: 'rent_dishes', label: 'Location vaisselle', icon: <Check className="w-4 h-4" /> },
                                { id: 'setup_table_dressing', label: 'Dressage & Décoration', icon: <Check className="w-4 h-4" /> },
                                { id: 'cleaning_post_event', label: 'Nettoyage post-événement', icon: <Check className="w-4 h-4" /> }
                            ].map(it => (
                                <button key={it.id} onClick={() => setCateringData({ ...cateringData, [it.id]: !((cateringData as any)[it.id]) })} className={cn("flex items-center gap-3 p-5 rounded-2xl border transition-all text-left", (cateringData as any)[it.id] ? "bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-md" : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/60")}>
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", (cateringData as any)[it.id] ? "bg-[#B79A63]" : "bg-white")}>
                                        {it.icon}
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-wider">{it.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 7 — Tarifs */}
                {step === 7 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">5. Budget & Conditions</h2>

                        <div className="bg-[#1E1E1E] rounded-3xl p-8 text-white relative flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                            <div className="w-20 h-20 bg-[#B79A63] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3"><DollarSign className="w-10 h-10 text-white" /></div>
                            <div className="flex-1 text-center md:text-left">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B79A63]">Prix Min. par personne</Label>
                                <div className="flex items-center gap-3 justify-center md:justify-start mt-2">
                                    <input type="number" value={cateringData.base_price || ""} onChange={e => setCateringData({ ...cateringData, base_price: Number(e.target.value) })} className="bg-transparent border-b-2 border-[#B79A63] text-4xl font-serif text-white focus:outline-none w-[180px]" placeholder="0" />
                                    <span className="text-2xl font-serif text-white/40">DZD</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-widest">Acompte à la réservation</Label>
                                <GildedInput value={cateringData.acompte_demande} onChange={e => setCateringData({ ...cateringData, acompte_demande: e.target.value })} placeholder="Ex: 40% lors de la signature" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-widest">Politique d'annulation</Label>
                                <textarea value={cateringData.politique_annulation} onChange={e => setCateringData({ ...cateringData, politique_annulation: e.target.value })} rows={3} className="w-full bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl p-4 text-sm font-lato focus:ring-1 focus:ring-[#B79A63] outline-none" placeholder="Ex: Remboursement possible jusqu'à 15 jours..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3 — Galerie (moved from step 6) */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">6. Galerie Photo</h2>
                                <p className="text-sm text-[#1E1E1E]/60 mt-1">Mettez en avant vos plus beaux buffets et plats.</p>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer bg-[#B79A63] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#A68953] transition-all self-start md:self-auto">
                                <ImageIcon className="w-4 h-4" /> Ajouter des photos
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {media.map((u, i) => (
                                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border border-[#D4D2CF] shadow-sm">
                                    <img src={u} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all"><X className="w-6 h-6" /></button>
                                    </div>
                                    {i === 0 && <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#B79A63] text-white text-[9px] font-black uppercase tracking-widest rounded shadow-lg">Couverture</div>}
                                </div>
                            ))}
                            {uploadingMedia && <div className="aspect-square rounded-2xl border-2 border-dashed border-[#B79A63] flex items-center justify-center bg-[#B79A63]/5"><Loader2 className="w-8 h-8 animate-spin text-[#B79A63]" /></div>}
                        </div>

                        <div className="bg-[#B79A63]/5 p-6 rounded-3xl border border-[#B79A63]/10 flex items-start gap-4">
                            <Sparkles className="w-6 h-6 text-[#B79A63] shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-[#1E1E1E]">Astuce Far7i</p>
                                <p className="text-xs text-[#1E1E1E]/60 leading-relaxed italic">Les photos avec une belle lumière naturelle augmentent les clics de 40%. Évitez les photos floues ou sombres.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* STEP 8 — Conditions */}
            {step === 8 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 mt-6">
                    <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">8. Conditions <span className="text-[#B79A63] font-normal">(optionnelles)</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Acompte demandé <span className="font-normal text-[#1E1E1E]/40">(indicatif)</span></Label>
                            <GildedInput value={cateringData.acompte_demande} onChange={e => setCateringData({ ...cateringData, acompte_demande: e.target.value })} placeholder="Ex: 40% lors de la signature" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Politique d'annulation <span className="font-normal text-[#1E1E1E]/40">(texte libre)</span></Label>
                            <textarea
                                value={cateringData.politique_annulation || ""}
                                onChange={e => setCateringData({ ...cateringData, politique_annulation: e.target.value })}
                                className="w-full h-32 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm outline-none focus:ring-1 focus:ring-[#B79A63] resize-none"
                                placeholder="Ex: Annulation gratuite jusqu'à 15 jours avant l'événement..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-8">
                <div>
                    {step > 1 && (
                        <button onClick={() => { setStep(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#1E1E1E]/40 hover:text-[#B79A63] transition-colors h-14 px-8 rounded-2xl hover:bg-white border border-[#D4D2CF]/40 shadow-sm bg-white/50 backdrop-blur-sm">
                            <ChevronLeft className="w-5 h-5" /> Précédent
                        </button>
                    )}
                </div>

                <div className="flex gap-4">
                    {step < 8 ? (
                        <>
                            <GildedButton
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="h-14 px-8 rounded-2xl shadow-xl"
                            >
                                {saving ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Sauvegarde...</> : <><Save className="w-5 h-5 mr-2" /> Brouillon</>}
                            </GildedButton>
                            <GildedButton onClick={() => { setStep(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="h-14 px-10 rounded-2xl shadow-xl hover:translate-x-1 duration-300">
                                Suivant <ArrowRight className="w-5 h-5 ml-2" />
                            </GildedButton>
                        </>
                    ) : (
                        <GildedButton onClick={() => handleSave()} disabled={saving} className="h-14 px-12 rounded-2xl bg-[#1E1E1E] text-white hover:bg-[#B79A63] shadow-xl">
                            {saving ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Sauvegarde...</> : <><Save className="w-5 h-5 mr-3" /> Soumettre pour validation</>}
                        </GildedButton>
                    )}
                </div>
            </div>
        </div>
    );
}
