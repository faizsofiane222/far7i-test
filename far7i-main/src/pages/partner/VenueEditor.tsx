import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Image as ImageIcon,
    X,
    Plus,
    Info,
    Check,
    Loader2,
    Sparkles,
    Users,
    Maximize,
    Car,
    Home,
    Building2,
    ArrowRight,
    Clock,
    DollarSign,
    Box,
    Utensils,
    ChefHat,
    Wind,
    Flame,
    Fan,
    Music,
    Speaker,
    Table,
    ShieldCheck,
    Video,
    Key,
    Accessibility,
    Waves,
    Trees,
    Sun,
    Refrigerator,
    Tv,
    Droplet,
    GlassWater,
    Coffee,
    Leaf,
    Disc,
    Mic2,
    Layers,
    CheckCircle2
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

// Wilayas are now fetched from the database via useWilayas hook

const EVENT_TYPES = [
    { id: "mariage", label: "Mariage" },
    { id: "fiancailles", label: "Fiançailles (khotba)" },
    { id: "naissance", label: "Naissance (z'yada, sbou3)" },
    { id: "circoncision", label: "Circoncision" },
    { id: "anniversaire", label: "Anniversaire" },
    { id: "reussite", label: "Fête de réussite" },
    { id: "soutenance", label: "Soutenance universitaire" },
    { id: "entreprise", label: "Événement professionnel" }
];

export default function VenueEditor({ providerIdProp, isNewProp }: { providerIdProp?: string, isNewProp?: boolean }) {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const adminMode = searchParams.get('adminMode') === 'true' || !!providerIdProp;
    const targetProviderId = id || providerIdProp || searchParams.get('providerId');

    const basePath = adminMode && targetProviderId
        ? `/admin/providers/${targetProviderId}/services`
        : `/partner/dashboard/services`;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    const isOnboarding = searchParams.get('onboarding') === 'true';
    const { wilayas } = useWilayas();

    // Core Provider Data
    const [providerId, setProviderId] = useState<string>("");

    // Step 1 & 2: Base Provider Data
    const [baseData, setBaseData] = useState({
        commercial_name: "",
        category_slug: "lieu_de_reception", // Default to venues
        wilaya_id: "",
        address: "",
        events_accepted: [] as string[],
        bio: "",
    });

    // Step 3-8: Venue Specific Data
    const [venueData, setVenueData] = useState({
        // Capacités
        capacity_max: 0,
        capacity_min: 0,
        surface_m2: 0,
        // Espaces
        separated_spaces: false,
        salle_femmes_cap: 0,
        salle_hommes_cap: 0,
        salle_mixte_cap: 0,
        salle_dinatoire: false,
        couverts_par_service: 0,
        jardin: false,
        terrasse: false,
        piscine: false,
        parking_places: 0,
        loge_maries_nb: 0,
        loge_invites_nb: 0,
        salle_attente: false,
        // Services inclus
        serveurs_mixte: false,
        serveuses_femmes: false,
        nettoyage_inclus: false,
        securite_incluse: false,
        piste_danse: false,
        mobilier_inclus: false,
        nappes_incluses: false,
        climatisation: false,
        chauffage: false,
        ventilation: false,
        acces_pmr: false,
        sonorisation_base: false,
        jeux_lumiere: false,
        videoprojecteur: false,
        // Restauration
        traiteur_type: "libre", // 'impose', 'libre', 'aucun'
        cuisine_equipee: false,
        vaisselle_incluse: false,
        eau_incluse: false,
        cafe_inclus: false,
        the_inclus: false,
        jus_inclus: false,
        dj_inclus: false,
        animateur_inclus: false,
        valet_inclus: false,
        cameras_incluses: false,
        // Conditions
        base_price: 0,
        acompte_pourcentage: 0,
        politique_annulation: "",
        horaires_journee: false,
        horaires_soiree: false,
        horaires_nuit: false,
        contraintes_regles: ""
    });

    const [media, setMedia] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            fetchProviderData();
        }
    }, [user, targetProviderId]);

    const fetchProviderData = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from("providers")
                .select(`
                    id, commercial_name, category_slug, wilaya_id, address, 
                    events_accepted, bio, base_price,
                    provider_venues (*),
                    provider_media (media_url, is_main)
                `);

            if (targetProviderId) {
                query = query.eq("id", targetProviderId);
            } else {
                query = query.eq("user_id", user?.id).limit(1);
            }

            const { data: provider, error } = await query.maybeSingle();

            if (provider) {
                setProviderId(provider.id);
                setBaseData({
                    commercial_name: provider.commercial_name || "",
                    category_slug: provider.category_slug || "lieu_de_reception",
                    wilaya_id: provider.wilaya_id || "",
                    address: provider.address || "",
                    events_accepted: provider.events_accepted || [],
                    bio: provider.bio || "",
                });

                if (provider.provider_venues) {
                    const venue = provider.provider_venues;
                    setVenueData(prev => ({
                        ...prev,
                        ...venue,
                        base_price: provider.base_price || 0
                    }));
                }

                if (provider.provider_media) {
                    setMedia(provider.provider_media.map((m: any) => m.media_url));
                }
            } else {
                // Determine category from URL if not existing
                const categoryParam = searchParams.get('category_slug');
                if (categoryParam) {
                    setBaseData(prev => ({ ...prev, category_slug: categoryParam }));
                }
            }
        } catch (error: any) {
            console.error("Error fetching provider details:", error);
            // Non blocking if new provider
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!baseData.commercial_name.trim()) {
            toast.error("Le nom du lieu est requis");
            setStep(1);
            return;
        }

        try {
            setSaving(true);

            let currentProviderId = providerId;

            // 1. UPDATE OR INSERT PROVIDER
            const providerPayload = {
                commercial_name: baseData.commercial_name,
                category_slug: baseData.category_slug,
                wilaya_id: baseData.wilaya_id || null,
                address: baseData.address,
                events_accepted: baseData.events_accepted,
                bio: baseData.bio,
                base_price: venueData.base_price
            };

            if (currentProviderId) {
                const { error } = await supabase
                    .from('providers')
                    .update(providerPayload)
                    .eq('id', currentProviderId);
                if (error) throw error;
            } else if (user) {
                const { data: newProvider, error } = await supabase
                    .from('providers')
                    .insert({
                        user_id: user.id,
                        phone_number: user.user_metadata?.phone || '',
                        ...providerPayload
                    } as any)
                    .select('id')
                    .single();
                if (error) throw error;
                currentProviderId = newProvider.id;
                setProviderId(currentProviderId);
            }

            // 2. UPSERT PROVIDER_VENUES
            if (currentProviderId) {
                const venuePayload = {
                    provider_id: currentProviderId,
                    capacity_max: venueData.capacity_max,
                    capacity_min: venueData.capacity_min,
                    surface_m2: venueData.surface_m2,
                    separated_spaces: venueData.separated_spaces,
                    salle_femmes_cap: venueData.salle_femmes_cap,
                    salle_hommes_cap: venueData.salle_hommes_cap,
                    salle_mixte_cap: venueData.salle_mixte_cap,
                    salle_dinatoire: venueData.salle_dinatoire,
                    couverts_par_service: venueData.couverts_par_service,
                    jardin: venueData.jardin,
                    terrasse: venueData.terrasse,
                    piscine: venueData.piscine,
                    parking_places: venueData.parking_places,
                    loge_maries_nb: venueData.loge_maries_nb,
                    loge_invites_nb: venueData.loge_invites_nb,
                    salle_attente: venueData.salle_attente,
                    serveurs_mixte: venueData.serveurs_mixte,
                    serveuses_femmes: venueData.serveuses_femmes,
                    nettoyage_inclus: venueData.nettoyage_inclus,
                    securite_incluse: venueData.securite_incluse,
                    piste_danse: venueData.piste_danse,
                    mobilier_inclus: venueData.mobilier_inclus,
                    nappes_incluses: venueData.nappes_incluses,
                    climatisation: venueData.climatisation,
                    chauffage: venueData.chauffage,
                    ventilation: venueData.ventilation,
                    acces_pmr: venueData.acces_pmr,
                    sonorisation_base: venueData.sonorisation_base,
                    jeux_lumiere: venueData.jeux_lumiere,
                    videoprojecteur: venueData.videoprojecteur,
                    traiteur_type: venueData.traiteur_type,
                    cuisine_equipee: venueData.cuisine_equipee,
                    vaisselle_incluse: venueData.vaisselle_incluse,
                    eau_incluse: venueData.eau_incluse,
                    cafe_inclus: venueData.cafe_inclus,
                    the_inclus: venueData.the_inclus,
                    jus_inclus: venueData.jus_inclus,
                    dj_inclus: venueData.dj_inclus,
                    animateur_inclus: venueData.animateur_inclus,
                    valet_inclus: venueData.valet_inclus,
                    cameras_incluses: venueData.cameras_incluses,
                    acompte_pourcentage: venueData.acompte_pourcentage,
                    politique_annulation: venueData.politique_annulation,
                    horaires_journee: venueData.horaires_journee,
                    horaires_soiree: venueData.horaires_soiree,
                    horaires_nuit: venueData.horaires_nuit,
                    contraintes_regles: venueData.contraintes_regles
                };

                const { error: venueError } = await supabase
                    .from('provider_venues')
                    .upsert(venuePayload, { onConflict: 'provider_id' });

                if (venueError) throw venueError;

                // 3. MEDIA (Simple Replace)
                await supabase.from('provider_media').delete().eq('provider_id', currentProviderId);
                if (media.length > 0) {
                    const mediaPayload = media.map((url, index) => ({
                        provider_id: currentProviderId,
                        media_url: url,
                        is_main: index === 0
                    }));
                    await supabase.from('provider_media').insert(mediaPayload);
                }
            }

            toast.success("Lieu enregistré avec succès");

            // Si on vient de l'onboarding, l'inscription est TERMINEE !
            if (isOnboarding) {
                toast.success("Votre profil complet a été soumis ! Bienvenue sur Far7i 🎉");
                navigate("/partner/dashboard");
            } else {
                navigate(basePath);
            }
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.message || "Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    const toggleEvent = (eventId: string) => {
        setBaseData(prev => {
            const current = prev.events_accepted || [];
            if (current.includes(eventId)) {
                return { ...prev, events_accepted: current.filter(id => id !== eventId) };
            } else {
                return { ...prev, events_accepted: [...current, eventId] };
            }
        });
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#B79A63]" />
            </div>
        );
    }

    const steps = [
        { num: 1, label: "Identité" },
        { num: 2, label: "Description" },
        { num: 3, label: "Galerie" },
        { num: 4, label: "Capacité" },
        { num: 5, label: "Espaces" },
        { num: 6, label: "Services" },
        { num: 7, label: "Tarifs" },
        { num: 8, label: "Conditions" },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-36 md:pb-32">
            {/* Header & Stepper */}
            <div className="space-y-8 mb-12 mt-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F8F5F0] rounded-full text-[#1E1E1E]/40 hover:text-[#B79A63] transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">Configuration : Salle</h1>
                        <p className="text-sm text-[#1E1E1E]/60 mt-1">Détaillez votre lieu de réception.</p>
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
                    <Building2 className="w-32 h-32" />
                </div>

                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-6 flex items-center gap-2">
                                <Check className="w-5 h-5 text-[#B79A63]" /> 1. Identité du lieu
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Nom commercial *</Label>
                                    <GildedInput
                                        value={baseData.commercial_name}
                                        onChange={e => setBaseData({ ...baseData, commercial_name: e.target.value })}
                                        placeholder="Ex: Salle Le Diamant"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Wilaya *</Label>
                                    <select
                                        value={baseData.wilaya_id}
                                        onChange={e => setBaseData({ ...baseData, wilaya_id: e.target.value })}
                                        className="w-full h-11 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] px-4 font-lato text-sm focus:ring-1 focus:ring-[#B79A63] outline-none"
                                    >
                                        <option value="">Sélectionnez</option>
                                        {wilayas.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Adresse complète</Label>
                                    <GildedInput
                                        value={baseData.address}
                                        onChange={e => setBaseData({ ...baseData, address: e.target.value })}
                                        placeholder="Adresse exacte de la salle"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#F8F5F0]">
                            <Label className="text-sm font-bold text-[#1E1E1E] mb-4 block">Événements acceptés</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {EVENT_TYPES.map(ev => (
                                    <button
                                        key={ev.id}
                                        onClick={() => toggleEvent(ev.id)}
                                        className={cn(
                                            "px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                                            baseData.events_accepted.includes(ev.id) ? "border-[#B79A63] bg-[#F8F5F0] text-[#B79A63]" : "border-[#D4D2CF] text-[#1E1E1E]/40 hover:border-[#1E1E1E]/20"
                                        )}
                                    >
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
                            <textarea
                                value={baseData.bio}
                                onChange={e => setBaseData({ ...baseData, bio: e.target.value })}
                                rows={6}
                                className="w-full bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl p-4 text-sm font-lato focus:ring-1 focus:ring-[#B79A63] outline-none resize-none"
                                placeholder="Décrivez votre salle et ses atouts..."
                            />
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-[#F8F5F0] rounded-xl border border-[#D4D2CF]/50">
                            <span className="text-[#B79A63] text-xs">&#9432;</span>
                            <p className="text-xs text-[#1E1E1E]/60 leading-relaxed">Ce champ est facultatif. Il permet aux clients de mieux comprendre l'environnement et l'atmosphère de votre salle.</p>
                        </div>
                    </div>
                )}


                {/* STEP 3 — Galerie (moved from step 6) */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">2. Capacité d'accueil</h2>
                                <p className="text-sm text-[#1E1E1E]/60 max-w-md">Définissez vos standards de réception.</p>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-1">
                                <span className="text-[10px] font-bold text-[#B79A63] uppercase tracking-widest bg-[#F8F5F0] px-3 py-1 rounded-full border border-[#B79A63]/20">Aide UX</span>
                                <p className="text-[9px] text-[#1E1E1E]/40 text-right max-w-[150px]">Ces chiffres aident le client à filtrer selon la taille de son événement.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-[#F8F5F0]/50 p-6 rounded-2xl border border-[#D4D2CF]/40">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/40 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Capacité Min.
                                </Label>
                                <GildedInput
                                    type="number"
                                    value={venueData.capacity_min || ""}
                                    onChange={e => setVenueData({ ...venueData, capacity_min: Number(e.target.value) })}
                                    placeholder="Ex: 50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/40 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Capacité Max. *
                                </Label>
                                <GildedInput
                                    type="number"
                                    value={venueData.capacity_max || ""}
                                    onChange={e => setVenueData({ ...venueData, capacity_max: Number(e.target.value) })}
                                    placeholder="Ex: 400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-[#1E1E1E]/40 uppercase tracking-widest flex items-center gap-2">
                                    <Maximize className="w-3 h-3" /> Surface (m²)
                                </Label>
                                <GildedInput
                                    type="number"
                                    value={venueData.surface_m2 || ""}
                                    onChange={e => setVenueData({ ...venueData, surface_m2: Number(e.target.value) })}
                                    placeholder="Ex: 250"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4 — Capacité */}
                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">3. Espaces disponibles</h2>
                                <p className="text-sm text-[#1E1E1E]/60">Précisez l'organisation de vos salles.</p>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-1">
                                <span className="text-[10px] font-bold text-[#B79A63] uppercase tracking-widest bg-[#F8F5F0] px-3 py-1 rounded-full border border-[#B79A63]/20">Aide UX</span>
                                <p className="text-[9px] text-[#1E1E1E]/40 text-right max-w-[150px]">Détaillez chaque espace pour rassurer le client sur son confort.</p>
                            </div>
                        </div>

                        <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#D4D2CF] space-y-6">
                            <Label className="text-base font-bold text-[#1E1E1E] flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-[#B79A63]" /> Type de salle
                            </Label>
                            <div className="flex gap-8">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={!venueData.separated_spaces}
                                        onChange={() => setVenueData({ ...venueData, separated_spaces: false })}
                                        className="w-5 h-5 accent-[#B79A63]"
                                    />
                                    <span className="text-sm font-bold text-[#1E1E1E]/70 group-hover:text-[#1E1E1E] transition-colors">Salle unique (Mixte)</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={venueData.separated_spaces}
                                        onChange={() => setVenueData({ ...venueData, separated_spaces: true })}
                                        className="w-5 h-5 accent-[#B79A63]"
                                    />
                                    <span className="text-sm font-bold text-[#1E1E1E]/70 group-hover:text-[#1E1E1E] transition-colors">Salles séparées (F/H)</span>
                                </label>
                            </div>

                            {venueData.separated_spaces ? (
                                <div className="grid grid-cols-2 gap-4 pt-4 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[#1E1E1E]/40 uppercase tracking-widest">Capacité Salle Femmes</Label>
                                        <GildedInput type="number" value={venueData.salle_femmes_cap || ""} onChange={e => setVenueData({ ...venueData, salle_femmes_cap: parseInt(e.target.value) || 0 })} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[#1E1E1E]/40 uppercase tracking-widest">Capacité Salle Hommes</Label>
                                        <GildedInput type="number" value={venueData.salle_hommes_cap || ""} onChange={e => setVenueData({ ...venueData, salle_hommes_cap: parseInt(e.target.value) || 0 })} placeholder="0" />
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-4 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[#1E1E1E]/40 uppercase tracking-widest">Capacité Globale Mixte</Label>
                                        <GildedInput type="number" value={venueData.salle_mixte_cap || ""} onChange={e => setVenueData({ ...venueData, salle_mixte_cap: parseInt(e.target.value) || 0 })} placeholder="0" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'salle_dinatoire', label: 'Salle Dînatoire séparée', icon: <Utensils className="w-4 h-4" /> },
                                { key: 'jardin', label: 'Espace Extérieur / Jardin', icon: <Sparkles className="w-4 h-4" /> },
                                { key: 'terrasse', label: 'Terrasse / Roof-top', icon: <Home className="w-4 h-4" /> },
                                { key: 'piscine', label: 'Piscine exploitable', icon: <Sparkles className="w-4 h-4" /> },
                                { key: 'salle_attente', label: "Salle d'attente Invités", icon: <Clock className="w-4 h-4" /> }
                            ].map(it => (
                                <button key={it.key} onClick={() => setVenueData({ ...venueData, [it.key]: !((venueData as any)[it.key]) })} className={cn("flex items-center gap-3 p-5 rounded-2xl border transition-all text-left", (venueData as any)[it.key] ? "bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-md" : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/60")}>
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", (venueData as any)[it.key] ? "bg-[#B79A63]" : "bg-white")}>
                                        {it.icon}
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-wider">{it.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#F8F5F0]">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Places Parking</Label>
                                <GildedInput type="number" value={venueData.parking_places || ""} onChange={e => setVenueData({ ...venueData, parking_places: parseInt(e.target.value) || 0 })} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Nb Loges Mariés</Label>
                                <GildedInput type="number" value={venueData.loge_maries_nb || ""} onChange={e => setVenueData({ ...venueData, loge_maries_nb: parseInt(e.target.value) || 0 })} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Nb Loges Invités</Label>
                                <GildedInput type="number" value={venueData.loge_invites_nb || ""} onChange={e => setVenueData({ ...venueData, loge_invites_nb: parseInt(e.target.value) || 0 })} placeholder="0" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5 — Espaces */}
                {step === 5 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">4. Services & Équipements</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { key: 'serveurs_mixte', label: 'Serveurs (standard)', icon: <Users className="w-4 h-4" /> },
                                { key: 'serveuses_femmes', label: 'Serveuses (femmes)', icon: <Users className="w-4 h-4" /> },
                                { key: 'nettoyage_inclus', label: 'Nettoyage inclus', icon: <CheckCircle2 className="w-4 h-4" /> },
                                { key: 'securite_incluse', label: 'Agent de sécurité', icon: <ShieldCheck className="w-4 h-4" /> },
                                { key: 'climatisation', label: 'Climatisation', icon: <Wind className="w-4 h-4" /> },
                                { key: 'chauffage', label: 'Chauffage Central', icon: <Flame className="w-4 h-4" /> },
                                { key: 'sonorisation_base', label: 'Sonorisation de base', icon: <Speaker className="w-4 h-4" /> },
                                { key: 'piste_danse', label: 'Piste de Danse', icon: <Disc className="w-4 h-4" /> },
                                { key: 'acces_pmr', label: 'Accès PMR', icon: <Accessibility className="w-4 h-4" /> },
                            ].map(it => (
                                <button
                                    key={it.key}
                                    type="button"
                                    onClick={() => setVenueData({ ...venueData, [it.key]: !(venueData as any)[it.key] })}
                                    className={cn(
                                        "flex items-center gap-3 p-5 rounded-2xl border transition-all text-left",
                                        (venueData as any)[it.key]
                                            ? "bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-md"
                                            : "bg-[#F8F5F0] border-transparent text-[#1E1E1E]/60 hover:border-[#D4D2CF]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                        (venueData as any)[it.key] ? "bg-[#B79A63]" : "bg-white"
                                    )}>
                                        {it.icon}
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-wider">{it.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-[#F8F5F0]">
                            <Label className="text-sm font-bold text-[#1E1E1E] mb-6 block">Restauration & Cuisine</Label>
                            <div className="bg-[#1E1E1E] rounded-2xl p-6 text-white grid grid-cols-1 md:grid-cols-3 gap-4 border border-[#B79A63]/20">
                                {[
                                    { id: 'libre', label: 'Traiteur libre' },
                                    { id: 'impose', label: 'Traiteur imposé' },
                                    { id: 'aucun', label: 'Pas de traiteur' }
                                ].map(opt => (
                                    <button key={opt.id} onClick={() => setVenueData({ ...venueData, traiteur_type: opt.id })} className={cn("px-4 py-3 rounded-xl border text-xs font-bold transition-all", venueData.traiteur_type === opt.id ? "bg-[#B79A63] border-[#B79A63] text-white" : "border-white/10 text-white/40 hover:border-white/20")}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 6 — Services */}
                {step === 6 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">5. Tarification & Conditions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Prix à partir de (DA) *</Label>
                                    <div className="relative">
                                        <GildedInput type="number" className="pr-12" value={venueData.base_price || ""} onChange={e => setVenueData({ ...venueData, base_price: parseInt(e.target.value) || 0 })} placeholder="0" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1E1E1E]/40">DZD</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Acompte (%)</Label>
                                    <div className="flex items-center gap-4 bg-[#F8F5F0] p-4 rounded-xl border border-[#D4D2CF]">
                                        <input type="range" min="0" max="100" step="10" value={venueData.acompte_pourcentage || 0} onChange={e => setVenueData({ ...venueData, acompte_pourcentage: parseInt(e.target.value) })} className="w-full accent-[#B79A63]" />
                                        <span className="font-bold text-[#B79A63] w-12 text-right">{venueData.acompte_pourcentage}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Règles & Annulation</Label>
                                <textarea className="w-full h-full min-h-[150px] rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm focus:ring-1 focus:ring-[#B79A63] outline-none" placeholder="Ex: Acompte non remboursable..." value={venueData.politique_annulation} onChange={e => setVenueData({ ...venueData, politique_annulation: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 7 — Tarifs */}
                {step === 7 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-[#1E1E1E] mb-2">6. Galerie Photos</h2>
                                <p className="text-sm text-[#1E1E1E]/60">Ajoutez les plus beaux clichés de votre salle (Max 5).</p>
                            </div>
                            <GildedButton variant="outline" onClick={() => document.getElementById('media-upload')?.click()} disabled={media.length >= 5}>
                                <ImageIcon className="w-5 h-5 mr-2" /> Ajouter une photo
                            </GildedButton>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {media.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-2xl border border-[#D4D2CF] overflow-hidden group">
                                    <img src={url} alt={`Media ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => setMedia(media.filter((_, i) => i !== idx))} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {idx === 0 && <div className="absolute top-2 left-2 bg-[#B79A63] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Couverture</div>}
                                </div>
                            ))}
                            {media.length < 5 && (
                                <button onClick={() => document.getElementById('media-upload')?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-[#D4D2CF] flex flex-col items-center justify-center gap-2 text-[#1E1E1E]/40 hover:text-[#B79A63] hover:border-[#B79A63]/50 transition-all hover:bg-[#F8F5F0]">
                                    <Box className="w-8 h-8" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Ajouter</span>
                                </button>
                            )}
                        </div>

                        <input
                            type="file"
                            id="media-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !user) return;
                                const toastId = toast.loading("Upload en cours...");
                                try {
                                    const { publicUrl, error: uploadError } = await compressAndUpload(
                                        file,
                                        user.id,
                                        { folder: user.id }
                                    );

                                    if (uploadError) throw uploadError;

                                    setMedia(prev => [...prev, publicUrl]);
                                    toast.success("Image ajoutée", { id: toastId });
                                } catch (err: any) {
                                    toast.error("Échec: " + err.message, { id: toastId });
                                } finally { e.target.value = ""; }
                            }}
                        />
                    </div>
                )}
            </div>

            {/* STEP 8 — Conditions */}
            {step === 8 && (
                <div className="bg-white rounded-2xl border border-[#D4D2CF] p-8 md:p-10 shadow-sm mb-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h2 className="text-xl font-serif font-bold text-[#1E1E1E]">8. Conditions <span className="text-[#B79A63] font-normal">(optionnelles)</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Acompte demandé (%) <span className="font-normal text-[#1E1E1E]/40">(indicatif)</span></Label>
                            <GildedInput
                                type="number"
                                value={venueData.acompte_pourcentage}
                                onChange={e => setVenueData({ ...venueData, acompte_pourcentage: Number(e.target.value) })}
                                placeholder="Ex: 30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Politique d'annulation <span className="font-normal text-[#1E1E1E]/40">(texte libre)</span></Label>
                            <textarea
                                value={venueData.politique_annulation || ""}
                                onChange={e => setVenueData({ ...venueData, politique_annulation: e.target.value })}
                                rows={4}
                                className="w-full bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl p-4 text-sm outline-none focus:ring-1 focus:ring-[#B79A63] resize-none"
                                placeholder="Ex: Annulation gratuite jusqu'à 30 jours avant l'événement..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D4D2CF] p-4 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    {(!isOnboarding || step > 2) && (
                        <button
                            onClick={() => {
                                if (step > 1) setStep(step - 1);
                                else navigate(basePath);
                            }}
                            className="px-6 py-2.5 rounded-xl font-bold text-[#1E1E1E]/50 hover:bg-[#F8F5F0] hover:text-[#1E1E1E] transition-colors"
                        >
                            {step === 1 ? "Annuler" : "Retour"}
                        </button>
                    )}

                    {/* Placeholder si le bouton retour est masqué pour garder l'alignement */}
                    {(isOnboarding && step === 2) && <div></div>}

                    <div className="flex gap-4">
                        <GildedButton
                            variant="outline"
                            onClick={() => handleSave()}
                            disabled={saving}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Sauvegarder
                        </GildedButton>
                        <GildedButton
                            onClick={() => {
                                if (step < 6) setStep(step + 1);
                                else handleSave();
                            }}
                            disabled={saving}
                            className="gilded-glow"
                        >
                            {step < 8 ? "Continuer" : "Terminer"}
                            {step < 8 && <ArrowRight className="w-5 h-5 ml-2" />}
                        </GildedButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
