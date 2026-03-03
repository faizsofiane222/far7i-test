import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Edit, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { GildedButton } from "@/components/ui/gilded-button";
import { UnifiedCard, UnifiedBadge, UnifiedButton } from "@/components/unified";
import { ModerationTabs } from "@/components/admin/ModerationTabs";
import { NewProviderCard } from "@/components/admin/NewProviderCard";
import { NewServiceCard } from "@/components/admin/NewServiceCard";
import { ReviewModerationCard } from "@/components/admin/ReviewModerationCard";
import { ModificationDiff } from "./ModificationDiff";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

// Field labels mapping
const FIELD_LABELS: Record<string, string> = {
    commercial_name: "Nom Commercial",
    bio: "Biographie",
    phone_number: "Téléphone",
    wilaya_id: "Wilaya",
    social_link: "Réseau Social",
    website_link: "Site Web",
    willingness_to_travel: "Déplacement",
    title: "Titre du service",
    description: "Description",
    base_price: "Prix de base",
    price_unit: "Unité de prix",
    short_pitch: "Phrase d'accroche",
    is_active: "Actif",
    media: "Photos & Vidéos",
    inclusions: "Inclusions",
    options: "Options",
    faqs: "FAQ"
};

export default function AdminModeration() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('new');

    // Data
    const [stats, setStats] = useState<any>({
        new_providers: 0,
        pending_provider_changes: 0,
        pending_service_changes: 0,
        pending_reviews: 0,
        approved_today: 0,
        rejected_today: 0
    });
    const [debug, setDebug] = useState<any>({});
    const [newProviders, setNewProviders] = useState<any[]>([]);
    const [newServices, setNewServices] = useState<any[]>([]);
    const [pendingProviders, setPendingProviders] = useState<any[]>([]);
    const [pendingServices, setPendingServices] = useState<any[]>([]);
    const [pendingReviews, setPendingReviews] = useState<any[]>([]);

    // Selection state for modifications
    const [selectedItem, setSelectedItem] = useState<{ type: 'provider' | 'service', data: any } | null>(null);

    useEffect(() => {
        fetchAllData();

        // Real-time listener for the moderation page
        const subscription = supabase
            .channel('moderation_page_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => fetchAllData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => fetchAllData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => fetchAllData())
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchStats(),
                fetchNewProviders(),
                fetchNewServices(),
                fetchPendingChanges(),
                fetchPendingReviews()
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data, error } = await (supabase.rpc as any)('get_moderation_stats');
            if (error) throw error;
            if (data) setStats(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchNewProviders = async () => {
        try {
            const { data, error } = await supabase
                .from('providers')
                .select('*')
                .eq('moderation_status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Fetch error:", error);
                setDebug(prev => ({ ...prev, newProvidersError: error.message }));
                throw error;
            }

            setNewProviders(data || []);
            setDebug(prev => ({ ...prev, newProvidersCount: (data || []).length }));
        } catch (error) {
            console.error("Error fetching new providers:", error);
        }
    };

    const fetchNewServices = async () => {
        try {
            // Dans le nouveau modèle, "Le prestataire est la prestation".
            // Il n'y a plus de table services. On renvoie un tableau vide pour ne pas casser l'UI.
            setNewServices([]);
        } catch (error) {
            console.error("Error fetching new services:", error);
        }
    };

    const fetchPendingChanges = async () => {
        try {
            // Fetch Pending Provider Changes
            const { data: providers } = await (supabase
                .from('providers')
                .select('*')
                .eq('modification_submitted', true)
                .not('pending_changes', 'is', null) as any);

            // Dans le nouveau modèle, on ne modère que les profils de prestataires.
            setPendingProviders(providers || []);
            setPendingServices([]);
            setDebug(prev => ({ ...prev, pendingProvidersCount: (providers || []).length, pendingServicesCount: 0 }));
        } catch (error: any) {
            console.error("Error fetching changes:", error);
            setDebug(prev => ({ ...prev, changesError: error.message }));
        }
    };

    const fetchPendingReviews = async () => {
        try {
            const { data } = await supabase
                .from('reviews')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setPendingReviews(data || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    // New Provider Actions
    const handleApproveNewProvider = async (providerId: string) => {
        try {
            const { error } = await (supabase.rpc as any)('approve_provider_with_notification', {
                provider_id: providerId
            });
            if (error) throw error;
            toast.success("Prestataire approuvé");
            fetchAllData();
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Erreur lors de l'approbation");
        }
    };

    const handleRejectNewProvider = async (providerId: string, reason: string) => {
        try {
            const { error } = await (supabase.rpc as any)('reject_provider_with_notification', {
                provider_id: providerId,
                reason: reason
            });
            if (error) throw error;
            toast.success("Prestataire rejeté");
            fetchAllData();
        } catch (error) {
            console.error("Rejection error:", error);
            toast.error("Erreur lors du rejet");
        }
    };

    const handleApproveNewService = async (serviceId: string) => {
        try {
            const { error } = await (supabase.rpc as any)('approve_service_with_notification', {
                service_id: serviceId
            });
            if (error) throw error;
            toast.success("Service approuvé");
            fetchAllData();
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Erreur lors de l'approbation");
        }
    };

    const handleRejectNewService = async (serviceId: string, reason: string) => {
        try {
            const { error } = await (supabase.rpc as any)('reject_service_with_notification', {
                service_id: serviceId,
                reason: reason
            });
            if (error) throw error;
            toast.success("Service rejeté");
            fetchAllData();
        } catch (error) {
            console.error("Rejection error:", error);
            toast.error("Erreur lors du rejet");
        }
    };

    // Modification Actions
    const handleApproveChange = async () => {
        if (!selectedItem) return;

        try {
            const { error } = await (supabase.rpc as any)(
                selectedItem.type === 'provider' ? 'approve_provider_changes' : 'approve_service_changes',
                selectedItem.type === 'provider'
                    ? { target_provider_id: selectedItem.data.id }
                    : { target_service_id: selectedItem.data.id }
            );

            if (error) throw error;
            toast.success("Modifications approuvées");
            setSelectedItem(null);
            fetchAllData();
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Erreur lors de l'approbation");
        }
    };

    const handleRejectChange = async (reason: string) => {
        if (!selectedItem) return;

        try {
            const { error } = await (supabase.rpc as any)(
                selectedItem.type === 'provider' ? 'reject_provider_changes' : 'reject_service_changes',
                selectedItem.type === 'provider'
                    ? { target_provider_id: selectedItem.data.id, reason }
                    : { target_service_id: selectedItem.data.id, reason }
            );

            if (error) throw error;
            toast.success("Modifications rejetées");
            setSelectedItem(null);
            fetchAllData();
        } catch (error) {
            console.error("Rejection error:", error);
            toast.error("Erreur lors du rejet");
        }
    };

    // Review Actions
    const handleApproveReview = async (reviewId: string) => {
        try {
            const { error } = await (supabase.rpc as any)('approve_review_with_notification', {
                review_id: reviewId
            });
            if (error) throw error;
            toast.success("Avis approuvé");
            fetchAllData();
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Erreur lors de l'approbation");
        }
    };

    const handleRejectReview = async (reviewId: string, reason: string) => {
        try {
            const { error } = await (supabase.rpc as any)('reject_review_with_notification', {
                review_id: reviewId,
                reason: reason
            });
            if (error) throw error;
            toast.success("Avis rejeté");
            fetchAllData();
        } catch (error) {
            console.error("Rejection error:", error);
            toast.error("Erreur lors du rejet");
        }
    };

    const tabs = [
        { id: 'new', label: 'Nouveaux', badge: stats.new_providers + newServices.length, icon: <UserPlus className="w-4 h-4" /> },
        { id: 'modifications', label: 'Modifications', badge: stats.pending_provider_changes + stats.pending_service_changes, icon: <Edit className="w-4 h-4" /> },
        { id: 'reviews', label: 'Avis', badge: stats.pending_reviews, icon: <MessageSquare className="w-4 h-4" /> },
    ];

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-2">
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E]">
                        Modération
                    </h1>
                    <p className="text-[#1E1E1E]/60 text-sm font-lato">
                        Validez ou rejetez les demandes de modifications et les nouveaux prestataires.
                    </p>
                </div>

                <ModerationTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#B79A63]" />
                    </div>
                ) : (
                    <>
                        {/* New Providers Tab */}
                        {activeTab === 'new' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold font-serif">
                                    Nouveaux Prestataires ({newProviders.length})
                                </h2>
                                {newProviders.length === 0 ? (
                                    <p className="text-slate-400 italic text-sm">Aucun nouveau prestataire en attente.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {newProviders.map(provider => (
                                            <NewProviderCard
                                                key={provider.id}
                                                provider={provider}
                                                onApprove={handleApproveNewProvider}
                                                onReject={handleRejectNewProvider}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* New Services Section */}
                                <div className="pt-8 space-y-4 border-t border-slate-100">
                                    <h2 className="text-xl font-bold font-serif">
                                        Nouveaux Services ({newServices.length})
                                    </h2>
                                    {newServices.length === 0 ? (
                                        <p className="text-slate-400 italic text-sm">Aucun nouveau service en attente.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {newServices.map(service => (
                                                <NewServiceCard
                                                    key={service.id}
                                                    service={service}
                                                    onApprove={handleApproveNewService}
                                                    onReject={handleRejectNewService}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Modifications Tab */}
                        {activeTab === 'modifications' && (
                            <div className="space-y-8">
                                {/* Providers */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold font-serif">
                                        Profils Prestataires ({pendingProviders.length})
                                    </h2>
                                    {pendingProviders.length === 0 ? (
                                        <p className="text-slate-400 italic text-sm">Aucune modification de profil en attente.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pendingProviders.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setSelectedItem({ type: 'provider', data: p })}
                                                    className="bg-white p-6 rounded-2xl border border-[#D4D2CF] hover:border-[#B79A63] cursor-pointer transition-all shadow-sm group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-[#1E1E1E] group-hover:text-[#B79A63] transition-colors">
                                                            {p.commercial_name}
                                                        </h3>
                                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                                            En attente
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-4">
                                                        {p.commercial_name}
                                                    </p>
                                                    <div className="text-[10px] text-slate-400">
                                                        Modifié le {new Date(p.updated_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Services */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold font-serif">
                                        Services & Offres ({pendingServices.length})
                                    </h2>
                                    {pendingServices.length === 0 ? (
                                        <p className="text-slate-400 italic text-sm">Aucune modification de service en attente.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pendingServices.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => setSelectedItem({ type: 'service', data: s })}
                                                    className="bg-white p-6 rounded-2xl border border-[#D4D2CF] hover:border-[#B79A63] cursor-pointer transition-all shadow-sm group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-[#1E1E1E] group-hover:text-[#B79A63] transition-colors line-clamp-1">
                                                            {s.title}
                                                        </h3>
                                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap">
                                                            En attente
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-4">
                                                        Par : {(s.providers as any)?.commercial_name}
                                                    </p>
                                                    <div className="text-[10px] text-slate-400">
                                                        Modifié le {new Date(s.updated_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold font-serif">
                                    Avis en Attente ({pendingReviews.length})
                                </h2>
                                {pendingReviews.length === 0 ? (
                                    <p className="text-slate-400 italic text-sm">Aucun avis en attente de modération.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pendingReviews.map(review => (
                                            <ReviewModerationCard
                                                key={review.id}
                                                review={review}
                                                onApprove={handleApproveReview}
                                                onReject={handleRejectReview}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Modification Diff Dialog */}
                <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#FDFCFB] border-[#B79A63]/20">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-2xl">
                                Valider les changements
                            </DialogTitle>
                            <DialogDescription>
                                Comparez la version actuelle avec les modifications demandées.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedItem && (
                            <ModificationDiff
                                originalData={selectedItem.data}
                                pendingData={(selectedItem.data as any).pending_changes}
                                onApprove={handleApproveChange}
                                onReject={handleRejectChange}
                                labels={FIELD_LABELS}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
