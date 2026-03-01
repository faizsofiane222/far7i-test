import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    Plus,
    Briefcase,
    LayoutGrid,
    Camera,
    Music,
    UtensilsCrossed,
    Sparkles,
    Car,
    Shirt,
    Loader2,
    Building2,
    Star,
    MessageSquare,
    Eye,
    ChevronRight,
    Send,
    ThumbsUp,
    Flag,
    Reply,
    Box,
    Home
} from "lucide-react";
import { GildedButton } from "@/components/ui/gilded-button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

interface Category {
    slug: string;
    label: string;
    icon?: any;
}

const DEFAULT_CATEGORY_ICONS: Record<string, any> = {
    lieu_de_reception: Building2,
    traiteur: UtensilsCrossed,
    photographe: Camera,
    dj_orchestre: Music,
    beaute_bien_etre: Sparkles,
    gateau_traditionnel: UtensilsCrossed,
    location_voiture: Car,
    location_tenues: Home,
    habilleuse: Sparkles,
    coiffure_beaute: Sparkles,
};

const CATEGORIES_FALLBACK = [
    { slug: "lieu_de_reception", label: "Lieu de réception", icon: Building2, color: "#B79A63" },
    { slug: "traiteur", label: "Traiteur & Gastronomie", icon: UtensilsCrossed, color: "#1E1E1E" },
    { slug: "photographe", label: "Photographe / Vidéaste", icon: Camera, color: "#B79A63" },
    { slug: "dj_orchestre", label: "DJ & Orchestre", icon: Music, color: "#1E1E1E" },
    { slug: "beaute_bien_etre", label: "Beauté & Bien-être", icon: Sparkles, color: "#B79A63" },
];

interface Service {
    id: string;
    title: string;
    base_price: number;
    price_unit: string;
    is_active: boolean;
    service_category_id: string;
    moderation_status: 'pending' | 'approved' | 'rejected' | 'incomplete';
    modification_submitted: boolean;
    category_name?: string;
    image_url?: string;
}

interface Category {
    slug: string;
    label: string;
    icon?: any;
}

interface ServiceRating {
    service_id: string;
    average_rating: number;
    review_count: number;
}

interface Review {
    id: string;
    client_id: string;
    rating: number;
    comment: string;
    created_at: string;
    service_title?: string;
    client_name?: string;
    provider_response?: string;
}

import { useSearchParams } from "react-router-dom";

export default function Services({ providerIdProp }: { providerIdProp?: string }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Admin Detection
    const adminMode = searchParams.get('adminMode') === 'true' || !!providerIdProp;
    const targetProviderId = providerIdProp || searchParams.get('providerId');

    // Dynamic Base Path
    const basePath = adminMode && targetProviderId
        ? `/admin/providers/${targetProviderId}/services`
        : `/partner/dashboard/services`;

    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ratings, setRatings] = useState<Record<string, ServiceRating>>({});
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [selectedServiceForReviews, setSelectedServiceForReviews] = useState<Service | null>(null);

    useEffect(() => {
        if (user || (adminMode && targetProviderId)) fetchData();
    }, [user, adminMode, targetProviderId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 0. Fetch all service_categories to populate the creation modal
            const { data: allCats } = await supabase
                .from('service_categories')
                .select('slug, label')
                .order('label');

            if (allCats && allCats.length > 0) {
                const catsWithIcons = allCats.map((c: any) => ({
                    slug: c.slug,
                    label: c.label,
                    icon: DEFAULT_CATEGORY_ICONS[c.slug] || Box
                }));
                setCategories(catsWithIcons);
            }

            // 1. Get ALL Providers for this user
            let query = supabase
                .from("providers")
                .select(`
                    id,
                    commercial_name,
                    category_slug,
                    moderation_status,
                    base_price,
                    provider_media(media_url, is_main),
                    provider_stats(rating_avg, review_count)
                `);

            if (adminMode && targetProviderId) {
                query = query.eq("id", targetProviderId);
            } else {
                query = query.eq("user_id", user?.id);
            }

            const { data: providers, error: providerError } = await query;

            if (providerError) throw providerError;

            if (!providers || providers.length === 0) {
                setServices([]);
                setLoading(false);
                return;
            }

            // 2. Format services
            const formattedServices = providers.map(p => ({
                id: p.id,
                title: p.commercial_name || "Prestation sans nom",
                base_price: p.base_price || 0,
                price_unit: "DA",
                is_active: p.moderation_status === 'approved',
                service_category_id: p.category_slug, // using slug as ID for simplicity here
                moderation_status: p.moderation_status || 'incomplete',
                category_name: p.category_slug, // Will be mapped below
                image_url: p.provider_media?.find((m: any) => m.is_main)?.media_url || p.provider_media?.[0]?.media_url,
                rating_avg: (p.provider_stats as any)?.[0]?.rating_avg || 0,
                review_count: (p.provider_stats as any)?.[0]?.review_count || 0
            }));

            setServices(formattedServices as any);

            // 3. Fetch category names for all unique slugs
            const slugs = [...new Set(providers.map(p => p.category_slug))].filter(Boolean);
            if (slugs.length > 0) {
                const { data: cats } = await supabase
                    .from('service_categories')
                    .select('slug, label')
                    .in('slug', slugs);

                if (cats) {
                    const mapped = formattedServices.map(s => {
                        const c = cats.find(ct => ct.slug === s.category_name);
                        return { ...s, category_name: c?.label || s.category_name };
                    });
                    setServices(mapped as any);
                }
            }
        } catch (error: any) {
            console.error("Fetch error:", error);
            toast.error("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCategorySelect = (slug: string) => {
        setIsModalOpen(false);
        if (slug === "lieu_de_reception") {
            navigate(`${basePath}/venues/new`);
        } else if (slug === "traiteur") {
            navigate(`${basePath}/catering/new`);
        } else if (slug === "piece_montee_tartes") {
            navigate(`${basePath}/piece-montee/new`);
        } else if (slug === "gateau_traditionnel") {
            navigate(`${basePath}/gateau-trad/new`);
        } else if (slug === "patisserie_sales") {
            navigate(`${basePath}/patisserie-sales/new`);
        } else if (slug === "habilleuse") {
            navigate(`${basePath}/habilleuse/new`);
        } else if (slug === "location_tenues") {
            navigate(`${basePath}/location-tenues/new`);
        } else if (slug === "coiffure_beaute") {
            navigate(`${basePath}/coiffure-beaute/new`);
        } else if (slug === "location_voiture") {
            navigate(`${basePath}/location-voiture/new`);
        } else if (slug === "dj_orchestre") {
            navigate(`${basePath}/dj-orchestra/new`);
        } else if (slug === "animation_musicale_traditionnelle") {
            navigate(`${basePath}/traditional-music/new`);
        } else if (slug === "photographe") {
            navigate(`${basePath}/photographer/new`);
        } else {
            navigate(`${basePath}/new?category=${slug}`);
        }
    };

    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!serviceToDelete) return;

        const originalServices = [...services];
        try {
            setIsDeleting(true);

            // Optimistic update
            setServices(prev => prev.filter(s => s.id !== serviceToDelete));

            const { error, count } = await supabase
                .from("providers")
                .delete({ count: "exact" })
                .eq("id", serviceToDelete);

            if (error) throw error;

            if (count === 0) {
                // If count is 0, it means either:
                // 1. Row didn't exist (already deleted)
                // 2. RLS blocked it
                // We'll check if it still exists to be sure
                const { data: exists } = await supabase
                    .from("providers")
                    .select("id")
                    .eq("id", serviceToDelete)
                    .single();

                if (exists) {
                    throw new Error("Action non autorisée. Vous n'avez pas les droits pour supprimer cette prestation.");
                } else {
                    toast.info("Cette prestation a déjà été supprimée.");
                }
            } else {
                toast.success("Prestation supprimée avec succès");
            }

            setServiceToDelete(null);
            // Refresh to ensure everything (stats etc) is in sync
            fetchData();
        } catch (error: any) {
            console.error("Delete error:", error);
            // Rollback optimistic update
            setServices(originalServices);
            toast.error(error.message || "Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
            setServiceToDelete(null);
        }
    };


    const openReviews = async (service: Service) => {
        setSelectedServiceForReviews(service);
        // We now use the Sheet exclusively
        try {
            setLoadingReviews(true);
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("provider_id", service.id)
                .order("created_at", { ascending: false });

            if (error) {
                // If the error is 'PGRST116' (No rows found), it's not a real error for us
                if (error.code === 'PGRST116') {
                    setReviews([]);
                    return;
                }
                throw error;
            }

            const formattedReviews = data?.map(r => ({
                ...r,
                service_title: service.title,
                client_name: r.client_name || "Client anonyme"
            })) || [];

            setReviews(formattedReviews);
        } catch (error: any) {
            console.error("Reviews error:", error);
            // Don't show toast for "not found" which might happen if table is empty or RLS
            if (error.code !== 'PGRST116') {
                toast.error("Erreur lors du chargement des avis");
            }
            setReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    // Removed legacy tab effects

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-[#D4D2CF] px-6 py-12 md:px-12">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold text-[#B79A63] uppercase tracking-[0.2em]">
                            {adminMode ? "Administration" : "Tableau de Bord"}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-serif text-[#1E1E1E]">
                            {adminMode ? `Services de ${services.length > 0 ? "ce prestataire" : "..."}` : "Mes Prestations"}
                        </h1>
                        <p className="text-[#1E1E1E]/60 max-w-lg font-sans">
                            Gérez vos offres et paramétrez vos prestations. Votre profil sera validé par l'équipe Far7i.
                        </p>
                    </div>

                    {/* CTA: Add new service */}
                    {!adminMode && (
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <button
                                    className="flex items-center gap-2 px-6 py-3 bg-[#1E1E1E] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#B79A63] hover:shadow-lg hover:shadow-[#B79A63]/20 transition-all shrink-0"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nouvelle prestation
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white border-[#D4D2CF] rounded-3xl p-8">
                                <DialogHeader className="mb-8">
                                    <DialogTitle className="text-3xl font-serif text-center text-[#1E1E1E]">Quelle prestation souhaitez-vous créer ?</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {(categories.length > 0 ? categories : CATEGORIES_FALLBACK).map((cat) => (
                                        <button
                                            key={cat.slug}
                                            onClick={() => handleCategorySelect(cat.slug)}
                                            className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-[#D4D2CF] hover:border-[#B79A63] hover:bg-[#F8F5F0] transition-all"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-[#F8F5F0] group-hover:bg-white flex items-center justify-center transition-colors">
                                                {cat.icon && <cat.icon className="w-6 h-6 text-[#B79A63]" />}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-center text-[#1E1E1E]/60 group-hover:text-[#1E1E1E]">
                                                {cat.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="max-w-6xl mx-auto mt-12 flex gap-8 border-b border-[#D4D2CF]">
                    <div className="pb-4 text-xs font-bold uppercase tracking-widest transition-all relative text-[#B79A63]">
                        Mes Prestations ({services.length})
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B79A63]" />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-12 md:px-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-[#B79A63]" />
                        <p className="text-[#1E1E1E]/40 uppercase text-xs font-bold tracking-widest">Chargement de vos services...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {services.map(service => (
                            <div key={service.id}>
                                <div className="md:hidden">
                                    <CompactServiceCard
                                        service={service}
                                        onEdit={() => {
                                            const slug = (service as any).service_category_id;
                                            if (slug === "lieu_de_reception") {
                                                navigate(`${basePath}/venues/${service.id}/edit`);
                                            } else if (['traiteur', 'gateau_traditionnel', 'patisserie_sales'].includes(slug)) {
                                                navigate(`${basePath}/catering/${service.id}/edit`);
                                            } else if (slug === "piece_montee_tartes") {
                                                navigate(`${basePath}/piece-montee/${service.id}/edit`);
                                            } else if (slug === "dj_orchestre") {
                                                navigate(`${basePath}/dj-orchestra/${service.id}/edit`);
                                            } else if (slug === "animation_musicale_traditionnelle") {
                                                navigate(`${basePath}/traditional-music/${service.id}/edit`);
                                            } else if (slug === "photographe") {
                                                navigate(`${basePath}/photographer/${service.id}/edit`);
                                            } else {
                                                navigate(`${basePath}/${service.id}/edit`);
                                            }
                                        }}
                                        onViewReviews={() => openReviews(service as any)}
                                    />
                                </div>
                                <div className="hidden md:block h-full">
                                    <ActiveServiceCard
                                        service={service}
                                        rating={{ average_rating: (service as any).rating_avg, review_count: (service as any).review_count, service_id: service.id }}
                                        onEdit={() => {
                                            const slug = (service as any).service_category_id;
                                            if (slug === "lieu_de_reception") {
                                                navigate(`${basePath}/venues/${service.id}/edit`);
                                            } else if (slug === "traiteur") {
                                                navigate(`${basePath}/catering/${service.id}/edit`);
                                            } else if (slug === "piece_montee_tartes") {
                                                navigate(`${basePath}/piece-montee/${service.id}/edit`);
                                            } else if (slug === "gateau_traditionnel") {
                                                navigate(`${basePath}/gateau-trad/${service.id}/edit`);
                                            } else if (slug === "patisserie_sales") {
                                                navigate(`${basePath}/patisserie-sales/${service.id}/edit`);
                                            } else if (slug === "habilleuse") {
                                                navigate(`${basePath}/habilleuse/${service.id}/edit`);
                                            } else if (slug === "location_tenues") {
                                                navigate(`${basePath}/location-tenues/${service.id}/edit`);
                                            } else if (slug === "coiffure_beaute") {
                                                navigate(`${basePath}/coiffure-beaute/${service.id}/edit`);
                                            } else if (slug === "location_voiture") {
                                                navigate(`${basePath}/location-voiture/${service.id}/edit`);
                                            } else if (slug === "dj_orchestre") {
                                                navigate(`${basePath}/dj-orchestra/${service.id}/edit`);
                                            } else if (slug === "animation_musicale_traditionnelle") {
                                                navigate(`${basePath}/traditional-music/${service.id}/edit`);
                                            } else if (slug === "photographe") {
                                                navigate(`${basePath}/photographer/${service.id}/edit`);
                                            } else {
                                                navigate(`${basePath}/${service.id}/edit`);
                                            }
                                        }}
                                        onPreview={() => toast.info("Prévisualisation bientôt disponible")}
                                        onViewReviews={() => openReviews(service as any)}
                                        onDelete={() => setServiceToDelete(service.id)}
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Empty state — no services yet (always CTA, never blocks access) */}
                        {services.length === 0 && !adminMode && (
                            <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-[#D4D2CF] flex flex-col items-center text-center px-6">
                                <div className="w-20 h-20 bg-[#F8F5F0] rounded-full flex items-center justify-center mb-6">
                                    <Briefcase className="w-10 h-10 text-[#B79A63]/40" />
                                </div>
                                <h3 className="text-2xl font-serif text-[#1E1E1E] mb-2">Aucune prestation configurée</h3>
                                <p className="text-[#1E1E1E]/60 max-w-sm mb-2 font-sans">
                                    Créez votre première prestation dès maintenant. Votre profil sera validé par l'équipe Far7i dans un second temps.
                                </p>
                                <p className="text-[10px] text-[#B79A63] font-bold uppercase tracking-widest mb-8">
                                    ✓ Vous pouvez configurer vos prestations en attendant la validation
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-2 px-8 py-4 bg-[#1E1E1E] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#B79A63] hover:shadow-lg hover:shadow-[#B79A63]/20 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Créer ma première prestation
                                </button>
                            </div>
                        )}

                        {/* Admin empty state */}
                        {services.length === 0 && adminMode && (
                            <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-[#D4D2CF] flex flex-col items-center text-center px-6">
                                <div className="w-20 h-20 bg-[#F8F5F0] rounded-full flex items-center justify-center mb-6">
                                    <LayoutGrid className="w-10 h-10 text-[#B79A63]/40" />
                                </div>
                                <h3 className="text-2xl font-serif text-[#1E1E1E] mb-2">Aucune prestation configurée</h3>
                                <p className="text-[#1E1E1E]/60 max-w-sm mb-8 font-sans">
                                    Ce prestataire n'a pas encore configuré de prestations.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Deletion Confirmation Modal */}
            <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
                <AlertDialogContent className="bg-white border-[#D4D2CF] rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-serif text-[#1E1E1E]">Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#1E1E1E]/60 text-base">
                            Êtes-vous sûr de vouloir supprimer cette prestation ? Cette action est irréversible et supprimera toutes les données associées de la plateforme.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-4">
                        <AlertDialogCancel className="rounded-xl border-[#D4D2CF] text-[#1E1E1E]/40 font-bold uppercase tracking-widest h-12">
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest h-12 px-8 transition-all hover:shadow-lg hover:shadow-red-500/20"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer définitivement"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reviews Management Sheet */}
            <Sheet open={!!selectedServiceForReviews} onOpenChange={(open) => !open && setSelectedServiceForReviews(null)}>
                <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-[#D4D2CF] p-0 flex flex-col">
                    <SheetHeader className="p-8 border-b border-[#D4D2CF] bg-[#FDFCFB]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-[#B79A63]/10 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-[#B79A63]" />
                            </div>
                            <span className="text-[10px] font-bold text-[#B79A63] uppercase tracking-[0.2em]">Gestion des Avis</span>
                        </div>
                        <SheetTitle className="text-3xl font-serif text-[#1E1E1E]">
                            {selectedServiceForReviews?.title}
                        </SheetTitle>
                        <SheetDescription className="text-[#1E1E1E]/60 font-sans">
                            Consultez et répondez aux messages de vos clients pour améliorer votre réputation.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 bg-[#FDFCFB]/50 custom-scrollbar">
                        {loadingReviews ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-[#B79A63]" />
                                <p className="text-[10px] font-bold text-[#1E1E1E]/40 uppercase tracking-widest">Chargement des avis...</p>
                            </div>
                        ) : reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map(review => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        onResponseSaved={(reviewId, response) => {
                                            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, provider_response: response } : r));
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-[#F8F5F0] rounded-full flex items-center justify-center mb-6">
                                    <MessageSquare className="w-8 h-8 text-[#B79A63]/20" />
                                </div>
                                <h4 className="text-xl font-serif text-[#1E1E1E] mb-2">Aucun avis</h4>
                                <p className="text-sm text-[#1E1E1E]/50 max-w-xs">
                                    Ce service n'a pas encore reçu d'avis de la part des clients.
                                </p>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

const ReviewCard = ({ review, onResponseSaved }: { review: Review, onResponseSaved?: (reviewId: string, response: string) => void }) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [responseText, setResponseText] = useState(review.provider_response || '');
    const [savedResponse, setSavedResponse] = useState(review.provider_response || '');
    const [saving, setSaving] = useState(false);

    const handleSendResponse = async () => {
        if (!responseText.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ provider_response: responseText.trim() } as any)
                .eq('id', review.id);

            if (error) throw error;

            setSavedResponse(responseText.trim());
            setShowReplyInput(false);
            toast.success('Réponse enregistrée');
            onResponseSaved?.(review.id, responseText.trim());
        } catch (err: any) {
            console.error("Error saving response:", err);
            toast.error('Erreur : ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const stars = review.rating;

    return (
        <div className="bg-white border border-[#D4D2CF] rounded-2xl p-6 shadow-sm transition-all hover:border-[#B79A63] hover:shadow-md group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F8F5F0] rounded-full flex items-center justify-center text-[#B79A63] font-bold font-serif text-lg border border-[#D4D2CF]/50">
                        {review.client_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <h4 className="font-serif text-base text-[#1E1E1E] font-bold">{review.client_name}</h4>
                        <p className="text-[10px] text-[#B79A63] font-bold uppercase tracking-widest">{review.service_title}</p>
                    </div>
                </div>
                <span className="text-[10px] text-[#1E1E1E]/30 font-bold uppercase tracking-tighter shrink-0">
                    {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>

            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                        key={s}
                        className={cn(
                            "w-3.5 h-3.5",
                            s <= stars ? "text-[#B79A63] fill-[#B79A63]" : "text-[#D4D2CF] fill-transparent"
                        )}
                    />
                ))}
                <span className="text-xs text-[#1E1E1E]/40 font-bold ml-1">{stars}/5</span>
            </div>

            {/* Comment */}
            <p className="text-sm text-[#1E1E1E]/70 mb-5 font-sans italic leading-relaxed">
                "{review.comment}"
            </p>

            {/* Provider Response Section */}
            {savedResponse && !showReplyInput ? (
                <div className="bg-[#F8F5F0] rounded-xl p-4 border-l-2 border-[#B79A63]">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold text-[#B79A63] uppercase tracking-widest flex items-center gap-1">
                            <Reply className="w-3 h-3" /> Votre réponse
                        </p>
                        <button
                            onClick={() => { setShowReplyInput(true); setResponseText(savedResponse); }}
                            className="text-[10px] text-[#1E1E1E]/40 hover:text-[#B79A63] font-bold uppercase tracking-wide transition-colors"
                        >
                            Modifier
                        </button>
                    </div>
                    <p className="text-xs text-[#1E1E1E]/60 italic font-sans leading-relaxed">{savedResponse}</p>
                </div>
            ) : showReplyInput ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Reply className="w-4 h-4 text-[#B79A63]" />
                        <p className="text-xs font-bold text-[#B79A63] uppercase tracking-widest">Votre réponse</p>
                    </div>
                    <textarea
                        rows={3}
                        value={responseText}
                        onChange={e => setResponseText(e.target.value)}
                        placeholder="Remerciez ce client, répondez à ses remarques..."
                        className="w-full rounded-xl border border-[#D4D2CF] bg-[#F8F5F0] p-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#B79A63]/30 focus:border-[#B79A63] transition-all resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowReplyInput(false)}
                            className="px-4 py-2 text-xs font-bold text-[#1E1E1E]/40 hover:text-[#1E1E1E] transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSendResponse}
                            disabled={!responseText.trim() || saving}
                            className="flex items-center gap-2 px-5 py-2 bg-[#1E1E1E] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#B79A63] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Envoyer
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between pt-1">
                    <button
                        onClick={() => setShowReplyInput(true)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-[#B79A63] uppercase tracking-widest hover:text-[#1E1E1E] transition-colors opacity-70 group-hover:opacity-100"
                    >
                        <Reply className="w-3.5 h-3.5" />
                        Répondre à cet avis
                    </button>
                    <div className="flex items-center gap-1 text-[#1E1E1E]/20">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{stars >= 4 ? 'Excellent' : stars >= 3 ? 'Bon' : 'Moyen'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const OpportunityCard = ({ category, onSetup }: { category: any, onSetup: () => void }) => {
    const Icon = getCategoryIcon(category.name || category.label);

    return (
        <div className="group relative bg-[#EBE6DA]/20 border-2 border-dashed border-[#D4D2CF] rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-[#B79A63] hover:-translate-y-1">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#D4D2CF]/30 transition-colors group-hover:bg-[#B79A63]/5">
                <Icon className="w-10 h-10 text-[#1E1E1E]/20 group-hover:text-[#B79A63]/50 transition-colors" />
            </div>
            <h3 className="text-xl font-serif text-[#1E1E1E] mb-2">{category.label || category.name}</h3>
            <p className="text-sm text-[#1E1E1E]/50 mb-8 font-sans leading-relaxed">
                Configurez votre offre pour apparaître dans les recherches {category.label?.toLowerCase()}.
            </p>
            <button
                onClick={onSetup}
                className="mt-auto w-full py-4 bg-[#1E1E1E] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-[#B79A63] hover:shadow-lg hover:shadow-[#B79A63]/20"
            >
                Commencer la configuration
            </button>
        </div>
    );
};

const ActiveServiceCard = ({ service, rating, onEdit, onPreview, onViewReviews, onDelete }: { service: any, rating?: ServiceRating, onEdit: () => void, onPreview: () => void, onViewReviews: () => void, onDelete: () => void }) => {
    const Icon = getCategoryIcon(service.category_name || "");

    return (
        <div className="group bg-white border border-[#D4D2CF] rounded-2xl p-6 shadow-sm transition-all duration-300 hover:border-[#B79A63] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1E1E1E]/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F8F5F0] rounded-lg flex items-center justify-center transition-colors group-hover:bg-[#B79A63]/10">
                        <Icon className="w-5 h-5 text-[#B79A63]" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#B79A63]">
                        {service.category_name}
                    </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {service.moderation_status === 'approved' && service.modification_submitted ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
                            Modifs en attente
                        </span>
                    ) : service.moderation_status === 'pending' ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
                            En validation
                        </span>
                    ) : service.moderation_status === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-200">
                            À corriger
                        </span>
                    ) : service.moderation_status === 'incomplete' ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#F3F3F3] text-[#1E1E1E]/40">
                            Brouillon
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#E6F4EA] text-[#1E7E34]">
                            En ligne
                        </span>
                    )}
                </div>
            </div>

            <h3 className="text-2xl font-serif text-[#1E1E1E] mb-2 line-clamp-1 group-hover:text-[#B79A63] transition-colors">
                {service.title}
            </h3>

            {/* Ratings summary */}
            <button
                onClick={onViewReviews}
                className="flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity"
            >
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                            key={s}
                            className={cn(
                                "w-3 h-3",
                                s <= Math.round(rating?.average_rating || 0) ? "text-[#B79A63] fill-[#B79A63]" : "text-[#D4D2CF] fill-transparent"
                            )}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-bold text-[#1E1E1E]/40 uppercase tracking-tighter">
                    {rating && rating.review_count > 0 ? `${rating.average_rating} (${rating.review_count} avis)` : "Aucun avis"}
                </span>
            </button>

            <div className="flex items-baseline gap-2 mb-8">
                <span className="text-xs text-[#1E1E1E]/40 font-sans">À partir de</span>
                <span className="text-2xl font-bold text-[#1E1E1E] font-serif">{service.base_price?.toLocaleString()} DZD</span>
                <span className="text-[10px] text-[#1E1E1E]/50 uppercase font-black">/ {formatPriceUnit(service.price_unit)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                    onClick={onEdit}
                    className="flex items-center justify-center py-3 border border-[#1E1E1E] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[#1E1E1E] hover:text-white"
                >
                    Gérer / Modifier
                </button>
                <button
                    onClick={onPreview}
                    className="flex items-center justify-center py-3 bg-[#F8F5F0] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#1E1E1E]/60 transition-all hover:bg-[#D4D2CF] hover:text-[#1E1E1E]"
                >
                    <Eye className="w-4 h-4 mr-2" />
                    Aperçu
                </button>
            </div>

            <button
                onClick={onViewReviews}
                className="w-full mt-3 py-3 bg-[#B79A63]/10 border border-[#B79A63]/20 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#B79A63] transition-all hover:bg-[#B79A63] hover:text-white hover:shadow-lg hover:shadow-[#B79A63]/20 flex items-center justify-center gap-2"
            >
                <MessageSquare className="w-3.5 h-3.5" />
                Gérer les avis
            </button>
            <button
                onClick={onDelete}
                className="w-full mt-3 py-2 text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
            >
                Supprimer la prestation
            </button>
        </div>
    );
};

const CompactServiceCard = ({ service, onEdit, onViewReviews }: { service: any, onEdit: () => void, onViewReviews: () => void }) => {
    const Icon = getCategoryIcon(service.category_name || "");

    return (
        <div className="flex flex-col gap-2">
            <div
                onClick={onEdit}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[#D4D2CF] active:scale-[0.98] transition-all"
            >
                <div className="w-14 h-14 rounded-xl bg-[#F8F5F0] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#D4D2CF]/30 text-[#B79A63]">
                    {service.image_url ? (
                        <img src={service.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Icon className="w-6 h-6" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-serif font-bold text-[#1E1E1E] truncate">{service.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-[#B79A63] uppercase tracking-wider">{service.category_name}</span>
                        <span className="w-1 h-1 rounded-full bg-[#D4D2CF]" />
                        <span className="text-[10px] font-bold text-[#1E1E1E]/50 uppercase tracking-tighter">
                            {service.base_price?.toLocaleString()} DZD
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 pr-1 text-[#1E1E1E]/30">
                    <div className="flex flex-col items-end gap-1">
                        {service.moderation_status === 'approved' && service.modification_submitted ? (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-700">
                                Modifs
                            </span>
                        ) : service.moderation_status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-700">
                                Validation
                            </span>
                        ) : service.moderation_status === 'incomplete' ? (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-[#F3F3F3] text-[#1E1E1E]/40">
                                Draft
                            </span>
                        ) : service.moderation_status === 'rejected' ? (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-700">
                                Refusé
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-[#E6F4EA] text-[#1E7E34]">
                                Actif
                            </span>
                        )}
                    </div>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onViewReviews(); }}
                className="w-full py-3 bg-[#B79A63]/5 border border-[#B79A63]/10 rounded-xl text-[9px] font-extrabold uppercase tracking-widest text-[#B79A63] flex items-center justify-center gap-2"
            >
                <MessageSquare className="w-3 h-3" />
                Gérer les avis
            </button>
        </div>
    );
};

function getCategoryIcon(name: string) {
    const n = name?.toLowerCase() || "";
    if (n.includes("photo") || n.includes("vidéo")) return Camera;
    if (n.includes("musique") || n.includes("dj") || n.includes("orchestre")) return Music;
    if (n.includes("traiteur") || n.includes("gâteau") || n.includes("food")) return UtensilsCrossed;
    if (n.includes("salle") || n.includes("lieu")) return Building2;
    if (n.includes("déco") || n.includes("fleur")) return Sparkles;
    if (n.includes("voiture")) return Car;
    if (n.includes("vêtement") || n.includes("caftan") || n.includes("habit")) return Shirt;
    return Briefcase;
}

function formatPriceUnit(unit: string) {
    switch (unit) {
        case 'event': return 'évènement';
        case 'hour': return 'heure';
        case 'day': return 'jour';
        case 'person': return 'personne';
        case 'package': return 'forfait';
        default: return unit;
    }
}
