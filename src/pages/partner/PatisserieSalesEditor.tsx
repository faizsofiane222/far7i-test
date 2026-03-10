import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    ChevronLeft, ChevronRight, Save, X, Plus, Check,
    Loader2, Info, Sparkles, DollarSign, Truck, ShoppingBag, Users,
} from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
import { GildedInput } from "@/components/ui/gilded-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { compressAndUpload } from "@/lib/image-utils";
import { useWilayas } from "@/hooks/useWilayas";

// Wilayas are now fetched from the database via useWilayas hook

const EVENT_TYPES = [
    { id: "mariage", label: "Mariage" },
    { id: "fiancailles", label: "Fiançailles (khotba)" },
    { id: "naissance", label: "Naissance (z'yada, sbou3)" },
    { id: "circoncision", label: "Circoncision" },
    { id: "anniversaire", label: "Anniversaire" },
    { id: "reussite", label: "Fête de réussite (BAC, BEM...)" },
    { id: "entreprise", label: "Événement professionnel" },
];

const PRODUIT_TYPES = [
    { key: "sucre", label: "Pâtisseries sucrées", emoji: "🥐" },
    { key: "sales", label: "Salés", emoji: "🥙" },
];

const PRICE_REASONS = [
    "Quantité commandée",
    "Type de produits",
    "Date demandée",
    "Urgence",
    "Livraison",
];

const STEPS = [
    { num: 1, label: "Identité" },
    { num: 2, label: "Galerie" },
    { num: 3, label: "Description" },
    { num: 4, label: "Prestations" },
    { num: 5, label: "Services" },
    { num: 6, label: "Logistique" },
    { num: 7, label: "Tarifs" },
    { num: 8, label: "Conditions" },
];

export default function PatisserieSalesEditor({ providerIdProp }: { providerIdProp?: string }) {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { wilayas } = useWilayas();

    const adminMode = searchParams.get('adminMode') === 'true' || !!providerIdProp;
    const isNew = id === "new" || (!id && !providerIdProp);
    const targetProviderId = isNew ? null : (id || providerIdProp || searchParams.get('providerId'));
    const basePath = adminMode && targetProviderId
        ? `/admin/providers/${targetProviderId}/services`
        : `/partner/dashboard/services`;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [providerId, setProviderId] = useState<string>("");

    const [commercialName, setCommercialName] = useState("");
    const [wilayaId, setWilayaId] = useState("");
    const [address, setAddress] = useState("");
    const [eventsAccepted, setEventsAccepted] = useState<string[]>([]);
    const [media, setMedia] = useState<{ url: string; isMain: boolean }[]>([]);
    const [description, setDescription] = useState("");
    const [produits, setProduits] = useState<Record<string, boolean>>({});
    const [personnalisationPossible, setPersonnalisationPossible] = useState(false);
    const [grandeQuantite, setGrandeQuantite] = useState(false);
    const [livraisonPossible, setLivraisonPossible] = useState(false);
    const [wilayasLivraison, setWilayasLivraison] = useState<string[]>([]);
    const [basePrice, setBasePrice] = useState<number | "">("");
    const [acompteDemande, setAcompteDemande] = useState(false);
    const [politiqueAnnulation, setPolitiqueAnnulation] = useState("");
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    useEffect(() => { if (!isNew && (user || adminMode)) fetchProviderData(); }, [user, targetProviderId]);


    const fetchProviderData = async () => {
        if (!targetProviderId) return;
        setLoading(true);
        try {
            const { data: p } = await supabase.from("providers")
                .select(`id, commercial_name, wilaya_id, address, events_accepted, bio, base_price, travel_wilayas, moderation_status, last_saved_step,
                    provider_media(media_url, is_main), provider_catering(product_types, delivery_options)`)
                .eq("id", targetProviderId).maybeSingle();

            if (p) {
                setProviderId(p.id);
                setCommercialName(p.commercial_name || "");
                setWilayaId(p.wilaya_id || "");
                setAddress(p.address || "");
                setEventsAccepted(p.events_accepted || []);
                setDescription(p.bio || "");
                setBasePrice(p.base_price || "");
                const tw = p.travel_wilayas as string[] || [];
                setLivraisonPossible(tw.length > 0);
                setWilayasLivraison(tw);
                const pm = (p.provider_media || []).sort((a: any) => a.is_main ? -1 : 1);
                setMedia(pm.map((m: any) => ({ url: m.media_url, isMain: m.is_main })));
                const catering = (p.provider_catering as any)?.[0] || (p.provider_catering as any);
                if (catering) {
                    const pMap: Record<string, boolean> = {};
                    (catering.product_types || []).forEach((s: string) => { pMap[s] = true; });
                    setProduits(pMap);
                    const opts = catering.delivery_options || [];
                    setPersonnalisationPossible(opts.includes("personnalisation"));
                    setGrandeQuantite(opts.includes("grande_quantite"));
                    setAcompteDemande(opts.includes("acompte"));
                    const ap = opts.find((o: string) => o.startsWith("annulation:"));
                    if (ap) setPolitiqueAnnulation(ap.replace("annulation:", ""));
                }

                if (p.moderation_status === "incomplete" || p.moderation_status === "draft") {
                    setStep(p.last_saved_step || 1);
                } else {
                    setStep(1); // Default to start for published/pending records
                }
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const toggleEvent = (evId: string) =>
        setEventsAccepted(prev => prev.includes(evId) ? prev.filter(x => x !== evId) : [...prev, evId]);
    const toggleProduit = (key: string) =>
        setProduits(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleWilaya = (id: string) =>
        setWilayasLivraison(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

    const validateStep = () => {
        if (step === 1) {
            if (!commercialName.trim()) { toast.error("Le nom est requis"); return false; }
            if (!wilayaId) { toast.error("Sélectionnez votre wilaya"); return false; }
            if (eventsAccepted.length === 0) { toast.error("Sélectionnez au moins un événement"); return false; }
        }
        return true;
    };

    const handleSaveDraft = async () => {
        if (!commercialName.trim() || (!user && !adminMode)) { toast.error("Données manquantes"); setStep(1); return; }
        await handleSave(true);
    };

    const handleSave = async (isDraft: boolean = false) => {
        if (!commercialName.trim() || (!user && !adminMode)) { toast.error("Données manquantes"); return; }
        setSaving(true);
        try {
            let currentProviderId = providerId;
            const providerPayload: any = {
                commercial_name: commercialName, category_slug: "patisserie_sales",
                wilaya_id: wilayaId || null, address, events_accepted: eventsAccepted,
                bio: description, base_price: basePrice || null,
                travel_wilayas: livraisonPossible ? wilayasLivraison : [],
                moderation_status: isDraft ? "draft" : "pending",
                last_saved_step: isDraft ? step : null,
            };

            if (currentProviderId) {
                await supabase.from("providers").update(providerPayload).eq("id", currentProviderId);
            } else if (user) {
                const { data: newP, error } = await supabase.from("providers")
                    .insert({ ...providerPayload, user_id: user.id, phone_number: "" }).select("id").single();
                if (error) throw error;
                currentProviderId = newP.id;
                setProviderId(currentProviderId);
            }

            const productTypes = Object.entries(produits).filter(([, v]) => v).map(([k]) => k);
            const deliveryOptions = [
                ...(personnalisationPossible ? ["personnalisation"] : []),
                ...(grandeQuantite ? ["grande_quantite"] : []),
                ...(acompteDemande ? ["acompte"] : []),
                ...(politiqueAnnulation ? [`annulation:${politiqueAnnulation}`] : []),
            ];
            await supabase.from("provider_catering").upsert({ provider_id: currentProviderId, product_types: productTypes, delivery_options: deliveryOptions });

            await supabase.from("provider_media").delete().eq("provider_id", currentProviderId);
            if (media.length > 0) {
                await supabase.from("provider_media").insert(media.map((m, i) => ({ provider_id: currentProviderId, media_url: m.url, is_main: i === 0 })));
            }
            toast.success(isDraft ? "Brouillon sauvegardé" : "Prestation enregistrée !");
            if (!isDraft) {
                navigate(basePath);
            }
        } catch (err: any) { toast.error(err.message || "Erreur"); } finally { setSaving(false); }
    };

    const handleNext = () => {
        if (validateStep()) {
            if (step < STEPS.length) {
                setStep(s => s + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                handleSave(false);
            }
        }
    };

    const handleAddMedia = async (file: File) => {
        if (!user || media.length >= 5) { toast.error("Maximum 5 photos"); return; }
        const tId = toast.loading("Upload en cours...");
        try {
            const { publicUrl, error: uploadError } = await compressAndUpload(
                file,
                user.id,
                { folder: providerId || user.id }
            );

            if (uploadError) throw uploadError;

            setMedia(prev => [...prev, { url: publicUrl, isMain: prev.length === 0 }]);
            toast.success("Photo ajoutée", { id: tId });
        } catch { toast.error("Erreur upload", { id: tId }); }
    };

    const UXHint = ({ children }: { children: React.ReactNode }) => (
        <div className="flex items-start gap-3 p-4 bg-[#F8F5F0] rounded-xl border border-[#D4D2CF]/50 mt-4">
            <Info className="w-4 h-4 text-[#B79A63] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1E1E1E]/60 leading-relaxed">{children}</p>
        </div>
    );

    const ToggleCard = ({ label, active, onToggle, icon }: { label: string; active: boolean; onToggle: () => void; icon?: React.ReactNode }) => (
        <button onClick={onToggle}
            className={cn("w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all text-left",
                active ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60")}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", active ? "bg-[#B79A63]" : "bg-[#F8F5F0]")}>
                {icon || <Check className="w-5 h-5" />}
            </div>
            <span className="font-bold uppercase text-xs tracking-widest flex-1">{label}</span>
            {active && <Check className="w-4 h-4 text-[#B79A63] ml-auto shrink-0" />}
        </button>
    );

    if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#B79A63]" /></div>;

    return (
        <div className="max-w-4xl mx-auto pb-36 mt-8 px-4">
            <div className="mb-12 space-y-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F8F5F0] rounded-full text-[#1E1E1E]/40 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#1E1E1E]">Pâtisserie & Salés</h1>
                        <p className="text-sm text-[#1E1E1E]/60 mt-1">{isNew ? "Créer une nouvelle prestation" : "Modifier votre prestation"}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between relative px-2 overflow-x-auto gap-1">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#D4D2CF] z-0" />
                    {STEPS.map((s) => (
                        <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 shrink-0">
                            <button onClick={() => setStep(s.num)}
                                className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all text-sm font-bold",
                                    step === s.num ? "bg-[#B79A63] border-[#B79A63] text-white shadow-lg shadow-[#B79A63]/30" :
                                        step > s.num ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#D4D2CF]")}>
                                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                            </button>
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider hidden md:block whitespace-nowrap", step === s.num ? "text-[#B79A63]" : "text-[#D4D2CF]")}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#D4D2CF] p-8 md:p-12 shadow-sm min-h-[500px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.04] text-[8rem] leading-none">🥐</div>

                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Identité du prestataire</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Nom de la pâtisserie / artisan *</Label>
                                <GildedInput value={commercialName} onChange={e => setCommercialName(e.target.value)} placeholder="Ex: Pâtisserie Samira, Artisan Kaci..." />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Wilaya *</Label>
                                <select value={wilayaId} onChange={e => setWilayaId(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] px-4 text-sm outline-none focus:ring-1 focus:ring-[#B79A63]">
                                    <option value="">Sélectionnez</option>
                                    {wilayas.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Localisation exacte</Label>
                            <GildedInput value={address} onChange={e => setAddress(e.target.value)} placeholder="Adresse, quartier, ville..." />
                        </div>
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Types d'événements acceptés *</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {EVENT_TYPES.map(ev => (
                                    <button key={ev.id} onClick={() => toggleEvent(ev.id)}
                                        className={cn("px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all text-center",
                                            eventsAccepted.includes(ev.id) ? "border-[#B79A63] bg-[#F8F5F0] text-[#B79A63]" : "border-[#D4D2CF] text-[#1E1E1E]/40 hover:border-[#B79A63]/40")}>
                                        {ev.label}
                                    </button>
                                ))}
                            </div>
                            <UXHint>Sélectionnez uniquement les événements que vous réalisez réellement. Votre prestation sera visible uniquement pour ces événements.</UXHint>
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div>
                            <h2 className="text-2xl font-serif text-[#1E1E1E] mb-1">Galerie & médias</h2>
                            <p className="text-sm text-[#1E1E1E]/40">{media.length} / 5 photos</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {media.map((m, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl border border-[#D4D2CF] overflow-hidden group">
                                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-3 h-3" />
                                    </button>
                                    {i === 0 && <span className="absolute bottom-2 left-2 bg-[#B79A63] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Principal</span>}
                                </div>
                            ))}
                            {media.length < 5 && (
                                <label className="aspect-square rounded-2xl border-2 border-dashed border-[#D4D2CF] flex flex-col items-center justify-center text-[#1E1E1E]/20 hover:text-[#B79A63] hover:border-[#B79A63]/50 transition-all cursor-pointer">
                                    <Plus className="w-8 h-8" />
                                    <input type="file" hidden accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleAddMedia(f); e.target.value = ""; }} />
                                </label>
                            )}
                        </div>
                        <UXHint>Présentez uniquement vos créations réelles. Une sélection courte et qualitative inspire plus de confiance.</UXHint>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Description <span className="text-[#B79A63]">(optionnelle)</span></h2>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full h-40 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm outline-none focus:ring-1 focus:ring-[#B79A63] resize-none"
                            placeholder="Spécialité, style, fait maison, savoir-faire..." />
                        <UXHint>Ce champ est facultatif. Il aide le client à comprendre votre univers.</UXHint>
                    </div>
                )}

                {/* STEP 4 — Prestations */}
                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Prestations proposées <span className="text-[#B79A63]">(informatif)</span></h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {PRODUIT_TYPES.map(type => (
                                <button key={type.key} onClick={() => toggleProduit(type.key)}
                                    className={cn("flex flex-col items-center gap-4 p-10 rounded-2xl border-2 transition-all",
                                        produits[type.key] ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60")}>
                                    <span className="text-5xl">{type.emoji}</span>
                                    <span className="font-bold uppercase text-sm tracking-widest">{type.label}</span>
                                    {produits[type.key] && <Check className="w-5 h-5 text-[#B79A63]" />}
                                </button>
                            ))}
                        </div>
                        <UXHint>Cochez uniquement ce que vous proposez habituellement.</UXHint>
                    </div>
                )}

                {/* STEP 5 — Services */}
                {step === 5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Services & options <span className="text-[#B79A63]">(informatif)</span></h2>
                        <div className="space-y-3">
                            <ToggleCard label="Personnalisation possible" active={personnalisationPossible} onToggle={() => setPersonnalisationPossible(!personnalisationPossible)} icon={<ShoppingBag className="w-5 h-5" />} />
                            <ToggleCard label="Commande en grande quantité" active={grandeQuantite} onToggle={() => setGrandeQuantite(!grandeQuantite)} icon={<Users className="w-5 h-5" />} />
                        </div>
                        <UXHint>Les options sont discutées directement avec le client selon ses besoins.</UXHint>
                    </div>
                )}

                {/* STEP 6 — Logistique */}
                {step === 6 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Organisation & logistique <span className="text-[#B79A63]">(informatif)</span></h2>
                        <button onClick={() => setLivraisonPossible(!livraisonPossible)}
                            className={cn("w-full p-6 rounded-2xl border-2 flex items-center gap-5 transition-all text-left",
                                livraisonPossible ? "bg-[#1E1E1E] border-[#1E1E1E] text-white" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/60")}>
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", livraisonPossible ? "bg-[#B79A63]" : "bg-[#F8F5F0]")}>
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold uppercase text-sm tracking-widest">Livraison possible</p>
                                <p className={cn("text-xs mt-1", livraisonPossible ? "text-white/60" : "text-[#1E1E1E]/40")}>Cliquez pour activer</p>
                            </div>
                            {livraisonPossible && <Check className="w-5 h-5 text-[#B79A63] ml-auto" />}
                        </button>
                        {livraisonPossible && (
                            <div className="space-y-4 animate-in slide-in-from-top-2">
                                <Label className="text-sm font-bold text-[#1E1E1E]">Wilayas de livraison</Label>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
                                    {wilayas.map(w => (
                                        <button key={w.id} onClick={() => toggleWilaya(w.id)}
                                            className={cn("px-2 py-2 rounded-lg border text-[9px] font-bold uppercase transition-all",
                                                wilayasLivraison.includes(w.id) ? "bg-[#B79A63] text-white border-[#B79A63]" : "bg-white border-[#D4D2CF] text-[#1E1E1E]/40")}>
                                            {w.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <UXHint>Les modalités de livraison sont définies avec le client.</UXHint>
                    </div>
                )}

                {/* STEP 7 — Tarification */}
                {step === 7 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Tarification & conditions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-[#1E1E1E]">Prix à partir de (DA) <span className="font-normal text-[#1E1E1E]/40">par pièce</span></Label>
                                    <div className="relative">
                                        <GildedInput type="number" value={basePrice} onChange={e => setBasePrice(parseInt(e.target.value) || "")} placeholder="0" className="pr-12 text-lg" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#1E1E1E]/40 text-sm">DA</span>
                                    </div>
                                </div>
                                <div className="bg-[#1E1E1E] p-6 rounded-2xl text-white space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#B79A63] flex items-center justify-center"><Info className="w-4 h-4" /></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Le prix peut varier selon :</span>
                                    </div>
                                    <ul className="space-y-2 text-[11px] text-white/60 pl-2">
                                        {PRICE_REASONS.map(r => <li key={r} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#B79A63] shrink-0" />{r}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-[#F8F5F0] p-8 rounded-3xl border border-[#D4D2CF]/50 flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-[#B79A63]/20 shadow-sm">
                                    <DollarSign className="w-8 h-8 text-[#B79A63]" />
                                </div>
                                <h3 className="text-lg font-serif font-bold text-[#1E1E1E]">Tarif Indicatif</h3>
                                <p className="text-xs text-[#1E1E1E]/60 leading-relaxed">Le tarif final dépend de la commande réelle.</p>
                            </div>
                        </div>
                        <UXHint>Le tarif final dépend de la commande réelle.</UXHint>
                    </div>
                )}

                {/* STEP 8 — Conditions */}
                {step === 8 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-2xl font-serif text-[#1E1E1E]">Conditions <span className="text-[#B79A63]">(optionnelles)</span></h2>
                        <ToggleCard label="Acompte demandé" active={acompteDemande} onToggle={() => setAcompteDemande(!acompteDemande)} />
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1E1E1E]">Politique d'annulation <span className="font-normal text-[#1E1E1E]/40">(texte libre)</span></Label>
                            <textarea value={politiqueAnnulation} onChange={e => setPolitiqueAnnulation(e.target.value)}
                                className="w-full h-32 rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm outline-none focus:ring-1 focus:ring-[#B79A63] resize-none"
                                placeholder="Ex: Annulation gratuite jusqu'à 48h avant la commande..." />
                        </div>
                    </div>
                )}

            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#D4D2CF] p-4 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(basePath)}
                        className="px-6 py-2.5 font-bold text-[#1E1E1E]/40 hover:text-[#1E1E1E] transition-colors text-sm uppercase tracking-widest">
                        {step === 1 ? "Retour" : "Précédent"}
                    </button>
                    <div className="flex gap-4">
                        <GildedButton variant="outline" onClick={handleSaveDraft} disabled={saving}>
                            {saving ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Sauvegarde...</> : <><Save className="w-4 h-4 mr-2" /> Brouillon</>}
                        </GildedButton>
                        <GildedButton onClick={handleNext} disabled={saving} className="gap-2">
                            {saving && step === STEPS.length ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {step < STEPS.length ? <>Continuer <ChevronRight className="w-4 h-4" /></> : "Soumettre pour validation"}
                        </GildedButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
