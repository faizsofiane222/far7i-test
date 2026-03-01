import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Store, Plus, Eye, Edit, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { GildedInput } from "@/components/ui/gilded-input";
import { UnifiedCard, UnifiedBadge, UnifiedButton } from "@/components/unified";
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

interface Provider {
    id: string;
    commercial_name: string;
    user_id: string | null;
    moderation_status: 'pending' | 'approved' | 'rejected' | 'incomplete';
    avatar_url?: string;
    created_at: string;
    contact_phone?: string;
    contact_email?: string;
    category?: string;
    wilaya?: string;
    main_wilaya_name?: string; // Main wilaya from providers.wilaya_id
    categories?: string[]; // Array maintained for backwards compatibility in UI
    travel_zones?: string[]; // Travel zones from provider_travel_zones
}

type SortField = 'commercial_name' | 'moderation_status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

export default function AdminProviders() {
    const navigate = useNavigate();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedWilaya, setSelectedWilaya] = useState<string>("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            setLoading(true);
            console.log("Fetching providers...");

            // First, get all providers
            const { data: providersData, error } = await supabase
                .from('providers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            console.log("Providers fetched:", providersData);

            // Fetch all categories once to avoid N+1 queries
            const { data: allCategoriesData } = await supabase
                .from('service_categories')
                .select('slug, name');
            const categoriesMap = new Map((allCategoriesData || []).map(c => [c.slug, c.name]));

            // Then, for each provider, fetch wilaya
            const providersWithData = await Promise.all(
                (providersData || []).map(async (provider) => {
                    try {
                        // Fetch main wilaya if wilaya_id exists
                        let mainWilayaName = null;
                        if (provider.wilaya_id) {
                            const { data: wilayaData } = await supabase
                                .from('wilayas')
                                .select('name')
                                .eq('id', provider.wilaya_id)
                                .single();
                            mainWilayaName = wilayaData?.name || null;
                        }

                        const catName = provider.category_slug ? categoriesMap.get(provider.category_slug) : null;

                        return {
                            ...provider,
                            main_wilaya_name: mainWilayaName,
                            categories: catName ? [catName] : []
                        };
                    } catch (err) {
                        console.error(`Error fetching relations for provider ${provider.id}:`, err);
                        return {
                            ...provider,
                            main_wilaya_name: null,
                            categories: []
                        };
                    }
                })
            );

            setProviders(providersWithData as Provider[]);
        } catch (error) {
            console.error("Error fetching providers:", error);
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories and wilayas for filter dropdowns
    const uniqueCategories = [...new Set(providers.flatMap(p => p.categories || []))].sort();
    const uniqueWilayas = [...new Set(providers.map(p => p.main_wilaya_name).filter(Boolean))].sort();

    // Filter providers
    const filteredProviders = providers.filter(provider => {
        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            const matchesSearch = provider.commercial_name?.toLowerCase().includes(searchLower) ||
                provider.contact_email?.toLowerCase().includes(searchLower) ||
                provider.categories?.some(cat => cat.toLowerCase().includes(searchLower)) ||
                provider.main_wilaya_name?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // Category filter
        if (selectedCategory && !provider.categories?.includes(selectedCategory)) {
            return false;
        }

        // Wilaya filter
        if (selectedWilaya && provider.main_wilaya_name !== selectedWilaya) {
            return false;
        }

        return true;
    });

    // Sort providers
    const sortedProviders = [...filteredProviders].sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            return sortDirection === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
    });

    // Paginate
    const totalPages = Math.ceil(sortedProviders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProviders = sortedProviders.slice(startIndex, endIndex);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const handleCreateProvider = () => {
        navigate("/admin/providers/new");
    };

    const handleEditProvider = (id: string) => {
        navigate(`/admin/providers/${id}`);
    };

    const handleViewProvider = (id: string) => {
        window.open(`/providers/${id}`, '_blank');
    };

    const handleDeleteProvider = async () => {
        if (!providerToDelete) return;

        try {
            const { error } = await supabase
                .from('providers')
                .delete()
                .eq('id', providerToDelete);

            if (error) throw error;

            await fetchProviders();
            setDeleteDialogOpen(false);
            setProviderToDelete(null);
        } catch (error) {
            console.error("Error deleting provider:", error);
            alert("Erreur lors de la suppression du prestataire");
        }
    };

    const getStatusBadge = (status: string, hasUser: boolean) => {
        // Shadow mode: No user_id
        if (!hasUser) {
            return <UnifiedBadge status="draft" size="md">Shadow</UnifiedBadge>;
        }

        switch (status) {
            case 'approved':
                return <UnifiedBadge status="approved" size="md" />;
            case 'pending':
                return <UnifiedBadge status="pending" size="md" />;
            case 'incomplete':
                return <UnifiedBadge status="draft" size="md">Incomplet</UnifiedBadge>;
            case 'rejected':
                return <UnifiedBadge status="rejected" size="md" />;
            default:
                return null;
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ChevronsUpDown className="w-4 h-4 text-slate-300" />;
        }
        return sortDirection === 'asc'
            ? <ChevronUp className="w-4 h-4 text-[#B79A63]" />
            : <ChevronDown className="w-4 h-4 text-[#B79A63]" />;
    };

    return (
        <AdminLayout>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1E1E1E]">
                            Mes Prestataires
                        </h1>
                        <p className="text-[#1E1E1E]/60 font-lato">
                            Gérez la liste des partenaires inscrits sur la plateforme.
                            {filteredProviders.length > 0 && (
                                <span className="ml-1 font-bold text-[#9CA986]">
                                    ({filteredProviders.length} {filteredProviders.length === 1 ? 'prestataire' : 'prestataires'})
                                </span>
                            )}
                        </p>
                    </div>
                    <UnifiedButton
                        onClick={handleCreateProvider}
                        variant="primary"
                        size="md"
                        icon={<Plus className="w-4 h-4" />}
                        iconPosition="left"
                    >
                        Nouveau Prestataire
                    </UnifiedButton>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-[#D4D2CF] shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E1E1E]/40" />
                        <GildedInput
                            placeholder="Rechercher par nom, email, catégorie ou wilaya..."
                            className="pl-10 bg-[#F8F5F0] border-none"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-[#D4D2CF] shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Category Filter */}
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/60 mb-2">
                                Catégorie
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2.5 bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl text-[#1E1E1E] font-medium focus:outline-none focus:ring-2 focus:ring-[#B79A63] focus:border-transparent transition-all"
                            >
                                <option value="">Toutes les catégories</option>
                                {uniqueCategories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Wilaya Filter */}
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1E1E]/60 mb-2">
                                Wilaya
                            </label>
                            <select
                                value={selectedWilaya}
                                onChange={(e) => {
                                    setSelectedWilaya(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2.5 bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl text-[#1E1E1E] font-medium focus:outline-none focus:ring-2 focus:ring-[#B79A63] focus:border-transparent transition-all"
                            >
                                <option value="">Toutes les wilayas</option>
                                {uniqueWilayas.map(wilaya => (
                                    <option key={wilaya} value={wilaya}>
                                        {wilaya}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reset Filters Button */}
                        {(selectedCategory || selectedWilaya) && (
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSelectedCategory("");
                                        setSelectedWilaya("");
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2.5 bg-[#1E1E1E]/5 text-[#1E1E1E] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#1E1E1E]/10 transition-colors whitespace-nowrap"
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-[#D4D2CF] shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#B79A63]" />
                        </div>
                    ) : paginatedProviders.length === 0 ? (
                        <div className="p-12 text-center">
                            <Store className="w-12 h-12 mx-auto mb-4 text-[#1E1E1E]/20" />
                            <p className="text-[#1E1E1E]/60 font-lato">
                                {search
                                    ? "Aucun prestataire ne correspond à votre recherche."
                                    : "Aucun prestataire trouvé."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#F8F5F0] border-b border-[#D4D2CF]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <button
                                                    onClick={() => handleSort('commercial_name')}
                                                    className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#1E1E1E] hover:text-[#B79A63] transition-colors"
                                                >
                                                    Nom Commercial
                                                    <SortIcon field="commercial_name" />
                                                </button>
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                <span className="font-bold text-xs uppercase tracking-wider text-[#1E1E1E]">
                                                    Wilaya
                                                </span>
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                <span className="font-bold text-xs uppercase tracking-wider text-[#1E1E1E]">
                                                    Catégorie
                                                </span>
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                <button
                                                    onClick={() => handleSort('moderation_status')}
                                                    className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#1E1E1E] hover:text-[#B79A63] transition-colors"
                                                >
                                                    Statut
                                                    <SortIcon field="moderation_status" />
                                                </button>
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                <span className="font-bold text-xs uppercase tracking-wider text-[#1E1E1E]">
                                                    Actions
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#D4D2CF]">
                                        {paginatedProviders.map((provider) => (
                                            <tr
                                                key={provider.id}
                                                className="hover:bg-[#F8F5F0]/50 transition-colors cursor-pointer"
                                                onClick={() => handleEditProvider(provider.id)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {provider.avatar_url ? (
                                                            <img
                                                                src={provider.avatar_url}
                                                                alt={provider.commercial_name}
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-[#D4D2CF]"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9CA986] to-[#B79A63] flex items-center justify-center border-2 border-[#D4D2CF]">
                                                                <span className="text-white font-serif font-bold text-sm">
                                                                    {provider.commercial_name?.[0]?.toUpperCase() || "?"}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-[#1E1E1E]">
                                                                {provider.commercial_name || "Sans Nom"}
                                                            </div>
                                                            {provider.contact_email && (
                                                                <div className="text-xs text-[#1E1E1E]/60">
                                                                    {provider.contact_email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {provider.main_wilaya_name ? (
                                                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200">
                                                            {provider.main_wilaya_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {provider.categories && provider.categories.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {provider.categories.slice(0, 2).map((category, idx) => (
                                                                <span key={idx} className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs border border-purple-200">
                                                                    {category}
                                                                </span>
                                                            ))}
                                                            {provider.categories.length > 2 && (
                                                                <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs border border-purple-300 font-bold">
                                                                    +{provider.categories.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(provider.moderation_status, !!provider.user_id)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewProvider(provider.id);
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#1E1E1E] transition-colors"
                                                            title="Voir le profil public"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditProvider(provider.id);
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-[#B79A63]/10 flex items-center justify-center text-slate-400 hover:text-[#B79A63] transition-colors"
                                                            title="Éditer"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setProviderToDelete(provider.id);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-4 py-3 border-t border-[#D4D2CF] flex items-center justify-between bg-[#F8F5F0]">
                                    <div className="text-sm text-[#1E1E1E]/60">
                                        Page {currentPage} sur {totalPages} • {sortedProviders.length} résultat{sortedProviders.length > 1 ? 's' : ''}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-8 h-8 rounded-lg border border-[#D4D2CF] flex items-center justify-center hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(page => {
                                                    return page === 1 ||
                                                        page === totalPages ||
                                                        Math.abs(page - currentPage) <= 1;
                                                })
                                                .map((page, idx, arr) => {
                                                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                                                    return (
                                                        <div key={page} className="flex items-center gap-1">
                                                            {showEllipsis && <span className="px-2 text-[#1E1E1E]/40">...</span>}
                                                            <button
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${currentPage === page
                                                                    ? 'bg-[#B79A63] text-white'
                                                                    : 'border border-[#D4D2CF] hover:bg-white'
                                                                    }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-8 h-8 rounded-lg border border-[#D4D2CF] flex items-center justify-center hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce prestataire ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProviderToDelete(null)}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProvider}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout >
    );
}
